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
      <canvas :style="Configs.CanvasStyle" :id="`chart-${computedName}-canvas`"></canvas>
    </div>
  </div>
</template>

<script>
// Libs:
import Chart from 'chart.js'

export default {
  name: 'ui-charts-line',

  props: {
    Name: String,
    BeforeLoad: Function,
    OnLoaded: Function,
    DataURL: {
      type: String,
      required: true
    },
    Filters: {
      type: Object,
      default: () => { }
    },
    Datasets: {
      type: Array,
      required: true,
      validator: (v) => {
        for (let i = 0; i < v.length; i++)
          if (!('field' in v[i])) return false;

        return true;
      }
    },
    Configs: {
      type: Object,
      required: true,
      validator: (v) => !!v.xAxisKey
    },
  },

  data() {
    return {
      chartElement: null,
      datasets: [],
      data: [],
      loading: false,
      showLoader: false,
      error: null,
      state: 'ready', // ready | loading | error
    }
  },

  computed:{
    computedName(){
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
        this.loading = true;

        try {
          // Before Load callback:
          if (this.BeforeLoad) await this.BeforeLoad(this.Filters);

          const response = await this.$http.get(this.DataURL, this.Filters);
          this.data = response.data;

          // On Loaded callback:
          if (this.OnLoaded) await this.OnLoaded(response);
        } catch (error) {
          this.loading = false;
          this.$utils.notifyError(error);
          console.error("An error has occurred on the attempt to retrieve chart data.", error);
          this.error = error;
          this.$emit('error-thrown', err);
        } finally {
          this.state = !!this.error ? 'error' : 'ready';
        }
      }
    },

    triggerChart() {
      // Initialize Chart Object:
      var chartObj = {
        type: "line",
        data: {
          labels: [],
          datasets: []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: { display: !this.Configs.hideLegend },
          tooltips: {
            mode: 'label',
            callbacks: {
              label: (tooltipItem, data) => {
                var index = tooltipItem.datasetIndex;

                if (!!this.Datasets[index].formatTooltip && typeof this.Datasets[index].formatTooltip == 'function')
                  return this.Datasets[index].formatTooltip(data.datasets[index].label, tooltipItem.yLabel);
                else return data.datasets[index].label + ": " + tooltipItem.yLabel;
              }
            }
          },
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        },

      };

      // Handles data:
      var labels = [];

      for (let i = 0; i < this.data.length; i++) {
        const row = this.data[i];
        labels.push(row[this.Configs.xAxisKey]);

        for (let k in row) {
          if (k == this.Configs.xAxisKey) continue;

          const dataset = this.findDataset(k);
          if (!dataset) continue;
          dataset.data.push(row[k]);
        }
      }

      chartObj.data.labels = labels;
      // Update reference with (re)created datasets:
      chartObj.data.datasets = this.datasets;

      // Update chart:
      if (this.chartElement != null) {
        this.chartElement.configs.data.labels = chartObj.data.labels
        this.chartElement.configs.data.datasets = chartObj.data.datasets
        this.chartElement.update(0);
      }
      // Start new chart: 
      else {
        var ctx = document.getElementById(`chart-${this.computedName}-canvas`);
        this.chartElement = new Chart(ctx, chartObj);
      }

      this.loading = false;
    },

    findDataset(field) {
      for (let i = 0; i < this.datasets; i++) {
        const dataset = this.datasets[i];
        if (dataset.field == field) return dataset;
      }

      return null;
    }
  },

  mounted() {
    for (let i = 0; i < this.Datasets.length; i++) {
      let set = this.Datasets[i];

      let color = this.$utils.randomHexColor()

      this.datasets.push({
        label: set.label,
        data: [],
        fill: false,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
        field: set.field
      })
    }

    this.loadData();
  }
}
</script>