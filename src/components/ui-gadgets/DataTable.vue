<template>
  <div class="q-pa-xs q-pa-md-none">
    <!-- Options and Controls -->
    <div class="row q-pb-sm items-center">
      <div class="col-12 col-md-8">
        <!-- Options -->
        <q-btn
          v-if="availableFilters.length > 0"
          flat
          round
          color="primary"
          size="sm"
          icon="fas fa-filter"
          @click="showFilterPanel = !showFilterPanel"
        >
          <q-tooltip
            >Filtros da tabela
            {{ activeFiltersCount > 0 ? `(${activeFiltersCount})` : '' }}</q-tooltip
          >
          <!-- Active filter badge -->
          <q-badge v-if="activeFiltersCount > 0" color="red" floating rounded transparent>
            {{ activeFiltersCount }}
          </q-badge>
        </q-btn>
        <q-btn flat round color="primary" size="sm" icon="fas fa-sync" @click="reload()">
          <q-tooltip>Atualizar lista</q-tooltip>
        </q-btn>
        <q-btn flat round color="primary" size="sm" icon="fas fa-columns">
          <q-tooltip>Colunas visíveis</q-tooltip>
          <q-menu class="q-pa-sm">
            <q-option-group
              v-model="visibleColumns"
              type="checkbox"
              :options="columnOptions"
            ></q-option-group>
          </q-menu>
        </q-btn>
        <q-btn
          :disable="fullData.length === 0"
          v-if="!!Export"
          flat
          round
          color="primary"
          size="sm"
          icon="fas fa-file-download"
        >
          <q-tooltip>Opções de Exportação</q-tooltip>
          <q-menu class="q-pa-sm">
            <q-list class="text-primary">
              <q-item
                v-close-popup
                dense
                v-for="(opt, idx) in exportOptions"
                :key="idx"
                clickable
                @click="exportFile(opt.filetype, opt.filename)"
              >
                <q-item-section avatar>
                  <q-icon :name="opt.icon" size="xs"></q-icon>
                </q-item-section>
                <q-item-section>
                  {{ opt.label }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn
          :disable="fullData.length === 0"
          v-if="!!Printable"
          flat
          round
          color="primary"
          size="sm"
          icon="fas fa-print"
          @click="printData()"
        >
          <q-tooltip>Imprimir</q-tooltip>
        </q-btn>

        <!-- Custom Resources -->
        <q-btn
          v-for="(r, i) in CustomResources"
          :key="i"
          :disable="fullData.length === 0"
          flat
          round
          color="primary"
          size="sm"
          :icon="r.icon ?? 'fas fa-gear'"
          @click="handleItemClick(r)"
        >
          <q-tooltip>{{ r.label ?? 'Recurso personalizado' }}</q-tooltip>
          <q-menu v-if="itemHasChildren(r)" class="q-pa-sm">
            <q-list class="text-primary">
              <q-item
                v-for="(opt, idx) in r.children"
                :key="idx"
                v-close-popup
                dense
                clickable
                @click="
                  opt.fn({
                    fullData,
                    rawData,
                    filters: filtersValues,
                    ...opt.params,
                  })
                "
              >
                <q-item-section v-if="opt.icon" avatar
                  ><q-icon :name="opt.icon" size="xs"
                /></q-item-section>
                <q-item-section>{{ opt.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

      <!-- Search Field -->
      <div class="col-12 col-md-4">
        <q-input
          v-if="hasSearchableColumns"
          dense
          square
          filled
          clearable
          label="Pesquisar na lista"
          v-model="searchTerm"
        >
          <template v-slot:append>
            <q-icon size="xs" name="fas fa-search" color="grey-8" /> </template
        ></q-input>
      </div>
    </div>

    <q-separator></q-separator>

    <!-- Filters Panel -->
    <div v-if="availableFilters.length > 0" class="row">
      <div class="col-12">
        <q-expansion-item hide-expand-icon v-model="showFilterPanel" header-style="display:none;">
          <q-toolbar class="bg-grey-3">
            <q-toolbar-title> Filtros da Tabela </q-toolbar-title>
            <q-btn
              size="sm"
              icon="fas fa-filter-circle-xmark"
              color="primary"
              flat
              round
              dense
              @click="filterParams = {}"
            >
              <q-tooltip>Limpar filtros</q-tooltip>
            </q-btn>
          </q-toolbar>
          <div class="row q-py-sm">
            <div v-for="(f, i) in availableFilters" :key="i" class="col-12 col-md-4">
              <InputField
                clearable
                dense
                :type="f.type"
                :withSeconds="f.filterOptions?.withSeconds"
                :Label="`Filtrar por ${f.label}`"
                :Options="f.options ?? []"
                v-model="filterParams[f.field]"
                :Default="f.default !== null && typeof f.default != 'undefined' ? f.default : null"
              >
              </InputField>
            </div>
          </div>
        </q-expansion-item>
      </div>
    </div>

    <q-separator></q-separator>

    <!-- Table -->
    <div class="datatable-container">
      <table>
        <thead>
          <tr>
            <th
              v-show="visibleColumns.includes(column.field) || column.name == 'actions'"
              :class="`${dense ? 'q-pa-xs' : 'q-pa-sm'} ${
                column.sortable !== false ? 'cursor-pointer' : ''
              }`"
              v-for="column in columns"
              :key="column.field"
              @click="sort(column)"
              :style="column.width ? `width: ${column.width};` : ''"
            >
              <span>{{ column.label }}</span>
              <q-icon
                v-if="column.sortable !== false"
                size="0.9em"
                :name="getSortIcon(column)"
                :color="getColumnNumber(column) == pagination.sortBy ? 'primary' : null"
              >
              </q-icon>
              <q-tooltip v-if="column.sortable !== false"
                >Clique para ordenar p/ {{ column.label }}</q-tooltip
              >
            </th>
          </tr>
        </thead>

        <!-- Ready State -->
        <tbody v-if="state == 'ready'">
          <template v-for="(row, idx) in rows" :key="idx">
            <tr v-if="row != 'interval'">
              <td
                v-show="visibleColumns.includes(column.field) || column.name == 'actions'"
                :class="`${dense ? 'q-pa-xs' : 'q-pa-sm'} ${
                  !!column.align ? `text-${column.align}` : ''
                }`"
                v-for="column in columns"
                :key="column.field"
                :style="column.width ? `width: ${column.width};` : ''"
              >
                <div v-if="column.name != 'actions'">
                  <!-- In case no template is set for the td-->
                  <div v-if="!(`cell-${column.name}` in $slots)">
                    {{ column.format ? column.format(row[column.field]) : row[column.field] }}
                  </div>

                  <!-- In case a template is set for the td-->
                  <div v-if="`cell-${column.name}` in $slots">
                    <slot :name="`cell-${column.name}`" :data="row"></slot>
                  </div>
                </div>

                <!-- Especial td of actions -->
                <div class="text-center" v-if="column.name == 'actions' && showActionsColumn">
                  <q-btn
                    v-if="showActionsBtnInRow(row)"
                    flat
                    dense
                    color="primary"
                    icon="fas fa-ellipsis-v"
                  >
                    <q-tooltip>Ações do registro</q-tooltip>
                    <q-menu>
                      <q-list>
                        <q-item
                          class="text-primary"
                          v-show="typeof a.hide == 'function' ? !a.hide(row) : !a.hide"
                          v-for="(a, idx) in RowActions"
                          :key="idx"
                          clickable
                          v-close-popup
                          @click="a.fn(row)"
                        >
                          <q-item-section v-if="a.icon" side>
                            <q-icon color="primary" size="sm" :name="a.icon"></q-icon>
                          </q-item-section>
                          <q-item-section>{{ a.label }}</q-item-section>
                          <q-tooltip v-if="a.tooltip">{{ a.tooltip }}</q-tooltip>
                        </q-item>
                        <q-item
                          class="text-primary"
                          v-show="typeof a.hide == 'function' ? !a.hide(row) : !a.hide"
                          v-for="(a, idx) in injectedRowActions(row)"
                          :key="idx"
                          clickable
                          v-close-popup
                          @click="a.fn(row)"
                        >
                          <q-item-section v-if="a.icon" side>
                            <q-icon color="primary" size="sm" :name="a.icon"></q-icon>
                          </q-item-section>
                          <q-item-section>{{ a.label }}</q-item-section>
                          <q-tooltip v-if="a.tooltip">{{ a.tooltip }}</q-tooltip>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </td>
            </tr>
            <tr v-else>
              <td :colspan="columns.length" :class="`${dense ? 'q-pa-xs' : 'q-pa-sm'}`">
                <slot
                  name="interval-row"
                  :data="{
                    previous: dataInPage[idx - 1],
                    current: dataInPage,
                    next: dataInPage[idx + 1],
                  }"
                >
                </slot>
              </td>
            </tr>
          </template>
        </tbody>

        <!-- Error State -->
        <tbody v-if="state == 'error'">
          <tr>
            <td class="q-pa-lg text-center text-red-3" :colspan="columns.length">
              <div>
                <div><q-icon size="lg" name="fas fa-bomb"></q-icon></div>
                <div class="text-h6">ERRO!</div>
                <div class="text-caption">
                  <b>{{ error.response.status }}</b>
                  {{ error.response.statusText }}
                </div>
                <small>Favor entrar em contato com o administrador do sistema.</small>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Empty State -->
        <tbody v-if="state == 'empty'">
          <tr>
            <td class="q-pa-lg text-center text-grey-8" :colspan="columns.length">
              <div>
                <div><q-icon size="lg" name="far fa-folder-open"></q-icon> *</div>
                <div class="text-h6">Lista Vazia.</div>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Loading State -->
        <tbody v-if="state == 'loading'">
          <tr>
            <td class="q-pa-lg text-center text-grey-8" :colspan="columns.length">
              <div><q-spinner-gears size="lg" /></div>
              <div class="text-caption">Carregando...</div>
            </td>
          </tr>
        </tbody>

        <tfoot v-if="hasAnyColumnFooter || 'footer' in $slots">
          <tr class="text-bold">
            <td
              v-show="visibleColumns.includes(column.field) || column.name == 'actions'"
              :class="`${dense ? 'q-pa-xs' : 'q-pa-sm'} ${
                !!column.align ? `text-${column.align}` : ''
              }`"
              v-for="column in columns"
              :key="column.field"
              :style="column.width ? `width: ${column.width};` : ''"
            >
              <div v-if="!!column.footer">
                <div v-if="`foot-${column.name}` in $slots">
                  <slot :name="`foot-${column.name}`"></slot>
                </div>
                <div v-else>
                  {{ typeof column.footer == 'function' ? column.footer(fullData) : column.footer }}
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="'footer' in $slots">
            <slot :name="`footer`"></slot>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="!IgnorePagination" class="row q-mt-lg" v-show="state == 'ready'">
      <div class="col-12 q-py-sm">
        <q-separator></q-separator>
      </div>
      <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : ''}`">
        <div>
          Mostrar até
          <select class="q-pa-xs" v-model="pagination.limit">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          registros de um total de
          <b v-if="fullData.length">{{ fullData.length }}</b>
          <q-spinner-gears v-else size="xs" />.
        </div>
      </div>
      <div :class="`col-12 col-md-6 ${$q.screen.gt.sm ? 'text-right' : 'text-center q-mt-md'}`">
        <q-btn :disable="fullData.length === 0" color="primary" @click="goToPage(1)">
          <q-tooltip>Primeira Página</q-tooltip>
          <q-icon size="xs" name="fas fa-angles-left"></q-icon>
        </q-btn>
        <q-btn color="primary" @click="goToPage('prev')">
          <q-tooltip>Página Anterior</q-tooltip>
          <q-icon size="xs" name="fas fa-chevron-left"></q-icon>
        </q-btn>
        <q-btn
          class="q-px-sm"
          color="primary"
          v-for="page in pagination.pages"
          :key="page"
          @click="goToPage(page)"
          :flat="page == pagination.currentPage"
        >
          <q-tooltip>Página {{ page }}</q-tooltip>
          {{ page }}
        </q-btn>
        <q-btn color="primary" @click="goToPage('next')">
          <q-tooltip>Próxima Página</q-tooltip>
          <q-icon size="xs" name="fas fa-chevron-right"></q-icon>
        </q-btn>
        <q-btn
          :disable="fullData.length === 0"
          color="primary"
          @click="goToPage(pagination.finalPage)"
        >
          <q-tooltip>Última Página</q-tooltip>
          <q-icon size="xs" name="fas fa-angles-right"></q-icon>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, getCurrentInstance } from 'vue'
import { computePagination } from '../../services/datatable-pagination.js'

defineOptions({ name: 'ui-gadgets-datatable' })

const props = defineProps({
  Name: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Object,
    required: true,
  },
  DataURL: {
    // Optional when `StaticData` is provided (local/mock mode, no HTTP).
    type: String,
    required: false,
    default: '',
  },
  StaticData: {
    // When provided, the table runs fully client-side over this array
    // (search/sort/pagination) instead of fetching from `DataURL`.
    type: Array,
    default: null,
  },
  Columns: {
    type: Object,
    required: true,
  },
  DefaultSorting: {
    type: Object,
    validator: (v) => 'by' in v && 'direction' in v,
  },
  RowActions: Object,
  Filters: {
    type: Array,
    default: () => [],
  },
  ExtraFilters: Object,
  Export: Object,
  Printable: Boolean,
  BeforeLoad: Function,
  OnLoaded: Function,
  IntervalRule: Function,
  IgnorePagination: Boolean,
  dense: Boolean,
  injectedRowActions: {
    type: Function,
    default: () => [],
  },
  CustomResources: Array,
})

const emit = defineEmits(['update:model-value', 'error-thrown'])

// Submódulo acessa os serviços do app pelo $getService global (resolução por URI) — equivalente
// ao this.$getService do Options API.
const getService = getCurrentInstance().appContext.config.globalProperties.$getService

// Pagination related vars:
const pagination = reactive({
  pages: [],
  currentPage: 1,
  finalPage: null,
  totalPages: null,
  totalItems: null,
  pageFirstItem: null,
  pageLastItem: null,
  pageLastIndex: null,
  limit: 10,
  sortBy: '1',
  sortDir: 'ASC',
})

// Filters related vars:
const searchTerm = ref(null)
const showFilterPanel = ref(false)
const filterParams = ref({})

// Columns settings:
const visibleColumns = ref([])
const columns = ref([])

// Data:
const fullData = ref([])
const rawData = ref([])
const dataInPage = ref([])
const error = ref(null)

// State:
const loading = ref(false)
const showLoader = ref(true)
const errorState = ref(false)

// Internal (non-reactive) state:
// Block filterParams watcher while restoring persisted filters.
// InputField children emit update:model-value with their Default value
// during their own mounted(), which runs BEFORE this component's mounted().
// Without this flag those emissions would wipe out the persisted filters.
let isRestoring = true
let loadTimeout = null
let loadingFullData = false

const showActionsColumn = computed(() =>
  // Show the actions column if at least one row has a visible action
  dataInPage.value.some((row) => showActionsBtnInRow(row)),
)

const columnOptions = computed(() =>
  columns.value
    .map((clm) => {
      return clm.name != 'actions'
        ? {
            label: clm.label,
            value: clm.field,
          }
        : null
    })
    .filter((item) => item != null),
)

const columnFilters = computed(() =>
  props.Columns.map((clm) => {
    if (!!clm.filter == false) return null

    if (typeof clm.filter == 'string') {
      return {
        label: clm.label,
        field: clm.field,
        type: clm.filter,
      }
    }

    if (!('field' in clm.filter)) clm.filter.field = clm.field

    return { label: clm.label, ...clm.filter }
  }).filter((item) => item != null),
)

const exportOptions = computed(() => {
  var typeIcons = {
    xls: 'fas fa-file-excel',
    csv: 'fas fa-file-csv',
  }
  var typeLabels = {
    xls: 'Exportar XLS',
    csv: 'Exportar CSV',
  }

  if (!(props.Export instanceof Array))
    return [
      {
        ...props.Export,
        icon: typeIcons[props.Export.filetype],
        label: typeLabels[props.Export.filetype],
      },
    ]

  return props.Export.map((opt) => ({
    ...opt,
    icon: typeIcons[opt.filetype],
    label: typeLabels[opt.filetype],
  }))
})

const state = computed(() => {
  if (showLoader.value) return 'loading'
  if (errorState.value) return 'error'
  if (dataInPage.value.length > 0) return 'ready'
  if (dataInPage.value.length == 0) return 'empty'
  return null
})

// Controls the visibility of the search field. A column counts as
// searchable simply by being a real, searchable-by-default column — it must
// NOT depend on filterParams, otherwise filling every column filter (or the
// null defaults emitted on mount) would empty the list and hide the field.
const hasSearchableColumns = computed(() =>
  columns.value.some((col) => col.field && col.field !== '' && col.searchable !== false),
)

const searchableColumns = computed(() =>
  columns.value.filter((col) => {
    const hasValidField = col.field && col.field !== ''
    const isSearchable = col.searchable !== false
    // Exclude a column from the search only when it has an ACTIVE column
    // filter, since search and filter share the same request param key and
    // would collide. A present-but-null key (mount defaults) is not active.
    const filterValue = filterParams.value[col.field]
    const isNotFiltered = filterValue === null || filterValue === undefined || filterValue === ''

    return hasValidField && isSearchable && isNotFiltered
  }),
)

const rows = computed(() => {
  if (typeof props.IntervalRule !== 'function') return [...dataInPage.value]

  const result = []

  dataInPage.value.forEach((current, i) => {
    const prev = dataInPage.value[i - 1]
    const next = dataInPage.value[i + 1]

    result.push(current)
    if (props.IntervalRule(prev, current, next) === true) result.push('interval')
  })

  return result
})

const hasAnyColumnFooter = computed(() => props.Columns.some((column) => !!column.footer))

const filtersValues = computed(() => ({
  searchTerm: searchTerm.value,
  ...filterParams.value,
  ...props.ExtraFilters,
}))

const activeFiltersCount = computed(() => {
  const filters = JSON.parse(JSON.stringify(filterParams.value))
  return Object.values(filters).filter((v) => v !== null && v !== undefined && v !== '').length
})

const sluggedName = computed(() =>
  // Remove spaces, lowercases and replace accents and special chars:
  props.Name.toSlug(),
)

const availableFilters = computed(() => [...columnFilters.value, ...props.Filters])

watch(searchTerm, () => {
  showLoader.value = true
  pagination.currentPage = 1
  clearTimeout(loadTimeout)

  loadTimeout = setTimeout(async () => {
    if (searchTerm.value)
      localStorage.setItem(`Datatable.${sluggedName.value}.searchTerm`, searchTerm.value)
    else localStorage.removeItem(`Datatable.${sluggedName.value}.searchTerm`)

    const response = await loadData(props.IgnorePagination)
    if (response) rawData.value = response.data
  }, 200)
})

watch(
  () => pagination.currentPage,
  () => {
    var persistedPagination = localStorage.getItem(`Datatable.${sluggedName.value}.pagination`)
    persistedPagination = persistedPagination ? JSON.parse(persistedPagination) : {}
    persistedPagination.currentPage = pagination.currentPage
    localStorage.removeItem(`Datatable.${sluggedName.value}.pagination`)
    localStorage.setItem(
      `Datatable.${sluggedName.value}.pagination`,
      JSON.stringify(persistedPagination),
    )
    clearTimeout(loadTimeout)

    loadTimeout = setTimeout(async () => {
      const response = await loadData(props.IgnorePagination)
      if (response) rawData.value = response.data
    }, 200)
  },
)

watch(
  () => pagination.limit,
  () => {
    pagination.currentPage = 1
    var persistedPagination = localStorage.getItem(`Datatable.${sluggedName.value}.pagination`)
    persistedPagination = persistedPagination ? JSON.parse(persistedPagination) : {}
    persistedPagination.currentPage = pagination.currentPage
    persistedPagination.limit = pagination.limit
    localStorage.removeItem(`Datatable.${sluggedName.value}.pagination`)
    localStorage.setItem(
      `Datatable.${sluggedName.value}.pagination`,
      JSON.stringify(persistedPagination),
    )
    clearTimeout(loadTimeout)

    loadTimeout = setTimeout(async () => {
      const response = await loadData(props.IgnorePagination)
      if (response) rawData.value = response.data
    }, 200)
  },
)

watch(
  () => pagination.sortBy,
  () => {
    var persistedPagination = localStorage.getItem(`Datatable.${sluggedName.value}.pagination`)
    persistedPagination = persistedPagination ? JSON.parse(persistedPagination) : {}
    persistedPagination.sortBy = pagination.sortBy
    localStorage.removeItem(`Datatable.${sluggedName.value}.pagination`)
    localStorage.setItem(
      `Datatable.${sluggedName.value}.pagination`,
      JSON.stringify(persistedPagination),
    )
    clearTimeout(loadTimeout)

    loadTimeout = setTimeout(async () => {
      const response = await loadData(props.IgnorePagination)
      if (response) rawData.value = response.data
    }, 200)
  },
)

watch(
  () => pagination.sortDir,
  () => {
    var persistedPagination = localStorage.getItem(`Datatable.${sluggedName.value}.pagination`)
    persistedPagination = persistedPagination ? JSON.parse(persistedPagination) : {}
    persistedPagination.sortDir = pagination.sortDir
    localStorage.removeItem(`Datatable.${sluggedName.value}.pagination`)
    localStorage.setItem(
      `Datatable.${sluggedName.value}.pagination`,
      JSON.stringify(persistedPagination),
    )
    clearTimeout(loadTimeout)

    loadTimeout = setTimeout(async () => {
      const response = await loadData(props.IgnorePagination)
      if (response) rawData.value = response.data
    }, 200)
  },
)

watch(
  filterParams,
  (v) => {
    if (isRestoring) return
    filterHandler(v, 'filters')
  },
  { deep: true },
)

watch(
  () => props.ExtraFilters,
  (v) => {
    filterHandler(v, 'extrafilters')
  },
  { deep: true },
)

watch(visibleColumns, (newVal) => {
  if (newVal.length < 1) {
    visibleColumns.value = [props.Columns[0].field]
  }

  localStorage.setItem(`Datatable.${sluggedName.value}.visibleColumns`, JSON.stringify(newVal))
})

watch(loading, (isLoading) => {
  showLoader.value = isLoading
})

watch(
  rawData,
  (data) => {
    if (props.IgnorePagination) dataInPage.value = data
    else paginate(data)
    // Expose factory:
    exposeFactory()
    // turn off loading indicator
    loading.value = false
  },
  { deep: true },
)

watch(fullData, (data) => {
  // Recalcula finalPage E a janela de botões a partir do total real, mantendo os
  // dois em sincronia independentemente da ordem de chegada das respostas (total x fatia).
  const { finalPage, pages } = computePagination({
    totalItems: data.length,
    pageItems: rawData.value.length,
    currentPage: pagination.currentPage,
    limit: pagination.limit,
  })
  pagination.finalPage = finalPage
  pagination.pages = pages
})

/////////////
// Factory:
/////////////
function exposeFactory() {
  const fn = () => {
    if (loading.value || loadingFullData) setTimeout(() => fn(), 200)
    else
      emit('update:model-value', {
        state: (() => state.value)(),
        params: (() => setParams())(),
        filterValues: (() => filtersValues.value)(),
        dataInPage: (() => dataInPage.value)(),
        rowsInPage: (() => dataInPage.value.length)(),
        visibleColumns: (() => visibleColumns.value)(),
        reload: reload,
        fullData: (() => fullData.value)(),
        totalRows: (() => fullData.value.length)(),
      })
  }

  fn()
}

/////////////
// Getters:
/////////////
// Single entry point for fetching: delegates to the server, or computes the
// result locally when `StaticData` is provided (search/sort/pagination).
async function fetchData(params, ignorePagination) {
  if (props.StaticData) return getStaticResponse(ignorePagination)
  return getService('toolcase/http').get(props.DataURL, params)
}

function getStaticResponse(ignorePagination) {
  let rows = Array.isArray(props.StaticData) ? props.StaticData.slice() : []

  // Search across searchable columns (substring, case-insensitive):
  const term = (searchTerm.value || '').toString().trim().toLowerCase()
  if (term && searchableColumns.value.length) {
    const fields = searchableColumns.value.map((c) => c.field)
    rows = rows.filter((r) =>
      fields.some((f) => String(r[f] ?? '').toLowerCase().includes(term)),
    )
  }

  for (const filter of availableFilters.value) {
    const value = filterParams.value[filter.field]
    if (value == null || value === '') continue

    if (typeof filter.filterFn === 'function') {
      rows = rows.filter((row) => filter.filterFn(row, value))
    } else if (filter.type === 'timerangepicker') {
      if (!value.from || !value.to) continue

      const toSeconds = (time) => {
        const match = String(time).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
        if (!match) return null
        return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] || 0)
      }

      const from = toSeconds(value.from)
      const to = toSeconds(value.to)
      if (from === null || to === null) continue

      rows = rows.filter((row) => {
        const rowTime = String(row[filter.field] ?? '').match(/(?:^|\s)(\d{1,2}:\d{2}(?::\d{2})?)$/)
        if (!rowTime) return false

        const time = toSeconds(rowTime[1])
        return time !== null && time >= from && time <= to
      })
    } else if (filter.type === 'select') {
      rows = rows.filter((row) => String(row[filter.field]) === String(value))
    }
  }

  // Sort by the active column (sortBy is a 1-based column number):
  const sortNum = parseInt(pagination.sortBy ?? '1', 10)
  const sortCol = props.Columns[sortNum - 1]
  if (sortCol && sortCol.field) {
    const f = sortCol.field
    const dir = (pagination.sortDir ?? 'ASC') === 'DESC' ? -1 : 1
    rows.sort((a, b) => {
      const av = a[f]
      const bv = b[f]
      if (av == null && bv == null) return 0
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return (
        String(av ?? '').localeCompare(String(bv ?? ''), 'pt-BR', { numeric: true }) * dir
      )
    })
  }

  if (ignorePagination) return { data: rows }

  const page = Number(pagination.currentPage || 1)
  const limit = Number(pagination.limit || 10)
  const start = (page - 1) * limit
  return { data: rows.slice(start, start + limit) }
}

async function loadData(ignorePagination) {
  if (!loading.value) {
    loadFullData()

    // turn on loading indicator
    loading.value = true
    error.value = null
    errorState.value = false

    var params = setParams()
    if (ignorePagination) {
      delete params.$page
      delete params.$limit
    }

    try {
      // Before Load callback:
      if (props.BeforeLoad) await props.BeforeLoad(params)

      // fetch data (server or local StaticData)
      const response = await fetchData(params, ignorePagination)

      // On Loaded callback:
      if (props.OnLoaded) await props.OnLoaded(response)

      return response
    } catch (err) {
      loading.value = false
      errorState.value = true
      error.value = err
      emit('error-thrown', err)
      throw err
    }
  }
}

async function loadFullData() {
  if (loadingFullData) return

  loadingFullData = true
  fullData.value = []
  var params = setParams()
  delete params.$page
  delete params.$limit

  try {
    const response = await fetchData(params, true)
    fullData.value = response.data
  } catch (err) {
    emit('error-thrown', err)
    throw err
  } finally {
    loadingFullData = false
  }
}

/////////////////////
// Sort and Filter:
/////////////////////
function filterHandler(filtersObject, name) {
  // console.log(
  //   name,
  //   localStorage.getItem(`Datatable.${sluggedName.value}.${name}`),
  // );
  // Save filters state:
  localStorage.removeItem(`Datatable.${sluggedName.value}.${name}`)

  if (Object.keys(filtersObject).length > 0)
    localStorage.setItem(`Datatable.${sluggedName.value}.${name}`, JSON.stringify(filtersObject))

  showLoader.value = true
  pagination.currentPage = 1
  clearTimeout(loadTimeout)

  for (let k in filtersObject) {
    if (filtersObject[k] == null) delete filtersObject[k]
  }

  loadTimeout = setTimeout(async () => {
    const response = await loadData(props.IgnorePagination)
    if (response) rawData.value = response.data
  }, 200)
}

function setParams() {
  // Pagination Params:
  const paginationParams = {
    $sort_by: pagination.sortBy ?? '1',
    $sort_direction: pagination.sortDir ?? 'ASC',
    $page: pagination.currentPage,
    $limit: Number(pagination.limit),
  }

  // Search Filter:
  const search = {}
  if (searchTerm.value) {
    for (let i = 0; i < searchableColumns.value.length; i++) {
      let column = searchableColumns.value[i]

      const f = column.field

      // First field:
      if (i == 0) {
        if (i == searchableColumns.value.length - 1) {
          search[f] = '$startFilterGroup$lkof$endFilterGroup|' + searchTerm.value
        } else {
          search[f] = '$startFilterGroup$lkof|' + searchTerm.value
        }
      }
      // All fields in the middle:
      else if (i < searchableColumns.value.length - 1) {
        search[f] = '$or$lkof|' + searchTerm.value
      }
      // Last field:
      else {
        search[f] = '$endFilterGroup$or$lkof|' + searchTerm.value
      }
    }
  }

  // Filters:
  const filters = {}
  for (let k in filterParams.value) {
    let filterConfig = availableFilters.value.find((x) => x.field == k)
    let value =
      !!filterConfig?.modifierFn && typeof filterConfig?.modifierFn === 'function'
        ? filterConfig?.modifierFn(filterParams.value[k])
        : filterParams.value[k]
    if (value == null) continue

    if (filterConfig?.type == 'text') filters[k] = `$lkof|${value}`
    else if (filterConfig?.type == 'daterangepicker')
      filters[k] = `$btwn|${value.from} 00:00:00|${value.to} 23:59:59`
    else if (filterConfig?.type == 'datetimerange')
      filters[k] = `$btwn|${value.from}|${value.to}`
    else if (filterConfig?.type == 'timerangepicker') {
      if (value.from && value.to) filters[k] = `$btwn|${value.from}|${value.to}`
    }
    else filters[k] = value
  }

  // Extra filters:
  const extraFilters = {}
  if (props.ExtraFilters) {
    for (let k in props.ExtraFilters)
      if (props.ExtraFilters[k]) extraFilters[k] = props.ExtraFilters[k]
  }

  return {
    ...paginationParams,
    ...search,
    ...filters,
    ...extraFilters,
  }
}

function getColumnNumber(column) {
  var sortNumber
  if (!!column.sortBy === false) {
    // Find sort number:
    let cols = Object.keys(rawData.value[0] ?? {})
    let idx = cols.indexOf(column.field)

    if (idx == -1) return

    sortNumber = idx + 1
  } else if (typeof column.sortBy == 'string') {
    // Find sort number:
    let cols = Object.keys(rawData.value[0] ?? {})
    let idx = cols.indexOf(column.sortBy)

    if (idx == -1) return

    sortNumber = idx + 1
  } else {
    sortNumber = column.sortBy
  }

  return sortNumber
}

function getColumnLabel(field) {
  const cols = props.Columns.map((c) => ({
    label: c.label,
    field: c.field,
  }))
  const filters = props.Filters.map((f) => ({
    label: f.label,
    field: f.field,
  }))
  const available = [...cols, ...filters]

  let target = available.find((item) => item.field == field)

  return target?.label ?? field
}

function getSortIcon(column) {
  if (getColumnNumber(column) == pagination.sortBy) {
    if (pagination.sortDir == 'ASC') return 'fas fa-sort-up'
    else if (pagination.sortDir == 'DESC') return 'fas fa-sort-down'
    else return 'fas fa-ban'
  } else return 'fas fa-sort'
}

function sort(column) {
  if (column.sortable === false || (!!column.sortBy === false && rawData.value.length == 0))
    return

  var sortNumber = getColumnNumber(column)

  if (pagination.sortBy == sortNumber) {
    if (pagination.sortDir == 'ASC') pagination.sortDir = 'DESC'
    else if (pagination.sortDir == 'DESC') pagination.sortDir = 'ASC'
  } else {
    pagination.sortBy = sortNumber
    pagination.sortDir = 'ASC'
  }
}

function showActionsBtnInRow(row) {
  return props.RowActions.some((action) => {
    const hide = action.hide

    // Execution
    if (hide === undefined) return true
    if (hide === Boolean) return !hide
    if (typeof hide === 'function') return !hide(row, action)

    return true
  })
}

///////////////////////////
// Operational Functions:
///////////////////////////
function reload() {
  clearTimeout(loadTimeout)

  loadTimeout = setTimeout(async () => {
    const response = await loadData(props.IgnorePagination)
    if (response) rawData.value = response.data
  }, 200)
}

function paginate(data) {
  // finalPage/pages derivam do total real (fullData), não da fatia limitada pelo servidor.
  const { finalPage, pages } = computePagination({
    totalItems: fullData.value.length,
    pageItems: data.length,
    currentPage: pagination.currentPage,
    limit: pagination.limit,
  })
  pagination.finalPage = finalPage
  pagination.pages = pages

  pagination.pageFirstItem =
    data.length > 0
      ? pagination.currentPage * pagination.limit - pagination.limit + 1
      : 0

  if (data.length > 0) {
    pagination.pageLastItem = pagination.pageFirstItem
    for (let i = 1; i < data.length; i++) {
      pagination.pageLastItem++
    }
  } else pagination.pageLastItem = 0

  pagination.pageLastIndex =
    data.length < pagination.limit ? data.length - 1 : pagination.limit - 1

  dataInPage.value = []
  for (let i = 0; i <= pagination.pageLastIndex; i++) {
    dataInPage.value.push(rawData.value[i])
  }

  if (dataInPage.value.length == 0 && pagination.currentPage > 1) {
    goToPage('prev')
  }
}

async function goToPage(page) {
  switch (page) {
    case 'next':
      if (pagination.currentPage + 1 > pagination.finalPage) return
      pagination.currentPage++
      break
    case 'prev':
      if (pagination.currentPage - 1 < 1) return
      pagination.currentPage--
      break
    default:
      if (page != pagination.currentPage) pagination.currentPage = page
  }
}

async function exportFile(filetype, filename) {
  filename = filename.indexOf(`.${filetype}`) ? filename : `${filename}.${filetype}`

  var data = fullData.value
  var blobType
  var content

  switch (filetype) {
    case 'xls':
      blobType = 'application/vnd.ms-excel;charset=utf-8;'
      content = buildContentTable(data)
      break
    case 'csv':
      blobType = 'text/csv;charset=utf-8;'
      content = buildCsvContent(data)
      break
  }

  // Encode the content to UTF-8
  const encoder = new TextEncoder()
  const utf8Content = encoder.encode(content)

  // Create a blob with the UTF-8 encoded content
  const blob = new Blob([utf8Content], { type: blobType })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)

  link.style.visibility = 'hidden'

  // Adiciona o link ao DOM e dispara o clique
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  loading.value = false
}

function escapeXml(value) {
  if (value === null || value === undefined) return ''
  if (value === false) return 'Não'
  if (value === true) return 'Sim'

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildContentTable(data) {
  // Início do XML
  let content = `
      <?xml version="1.0" encoding="UTF-8"?>
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="this.$getService("toolcase/http")://www.w3.org/TR/REC-html40">
    <head>
      <style>
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid #000;
          padding: 5px;
          text-align: left;
        }
        th {
          background-color: #f4f4f4;
          text-align: center;
        }
      </style>
      <meta this.$getService("toolcase/http")-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>
  <table>
    <thead>
      <tr>
        ${props.Columns.filter((column) => visibleColumns.value.includes(column.field))
          .map((column) => `<th>${escapeXml(column.label)}</th>`)
          .join('')}
      </tr>
    </thead>
    <tbody>
  `

  // Adiciona as linhas
  for (let j = 0; j < data.length; j++) {
    content += '<tr>'
    let row = data[j]

    for (let i = 0; i < props.Columns.length; i++) {
      let clm = props.Columns[i]
      if (!visibleColumns.value.includes(clm.field)) continue
      content += `<td>${
        clm.format ? clm.format(row) : row[clm.field] ? row[clm.field] : ''
      }</td>`
    }
    content += '</tr>'
  }
  // Fecha o XML
  content += `
    </tbody>
  </table>
  `

  return content
}

function buildContentTableForPrint(data) {
  const visible = props.Columns.filter((c) => visibleColumns.value.includes(c.field))
  var filters = Object.entries(filtersValues.value)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(
      ([filterKey, value]) =>
        `<li>&#8250; ${escapeXml(
          getColumnLabel(filterKey),
        )}: <span style="font-weight: normal;">"${escapeXml(value)}"</span></li>`,
    )
    .join('')
  if (filters.length == 0) filters = '<li>Nenhum filtro aplicado</li>'

  let content = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${props.Name}</title>
  <style>
    @page { margin: 10mm; }
    body { font: 12px system-ui, -apple-system, Segoe UI, Roboto, Arial; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 4px; text-align: left; }
    th { background: #f4f4f4; text-align: center; }

    thead { display: table-header-group; } /* repete header */
    tfoot { display: table-footer-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr><th colspan="${
        visible.length
      }" style="text-align: center; font-size: 16px;">${props.Name}</th></tr>
      <tr><th colspan="${visible.length}" style="text-align: left; font-size: 12px;">
        <span style="text-decoration:underline;">Filtros:</span>
        <br>
        <br>
        <ul style="list-style-type: none; padding: 0; margin: 0;">${filters}</ul></th>
      </tr>
      <tr>${visible.map((c) => `<th>${escapeXml(c.label)}</th>`).join('')}</tr>
  </thead>
  <tbody>`

  for (let j = 0; j < data.length; j++) {
    const row = data[j]
    content += '<tr>'
    for (const clm of visible) {
      const val = clm.format ? clm.format(row) : (row?.[clm.field] ?? '')
      content += `<td>${escapeHtml(String(val))}</td>`
    }
    content += '</tr>'
  }

  content += `</tbody>
</table>
</body>
<tfoot>
  <tr><td colspan="${visible.length}">
    <em>Total de registros: ${data.length}</em>
  </td></tr>
</tfoot>
</html>`

  return content
}

function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildCsvContent(rawdata) {
  // Ensure the data is an array of objects
  if (!Array.isArray(rawdata) || !rawdata.length || typeof rawdata[0] !== 'object') {
    console.error('The provided data could not be converted to CSV.')
    return
  }

  // Extract headers (keys of the first object in the array)
  const headers = props.Columns.filter((column) =>
    visibleColumns.value.includes(column.field),
  ).map((column) => column.label)

  const data = []
  for (let j = 0; j < rawdata.length; j++) {
    let row = rawdata[j]
    let rowValues = []

    for (let i = 0; i < props.Columns.length; i++) {
      let clm = props.Columns[i]
      if (!visibleColumns.value.includes(clm.field)) continue
      const f = clm.export ?? clm.field
      rowValues.push(row[f])
    }
    data.push(rowValues)
  }

  // Generate CSV content
  const csvContent = [headers.join(';'), ...data.map((row) => row.join(';'))].join('\r\n')

  return csvContent
}

async function printData() {
  const data = fullData.value
  loading.value = false

  const html = buildContentTableForPrint(data)

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(html)
  doc.close()

  // dá um tempo pro layout e reflow terminarem
  await new Promise((r) => setTimeout(r, 500))

  iframe.contentWindow.focus()
  iframe.contentWindow.print()

  setTimeout(() => iframe.remove(), 1500)
}

//////////////////
// Item Functions:
//////////////////
function handleItemClick(item) {
  if (itemHasChildren(item)) return

  item.fn({
    fullData: fullData.value,
    rawData: rawData.value,
    filters: filtersValues.value,
    ...item.params,
  })
}

function itemHasChildren(item) {
  return !!item?.children
}

onMounted(async () => {
  // Set columns:
  columns.value = [...props.Columns]
  visibleColumns.value =
    JSON.parse(localStorage.getItem(`Datatable.${sluggedName.value}.visibleColumns`)) ??
    props.Columns.map((clm) => clm.field)

  // Set Actions:
  if (props.RowActions && props.RowActions?.length > 0)
    columns.value.push({
      name: 'actions',
      label: 'Ações',
      align: 'center',
      sortable: false,
      filterable: false,
    })

  var loadFirstData = true
  // Set persisted filters:
  var persistedFilters = localStorage.getItem(`Datatable.${sluggedName.value}.filters`)
  if (persistedFilters) {
    showFilterPanel.value = true
    setTimeout(() => {
      filterParams.value = JSON.parse(persistedFilters)
      isRestoring = false
    }, 100)
    loadFirstData = false
  } else {
    isRestoring = false
  }

  // Set persisted search term:
  searchTerm.value = localStorage.getItem(`Datatable.${sluggedName.value}.searchTerm`) ?? null
  if (searchTerm.value) loadFirstData = false

  // Set sorting:
  if (props.DefaultSorting) {
    pagination.sortBy = props.DefaultSorting.by
    pagination.sortDir = props.DefaultSorting.direction
    loadFirstData = false
  }

  // Set persisted pagination:
  var persistedPagination = localStorage.getItem(`Datatable.${sluggedName.value}.pagination`)
  if (persistedPagination) {
    persistedPagination = JSON.parse(persistedPagination)
    for (let k in persistedPagination)
      if (k in pagination && k != 'currentPage') pagination[k] = persistedPagination[k]

    if (!!persistedPagination.currentPage && persistedPagination.currentPage != 1) {
      setTimeout(() => (pagination.currentPage = persistedPagination.currentPage), 200)
      loadFirstData = false
    }
  }

  // If no change occurred in any parameters, start the first load:
  if (loadFirstData) {
    const response = await loadData()
    if (response) rawData.value = response.data
  }
})
</script>

<style scoped>
.datatable-container {
  position: relative;
  overflow-x: scroll;
  width: 100%;
  max-height: 500px;
}

table {
  width: 100%;
  border-collapse: collapse;
  overflow-y: scroll;
}

thead {
  top: 0px;
  position: sticky;
  z-index: 2;
  background-color: white;
}

th {
  white-space: nowrap;
  /* Prevents text from wrapping */
  width: fit-content;
  /* Adjusts width to fit the content */
}

tbody > tr:nth-child(even) {
  background-color: #e2e2e2;
}

td {
  min-width: 125px;
}

tfoot {
  position: sticky;
}

select {
  cursor: pointer;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
