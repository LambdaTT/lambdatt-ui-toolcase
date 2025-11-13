<template>
  <div ref="scrollContainer" class="full-width" style="height:400px; overflow: auto;">
    <!-- Empty -->
    <div v-if="state == 'empty'" class="q-pa-lg text-center text-grey-8">
      <div>
        <q-icon size="lg" name="fas fa-folder-open"></q-icon> *
      </div>
      <div class="text-h6">
        Sem dados
      </div>
    </div>

    <!-- Error State -->
    <div v-if="state == 'error'" class="q-pa-lg text-center text-red-3">
      <div>
        <q-icon size="lg" name="fas fa-bomb"></q-icon>
      </div>
      <div class="text-h6">
        ERRO!
      </div>
      <div class="text-caption"><b>{{ errData.response.status }}</b> {{ errData.response.statusText }}</div>
      <small>Favor entrar em contato com o administrador do sistema.</small>
    </div>

    <!-- Ready -->
    <div v-if="state == 'ready'">
      <q-infinite-scroll :disable="!hasMoreData" :scroll-target="$refs.scrollContainer" @load="loadData" :offset="250">
        <div class="q-pa-sm" v-for="(row, idx) in data" :key="idx">
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
  name: 'ui-gadgets-infinite-scroll',

  props: {
    DataURL: {
      type: String,
      required: true
    },
    Limit: {
      type: Number,
      default: () => 10
    },
    Filters: {
      type: Object,
      default: () => { }
    },
    BeforeLoad: Function,
    AfterLoad: Function,
  },

  data() {
    return {
      // UI-State:
      page: 1,
      loading: false,
      hasMoreData: true,

      // Data:
      data: [],
      errData: null
    }
  },

  computed: {
    params() {
      return {
        ...this.Filters,
        $page: this.page,
        $limit: this.Limit,
        $limit_multiplier: 1
      }
    },

    state() {
      if (!!this.errData) return 'error';
      if (!this.DataURL || this.data.length < 1) return 'empty';
      return 'ready';
    }
  },

  watch: {
    Filters() {
      this.page = 1;
      this.hasMoreData = true;
      this.data = [];

      if (!!this.DataURL)
        this.loadData()
    }
  },

  methods: {
    async loadData(idx, done) {
      if (this.loading) return;

      this.loading = true

      try {
        if (!!this.BeforeLoad) this.BeforeLoad(this.params);

        const response = await this.$http.get(this.DataURL, this.params);

        if (!!this.AfterLoad) this.AfterLoad(response, this.data);
        this.hasMoreData = !!response.data?.length >= this.Limit;

        if (response.data?.length)
          this.data = [...this.data, ...response.data];

        this.page++
        if (!!done) done();
      } catch (error) {
        this.page = 0;
        this.errData = error
        console.error("There was a problem on the attempt to retrieve infinite scroll data.", error);
      } finally {
        this.loading = false;
      }
    }
  },
}
</script>