<template>
  <div class="full-width">
    <!-- Controls Bar -->
    <div class="row items-center q-pb-sm">
      <div class="col-12 col-md-8">
        <!-- Filter Toggle -->
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
            >Filtros da lista
            {{ activeFiltersCount > 0 ? `(${activeFiltersCount})` : '' }}</q-tooltip
          >
          <!-- Active filter badge -->
          <q-badge v-if="activeFiltersCount > 0" color="red" floating rounded transparent>
            {{ activeFiltersCount }}
          </q-badge>
        </q-btn>

        <!-- Reload -->
        <q-btn flat round color="primary" size="sm" icon="fas fa-sync" @click="triggerReload()">
          <q-tooltip>Atualizar lista</q-tooltip>
        </q-btn>
      </div>

      <!-- Search Field -->
      <div class="col-12 col-md-4" v-if="searchableFields.length > 0">
        <q-input dense square filled clearable label="Pesquisar na lista" v-model="searchTerm">
          <template v-slot:append>
            <q-icon size="xs" name="fas fa-search" color="grey-8" />
          </template>
        </q-input>
      </div>
    </div>

    <q-separator></q-separator>

    <!-- Filters Panel -->
    <div v-if="availableFilters.length > 0">
      <q-expansion-item hide-expand-icon v-model="showFilterPanel" header-style="display:none;">
        <q-toolbar class="bg-grey-3">
          <q-toolbar-title>Filtros da Lista</q-toolbar-title>
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
          <div v-for="f in availableFilters" :key="f.field" class="col-12 col-md-4">
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
      <q-separator />
    </div>

    <!-- Scroll Container -->
    <div ref="scrollContainer" class="full-width" :style="`height: ${Height}; overflow: auto`">
      <!-- States -->
      <div v-show="state == 'empty'" class="q-pa-lg text-center text-grey-8">
        <div><q-icon size="lg" name="fas fa-folder-open"></q-icon> *</div>
        <div class="text-h6">Sem dados</div>
      </div>

      <div v-show="state == 'error'" class="q-pa-lg text-center text-red-3">
        <div>
          <q-icon size="lg" name="fas fa-bomb"></q-icon>
        </div>
        <div class="text-h6">ERRO!</div>
        <div class="text-caption">
          <b>{{ errData?.response?.status }}</b>
          {{ errData?.response?.statusText }}
        </div>
        <small>Favor entrar em contato com o administrador do sistema.</small>
      </div>

      <!-- Infinite Scroll -->
      <q-infinite-scroll
        v-show="state == 'ready'"
        ref="infiniteScrollInternal"
        :disable="!hasMoreData"
        :scroll-target="scrollContainer"
        @load="loadData"
        :offset="250"
      >
        <div
          class="q-pa-sm"
          v-for="(row, index) in data"
          :key="
            row.id ??
            row.id_ord_order_item ??
            row.id_ord_order ??
            row.id_srv_serving ??
            row.ds_key ??
            row.id_bpm_execution ??
            index
          "
        >
          <slot :data="row"></slot>
        </div>

        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  getCurrentInstance,
} from 'vue'

defineOptions({ name: 'ui-gadgets-infinite-scroll' })

const props = defineProps({
  DataURL: {
    type: String,
    required: true,
  },
  Limit: {
    type: Number,
    default: () => 10,
  },
  /**
   * Array of filter definitions (rendered as embedded fields).
   * Each item: { label, field, type, options?, default?, filterOptions? }
   * Same structure as DataTable's Filters prop.
   */
  Filters: {
    type: Array,
    default: () => [],
  },
  /**
   * External / programmatic filters object applied directly to the request.
   * Equivalent to DataTable's ExtraFilters.
   */
  ExtraFilters: {
    type: Object,
    default: () => {},
  },
  /**
   * Explicit list of fields used by the "Pesquisar na lista" input.
   * The search box is shown ONLY when this prop is non-empty.
   * Fields are no longer inferred from Filters.
   */
  SearchFields: {
    type: Array,
    default: () => [],
  },
  /**
   * Optional name for this list instance, used to persist filters
   * in localStorage (under key `InfiniteScroll.{slug}.filters`).
   */
  Name: {
    type: String,
    default: null,
  },
  BeforeLoad: Function,
  AfterLoad: Function,
  modelValue: {},
  Height: {
    type: String,
    default: () => '400px',
  },
})

const emit = defineEmits(['update:model-value'])

// Submódulo acessa os serviços do app pelo $getService global (resolução por URI) — equivalente
// ao this.$getService do Options API.
const getService = getCurrentInstance().appContext.config.globalProperties.$getService

// Template refs:
const scrollContainer = ref(null)
const infiniteScrollInternal = ref(null)

// Filter panel control:
const showFilterPanel = ref(false)
const filterParams = ref({})

// Search related:
const searchTerm = ref(null)

// Scroll control:
const page = ref(1)
const hasMoreData = ref(true)
const startLoad = ref(false)
const isLoading = ref(false)

// Data:
const data = ref([])
const errData = ref(null)

// Lifecycle / internal (non-reactive) state:
let isUnmounting = false
// Block filterParams watcher while restoring persisted filters.
// InputField children emit update:model-value with their Default value
// during their own mounted(), which runs BEFORE this component's mounted().
// Without this flag those emissions would wipe out the persisted filters.
let isRestoring = true
let searchTimeout = null
let pendingReload = false

const sluggedName = computed(() => {
  if (!props.Name) return null
  return props.Name.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
})

const availableFilters = computed(() => props.Filters)

const searchableFields = computed(() => props.SearchFields)

const activeFiltersCount = computed(
  () =>
    Object.values(filterParams.value).filter(
      (v) => v !== null && v !== undefined && v !== '',
    ).length,
)

const filterValues = computed(() => {
  const filters = {}
  for (let k in filterParams.value) {
    const filterConfig = availableFilters.value.find((x) => x.field == k)
    let value =
      !!filterConfig?.modifierFn && typeof filterConfig?.modifierFn === 'function'
        ? filterConfig.modifierFn(filterParams.value[k])
        : filterParams.value[k]

    if (value == null || value === '') continue

    if (filterConfig?.type == 'text') filters[k] = `$lkof|${value}`
    else if (filterConfig?.type == 'daterangepicker')
      filters[k] = `$btwn|${value.from} 00:00:00|${value.to} 23:59:59`
    else if (filterConfig?.type == 'datetimerange')
      filters[k] = `$btwn|${value.from}|${value.to}`
    else filters[k] = value
  }
  return filters
})

const searchParams = computed(() => {
  const search = {}
  if (!searchTerm.value || !searchableFields.value.length) return search

  const fields = searchableFields.value

  fields.forEach((f, i) => {
    // First field:
    if (i == 0) {
      if (i == fields.length - 1) {
        search[f] = '$startFilterGroup$lkof$endFilterGroup|' + searchTerm.value
      } else {
        search[f] = '$startFilterGroup$lkof|' + searchTerm.value
      }
    }
    // All fields in the middle:
    else if (i < fields.length - 1) {
      search[f] = '$or$lkof|' + searchTerm.value
    }
    // Last field:
    else {
      search[f] = '$endFilterGroup$or$lkof|' + searchTerm.value
    }
  })

  return search
})

const params = computed(() => {
  const p = {
    ...props.ExtraFilters,
    ...filterValues.value,
    ...searchParams.value,
    $page: page.value,
    $limit: props.Limit,
    $limit_multiplier: 1,
  }

  // Filter out empty/null/undefined values
  Object.keys(p).forEach((key) => {
    if (p[key] === null || p[key] === undefined || p[key] === '') {
      delete p[key]
    }
  })

  return p
})

const state = computed(() => {
  if (errData.value) return 'error'

  if (isLoading.value && data.value.length === 0) return 'ready' // Show loader, not empty

  if (!startLoad.value && data.value.length < 1) return 'empty'

  return 'ready'
})

const output = computed(() => ({
  data: data.value,
  params: params.value,
  state: state.value,
  reload: triggerReload,
}))

watch(
  () => props.ExtraFilters,
  () => {
    triggerReload()
  },
  { deep: true },
)

watch(searchTerm, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (sluggedName.value) {
      if (val) localStorage.setItem(`InfiniteScroll.${sluggedName.value}.searchTerm`, val)
      else localStorage.removeItem(`InfiniteScroll.${sluggedName.value}.searchTerm`)
    }
    triggerReload()
  }, 400)
})

watch(
  filterParams,
  (v) => {
    console.log('filterParams', isRestoring)

    if (isRestoring) return
    persistFilters(v)
    triggerReload()
  },
  { deep: true },
)

watch(state, () => {
  emitOutput()
})

watch(data, () => {
  emitOutput()
})

function emitOutput() {
  emit('update:model-value', output.value)
}

function persistFilters(filtersObject) {
  if (!sluggedName.value || isUnmounting) return
  const key = `InfiniteScroll.${sluggedName.value}.filters`
  const cleaned = {}
  for (let k in filtersObject) {
    if (filtersObject[k] !== null && filtersObject[k] !== undefined && filtersObject[k] !== '')
      cleaned[k] = filtersObject[k]
  }
  if (Object.keys(cleaned).length > 0) localStorage.setItem(key, JSON.stringify(cleaned))
  else localStorage.removeItem(key)
}

function triggerReload() {
  if (!props.DataURL) return

  // If a load is in progress, queue the reload so it runs after loading finishes:
  if (isLoading.value) {
    pendingReload = true
    return
  }

  pendingReload = false
  page.value = 1
  hasMoreData.value = true
  data.value = []
  errData.value = null
  startLoad.value = true

  // IMPORTANTE: poll() e resume() devem ser chamados APÓS o $nextTick para garantir
  // que o Vue processou as atualizações reativas antes de disparar o scroll:
  //  - :disable="!hasMoreData" precisa estar false (hasMoreData acabou de virar true)
  //  - v-show="state == 'ready'" precisa estar true (startLoad acabou de virar true)
  // Sem o $nextTick, o q-infinite-scroll enxerga valores stale e aborta o poll
  // silenciosamente — o que é exatamente o que causava a falha após períodos de idle.
  nextTick(() => {
    if (infiniteScrollInternal.value) {
      infiniteScrollInternal.value.resume()
      infiniteScrollInternal.value.poll()
    }
  })
}

async function checkForMoreData() {
  const p = params.value
  p.$page++
  const response = await getService('toolcase/http').get(props.DataURL, p)
  return !!response.data?.length
}

async function loadData(idx, done) {
  // Se um carregamento já está em andamento, sinaliza o Quasar para parar
  // (pass true = stop), evitando que isFetching fique preso como true.
  // O pendingReload em triggerReload() garante que o reload seja refeito.
  if (!props.DataURL || isLoading.value) {
    if (done) done(true)
    return
  }

  hasMoreData.value = false
  isLoading.value = true

  try {
    let p = params.value
    if (props.BeforeLoad) p = props.BeforeLoad(params.value)

    const response = await getService('toolcase/http').get(props.DataURL, p)
    var responseData = JSON.parse(JSON.stringify(response.data ?? []))
    const cloneData = responseData

    if (props.AfterLoad) responseData = props.AfterLoad(cloneData, response) ?? responseData

    if (responseData.length) data.value = [...data.value, ...responseData].filter(Boolean)

    hasMoreData.value = await checkForMoreData()

    page.value++
    if (done) done()
  } catch (error) {
    page.value = 1
    errData.value = error
    // Sinaliza o Quasar para parar, evitando que isFetching fique preso como true.
    if (done) done(true)
    console.error('There was a problem on the attempt to retrieve infinite scroll data.', error)
  } finally {
    isLoading.value = false
    startLoad.value = false
    // Drain any reload that was queued while we were loading:
    if (pendingReload) triggerReload()
  }
}

onMounted(() => {
  if (!sluggedName.value) return

  // Restore persisted filters:
  const persistedFilters = localStorage.getItem(`InfiniteScroll.${sluggedName.value}.filters`)
  if (persistedFilters) {
    showFilterPanel.value = true
    setTimeout(() => {
      filterParams.value = JSON.parse(persistedFilters)
      isRestoring = false
    }, 100)
  } else isRestoring = false

  // Restore persisted search term:
  searchTerm.value = localStorage.getItem(`InfiniteScroll.${sluggedName.value}.searchTerm`) ?? null
})

onBeforeUnmount(() => {
  isUnmounting = true
})
</script>
