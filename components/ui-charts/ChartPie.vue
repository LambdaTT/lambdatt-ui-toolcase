<template>
  <div>
    <!-- Loading -->
    <div class="text-center q-pa-xl text-grey-8" v-show="showLoader">
      <div>
        <q-spinner-gears size="lg" />
      </div>
      <div class="text-caption">
        Carregando...
      </div>
    </div>

    <!-- Error -->
    <div class="text-center q-pa-xl text-red-3" v-if="!!error && !showLoader">
      <div>
        <q-icon size="lg" name="fas fa-bomb"></q-icon>
      </div>
      <div class="text-h6">
        ERRO!
      </div>
      <div class="text-caption"><b>{{ error.response.status }}</b> {{ error.response.statusText }}</div>
    </div>

    <!-- Empty -->
    <div class="text-center q-pa-xl" v-show="!showLoader && !error && data?.length == 0">
      <div>
        <q-icon size="lg" name="far fa-folder-open"></q-icon> *
      </div>
      <div class="text-h6">
        Sem Dados
      </div>
      <div class="text-caption">Nenhuma informação disponível para alimentar o gráfico</div>
    </div>

    <!-- Content -->
    <div v-show="!showLoader && !error && data && data.length > 0">
      <canvas :style="{width: Size, Height: Size}" ref="canvas" :key="canvasKey"></canvas>
    </div>
  </div>
</template>

<script>
// Libs:
import Chart from 'chart.js'

export default {
  name: 'ui-charts-pie',

  props: {
    ShowPercentage: Boolean,
    BeforeLoad: Function,
    OnLoaded: Function,
    Size: {
      type: String,
      default: () => '100%'
    },
    ChartType: { type: String, default: () => 'pie' },
    DataURL: {
      type: String,
      required: true
    },
    Filters: {
      type: Object,
      default: () => { }
    },
    Configs: {
      type: Object,
      required: true,
      validator: (v) => !!v.LabelField && !!v.ValueField
    },
  },

  data() {
    return {
      chartElement: null,
      data: [],
      loading: false,
      showLoader: false,
      error: null,
      state: 'ready', // ready | loading | error
      canvasKey: 0
    }
  },

  watch: {
    loading: {
      handler: function (v) {
        this.showLoader = v;
      }
    },

    Filters: {
      handler: function () {
        this.loadData();
      },
      deep: true
    },

    data: {
      handler: function () {
        this.triggerChart();
      },
      deep: true
    },
  },

  methods: {
    async loadData() {
      this.error = null;
      this.state = 'loading';
      if (this.loading) return
      this.loading = true

      try {
        // Before Load callback:
        if (this.BeforeLoad) await this.BeforeLoad(this.Filters);

        // fetch data from server
        const response = await this.$http.get(this.DataURL, this.Filters);
        this.data = response.data;

        // On Loaded callback:
        if (this.OnLoaded) await this.OnLoaded(response);
        this.state = 'ready'
      } catch (error) {
        this.$utils.notifyError(error);
        console.error("An error has occurred on the attempt to retrieve chart data.", error);
        this.error = error;
        this.state = 'error'
        this.$emit('error-thrown', error);
      } finally {
        this.loading = false;
      }
    },

    triggerChart() {
      if (!this.data || this.data.length === 0) {
        this.destroyChart()
        return
      }

      // Handles data:
      const labels = [];
      const dataset = {
        label: '',
        data: [],
        backgroundColor: [],
        hoverOffset: 4
      };

      const key = this.Configs.ValueField;
      const total = this.data.reduce((acc, row) => acc + Number(row[key]), 0);

      for (let i = 0; i < this.data.length; i++) {
        const row = this.data[i];
        const percentage = `${((Number(row[key]) / total) * 100).toFixed(2)}%`;
        const label = this.ShowPercentage ? `${row[this.Configs.LabelField]} - ${percentage}` : row[this.Configs.LabelField]

        labels.push(label);
        dataset.data.push(row[key]);
        dataset.backgroundColor.push(this.$utils.randomHexColor())
      }

      // Initialize Chart Object:
      var chartConfig = {
        type: this.ChartType,
        data: {
          labels,
          datasets: [dataset]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: { display: false },
          tooltips: {
            mode: 'label',
          }
        },

      };

      this.destroyChart()
      this.canvasKey++;

      this.$nextTick(() => {        // ensures the new canvas is in the DOM & visible
        const canvas = this.$refs.canvas
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        this.chartElement = new Chart(ctx, chartConfig)
      })
    },

    destroyChart() {
      if (this.chartElement) {
        this.chartElement.destroy()
        this.chartElement = null
      }
    },
  },

  async mounted() {
    await this.loadData();
  },

  beforeDestroy() {
    this.destroyChart()
  }
}
</script>