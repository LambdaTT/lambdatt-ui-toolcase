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
            {{
              activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""
            }}</q-tooltip
          >
          <!-- Active filter badge -->
          <q-badge
            v-if="activeFiltersCount > 0"
            color="red"
            floating
            rounded
            transparent
          >
            {{ activeFiltersCount }}
          </q-badge>
        </q-btn>

        <!-- Reload -->
        <q-btn
          flat
          round
          color="primary"
          size="sm"
          icon="fas fa-sync"
          @click="triggerReload()"
        >
          <q-tooltip>Atualizar lista</q-tooltip>
        </q-btn>
      </div>

      <!-- Search Field -->
      <div class="col-12 col-md-4" v-if="searchableFields.length > 0">
        <q-input
          dense
          square
          filled
          clearable
          label="Pesquisar na lista"
          v-model="searchTerm"
        >
          <template v-slot:append>
            <q-icon size="xs" name="fas fa-search" color="grey-8" />
          </template>
        </q-input>
      </div>
    </div>

    <q-separator></q-separator>

    <!-- Filters Panel -->
    <div v-if="availableFilters.length > 0">
      <q-expansion-item
        hide-expand-icon
        v-model="showFilterPanel"
        header-style="display:none;"
      >
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
          <div
            v-for="f in availableFilters"
            :key="f.field"
            class="col-12 col-md-4"
          >
            <InputField
              clearable
              dense
              :type="f.type"
              :withSeconds="f.filterOptions?.withSeconds"
              :Label="`Filtrar por ${f.label}`"
              :Options="f.options ?? []"
              v-model="filterParams[f.field]"
              :Default="
                f.default !== null && typeof f.default != 'undefined'
                  ? f.default
                  : null
              "
            >
            </InputField>
          </div>
        </div>
      </q-expansion-item>
      <q-separator />
    </div>

    <!-- Scroll Container -->
    <div
      ref="scrollContainer"
      class="full-width"
      style="height: 400px; overflow: auto"
    >
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
        :scroll-target="$refs.scrollContainer"
        @load="loadData"
        :offset="250"
      >
        <div class="q-pa-sm" v-for="row in data" :key="row.id ?? Math.random()">
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

<script>
export default {
  name: "ui-gadgets-infinite-scroll",

  props: {
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
  },

  data() {
    return {
      // Lifecycle:
      isUnmounting: false,
      isRestoring: false,

      // Filter panel control:
      showFilterPanel: false,
      filterParams: {},

      // Search related:
      searchTerm: null,
      searchTimeout: null,

      // Scroll control:
      page: 1,
      hasMoreData: true,
      startLoad: false,
      isLoading: false,
      reloadCount: 0,

      // Data:
      data: [],
      errData: null,
    };
  },

  computed: {
    sluggedName() {
      if (!this.Name) return null;
      return this.Name.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-");
    },

    availableFilters() {
      return this.Filters;
    },

    searchableFields() {
      return this.SearchFields;
    },

    activeFiltersCount() {
      return Object.values(this.filterParams).filter(
        (v) => v !== null && v !== undefined && v !== "",
      ).length;
    },

    params() {
      const p = {
        ...this.ExtraFilters,
        ...this.filterValues,
        ...this.searchParams,
        $page: this.page,
        $limit: this.Limit,
        $limit_multiplier: 1,
      };

      // Filter out empty/null/undefined values
      Object.keys(p).forEach((key) => {
        if (p[key] === null || p[key] === undefined || p[key] === "") {
          delete p[key];
        }
      });

      return p;
    },

    filterValues() {
      const filters = {};
      for (let k in this.filterParams) {
        const filterConfig = this.availableFilters.find((x) => x.field == k);
        let value =
          !!filterConfig?.modifierFn &&
          typeof filterConfig?.modifierFn === "function"
            ? filterConfig.modifierFn(this.filterParams[k])
            : this.filterParams[k];

        if (value == null || value === "") continue;

        if (filterConfig?.type == "text") filters[k] = `$lkof|${value}`;
        else if (filterConfig?.type == "daterangepicker")
          filters[k] = `$btwn|${value.from} 00:00:00|${value.to} 23:59:59`;
        else if (filterConfig?.type == "datetimerange")
          filters[k] = `$btwn|${value.from}|${value.to}`;
        else filters[k] = value;
      }
      return filters;
    },

    searchParams() {
      const search = {};
      if (!this.searchTerm || !this.searchableFields.length) return search;

      const fields = this.searchableFields;

      fields.forEach((f, i) => {
        // First field:
        if (i == 0) {
          if (i == fields.length - 1) {
            search[f] =
              "$startFilterGroup$lkof$endFilterGroup|" + this.searchTerm;
          } else {
            search[f] = "$startFilterGroup$lkof|" + this.searchTerm;
          }
        }
        // All fields in the middle:
        else if (i < fields.length - 1) {
          search[f] = "$or$lkof|" + this.searchTerm;
        }
        // Last field:
        else {
          search[f] = "$or$lkof$endFilterGroup|" + this.searchTerm;
        }
      });

      return search;
    },

    state() {
      if (!!this.errData) return "error";

      if (this.isLoading && this.data.length === 0) return "ready"; // Show loader, not empty

      if (!this.startLoad && this.data.length < 1) return "empty";

      return "ready";
    },

    output() {
      return {
        data: this.data,
        params: this.params,
        state: this.state,
        reload: this.triggerReload,
      };
    },
  },

  watch: {
    ExtraFilters: {
      handler() {
        this.triggerReload();
      },
      deep: true,
    },

    searchTerm(val) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        if (this.sluggedName) {
          if (val)
            localStorage.setItem(
              `InfiniteScroll.${this.sluggedName}.searchTerm`,
              val,
            );
          else
            localStorage.removeItem(
              `InfiniteScroll.${this.sluggedName}.searchTerm`,
            );
        }
        this.triggerReload();
      }, 400);
    },

    filterParams: {
      handler(v) {
        console.log("filterParams", this.isRestoring);

        if (this.isRestoring) return;
        this.persistFilters(v);
        this.triggerReload();
      },
      deep: true,
    },

    state() {
      this.emit();
    },

    data: {
      handler() {
        this.emit();
      },
    },
  },

  methods: {
    emit() {
      this.$emit("update:model-value", this.output);
    },

    persistFilters(filtersObject) {
      if (!this.sluggedName || this.isUnmounting) return;
      const key = `InfiniteScroll.${this.sluggedName}.filters`;
      const cleaned = {};
      for (let k in filtersObject) {
        if (
          filtersObject[k] !== null &&
          filtersObject[k] !== undefined &&
          filtersObject[k] !== ""
        )
          cleaned[k] = filtersObject[k];
      }
      if (Object.keys(cleaned).length > 0)
        localStorage.setItem(key, JSON.stringify(cleaned));
      else localStorage.removeItem(key);
    },

    triggerReload() {
      if (!this.DataURL || this.isLoading) return;

      this.page = 1;
      this.hasMoreData = true;
      this.data = [];
      this.errData = null;
      this.startLoad = true;
      this.reloadCount++;
      if (this.$refs.infiniteScrollInternal) {
        this.$refs.infiniteScrollInternal.poll();
        this.$refs.infiniteScrollInternal.resume();
      }
    },

    async checkForMoreData() {
      const params = this.params;
      params.$page++;
      const response = await this.$getService("toolcase/http").get(
        this.DataURL,
        params,
      );
      return !!response.data?.length;
    },

    async loadData(idx, done) {
      if (!this.DataURL || this.isLoading) return;

      this.hasMoreData = false;
      this.isLoading = true;

      try {
        let params = this.params;
        if (!!this.BeforeLoad) params = this.BeforeLoad(this.params);

        const response = await this.$getService("toolcase/http").get(
          this.DataURL,
          params,
        );
        var responseData = JSON.parse(JSON.stringify(response.data ?? []));
        const cloneData = responseData;

        if (!!this.AfterLoad)
          responseData = this.AfterLoad(cloneData, response) ?? responseData;

        if (responseData.length)
          this.data = [...this.data, ...responseData].filter(Boolean);

        this.hasMoreData = await this.checkForMoreData();

        this.page++;
        if (!!done) done();
      } catch (error) {
        this.page = 1;
        this.errData = error;
        console.error(
          "There was a problem on the attempt to retrieve infinite scroll data.",
          error,
        );
      } finally {
        this.isLoading = false;
        this.startLoad = false;
      }
    },
  },

  created() {
    // Block filterParams watcher while restoring persisted filters.
    // InputField children emit update:model-value with their Default value
    // during their own mounted(), which runs BEFORE this component's mounted().
    // Without this flag those emissions would wipe out the persisted filters.
    this.isRestoring = true;
  },

  mounted() {
    if (!this.sluggedName) return;

    // Restore persisted filters:
    const persistedFilters = localStorage.getItem(
      `InfiniteScroll.${this.sluggedName}.filters`,
    );
    if (persistedFilters) {
      this.showFilterPanel = true;
      setTimeout(() => {
        this.filterParams = JSON.parse(persistedFilters);
        this.isRestoring = false;
      }, 100);
    } else this.isRestoring = false;

    // Restore persisted search term:
    this.searchTerm =
      localStorage.getItem(`InfiniteScroll.${this.sluggedName}.searchTerm`) ??
      null;
  },

  beforeUnmount() {
    this.isUnmounting = true;
  },
};
</script>
