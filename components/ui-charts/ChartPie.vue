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
    <div v-show="!showLoader && !error && data?.length > 0" :id="`chart-${computedName}-container`">
      <canvas :style="Configs.CanvasStyle" ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script>
// Libs:
import Chart from 'chart.js'

export default {
  name: 'ui-charts-pie',

  props: {
    Name: String,
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
    Percentage: Boolean,
    BeforeLoad: Function,
    OnLoaded: Function,
  },

  data() {
    return {
      chartElement: null,
      data: [],
      loading: false,
      showLoader: false,
      error: null,
      state: 'ready', // ready | loading | error
    }
  },

  computed: {
    computedName() {
      return this.Name ?? [...Array(15)].map(() => Math.random().toString(36)[2]).join('');
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

      if (!this.loading) {
        // turn on loading indicator
        this.loading = true;

        try {
          // Before Load callback:
          if (this.BeforeLoad) await this.BeforeLoad(this.Filters);

          // fetch data from server
          const response = await this.$http.get(this.DataURL, this.Filters);
          this.data = response.data;

          // On Loaded callback:
          if (this.OnLoaded) await this.OnLoaded(response);

          return response;
        } catch (error) {
          this.loading = false;
          this.$utils.notifyError(error);
          console.error("An error has occurred on the attempt to retrieve chart data.", error);
          this.error = error;
          this.$emit('error-thrown', error);
        } finally {
          this.state = !!this.error ? 'error' : 'ready';
        }
      }
    },

    triggerChart() {
      // Initialize Chart Object:
      var chartObj = {
        type: "pie",
        data: {
          labels: [],
          datasets: [{
            label: 'chart pie',
            data: [],
            backgroundColor: [],
            hoverOffset: 4
          }]
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

      // Handles data:
      var labels = chartObj.data.labels;

      var dataset = chartObj.data.datasets[0]
      for (let i = 0; i < this.data.length; i++) {
        const row = this.data[i];
        labels.push(row[this.Configs.LabelField]);

        dataset.backgroundColor.push(this.$utils.randomHexColor())

        dataset.data.push(row[this.Configs.ValueField]);
      }

      // Update chart:
      if (this.chartElement != null) {
        this.chartElement.config.data.labels = chartObj.data.labels
        this.chartElement.config.data.datasets = chartObj.data.datasets
        this.chartElement.update(0);
      }
      // Start new chart: 
      else {
        var ctx = this.$refs.chartCanvas;
        this.chartElement = new Chart(ctx, chartObj);
      }

      this.loading = false;
    },
  },

  async mounted() {
    await this.loadData();
  }
}
</script>