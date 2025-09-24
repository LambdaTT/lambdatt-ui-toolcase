<template>
  <div>
    <!-- Loading -->
    <div class="text-center q-pa-xl text-grey-8" v-if="showLoader">
      <div>
        <q-spinner-gears size="lg" />
      </div>
      <div class="text-caption">
        Carregando...
      </div>
    </div>

    <!-- Empty -->
    <div class="text-center q-pa-xl text-grey-8" v-if="!showLoader && !error && Object.keys(data).length == 0">
      <div>
        <q-icon size="lg" name="far fa-folder-open"></q-icon> *
      </div>
      <div class="text-h6">
        Sem Dados.
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

    <!-- Content -->
    <div v-show="!showLoader && !error && Object.keys(data).length > 0" :id="`chart-${Name}-container`">
      <canvas :style="this.Configs.canvasStyle ?? ''" :id="`chart-${Name}-canvas`"></canvas>
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
    DataURL: {
      type: String,
      required: true
    },
    modelValue: {
      type: Object,
      required: true
    },
    Filters: {
      type: Object,
      default: () => { }
    },
    Configs: {
      type: Object,
      required: true,
      validator: (v) => !!v.xAxisKey
    },
    Datasets: {
      type: Array,
      required: true
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

  watch: {
    loading: {
      handler: function (v) {
        this.showLoader = v;
      }
    },

    data: {
      handler: function () {
        this.exposeFactory();
        this.triggerChart();
      },
      deep: false
    },

    Filters: {
      handler: function () {
        this.loadData();
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
          const response = await this.$http.get(this.DataURL, this.Filters);
          this.data = response.data;
        } catch (error) {
          console.error('An error occurred while attempting to read chart data.', error);
          this.error = error;
        } finally {
          this.loading = false;
          this.state = !!this.error ? 'error' : 'ready';
        }
      }
    },

    triggerChart() {
      if (Object.keys(this.data).length == 0) return;

      var chartObj = {
        type: "line",
        data: {
          labels: [],
          datasets: this.datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: { display: !(!!this.Configs.hideLegend) },
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

      // Clone datasets, detaching from reference:
      var datasets = JSON.parse(JSON.stringify(chartObj.data.datasets));
      var xAxisLabels = this.xAxisBuild().sort((a, b) => {
        const [da, ma, ya] = a.split('/').map(Number);
        const [db, mb, yb] = b.split('/').map(Number);
        return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
      });

      // Populate datasets:
      for (let i = 0; i < datasets.length; i++) {
        let set = datasets[i];

        for (let j = 0; j < xAxisLabels.length; j++) {
          let label = xAxisLabels[j];
          let record = this.data[set.key]?.find(r => r[this.Configs.xAxisKey] == label);
          set.data.push(record ? Number(record[set.field] ?? 0) : 0);
        }
      }

      chartObj.data.labels = xAxisLabels;
      // Update reference with (re)created datasets:
      chartObj.data.datasets = datasets;
      // console.log('chartObj.data',chartObj.data);
      

      // Update chart:
      if (this.chartElement != null) {
        this.chartElement.data.labels = chartObj.data.labels
        this.chartElement.data.datasets = chartObj.data.datasets
        this.chartElement.update(0);
      }
      // Start new chart: 
      else {
        var ctx = document.getElementById(`chart-${this.Name}-canvas`);
        this.chartElement = new Chart(ctx, chartObj);
      }

      this.loading = false;
    },

    xAxisBuild() {
      const labels = [];

      for (let k in this.data) {
        for (let i = 0; i < this.data[k].length; i++) {
          let label = this.data[k][i][this.Configs.xAxisKey];

          if (!labels.includes(label))
            labels.push(label);
        }
      }

      return labels;
    },

    exposeFactory() {
      this.$emit('update:model-value', {
        state: this.state,
        filters: this.Filters,
        data: this.data,
        reload: this.reload
      });
    },

    async reload() {
      this.data = (await this.loadData()).data;
    }
  },

  mounted() {
    for (let i = 0; i < this.Datasets.length; i++) {
      let set = this.Datasets[i];

      let color = this.$utils.randomHexColor()

      this.datasets.push({
        key: set.key,
        label: set.label,
        field: set.field,
        data: [],
        fill: false,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 3
      })
    }
  }
}
</script>