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
    <div class="text-center q-pa-xl text-grey-8" v-if="!showLoader && !error && data?.length == 0">
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
    <div v-show="!showLoader && !error && data.length > 0" :id="`chart-${Name}-container`">
      <canvas :style="this.Configs.canvasStyle ?? ''" :ref="`chart${Name}Canvas`"></canvas>
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
      validator: (v) => !!v.key && !!v.valField
    },
    ShowPercentage: Boolean
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
    total() {
      return this.data.reduce((acc, item) => Number(acc) + Number(item[this.Configs.valField]), 0);
    },
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
            callbacks: {
              label: (tooltipItem, data) => {
                const i = tooltipItem.index;
                const ds = data.datasets[tooltipItem.datasetIndex];
                const val = Number(ds.data[i]) || 0;
                const lbl = data.labels[i] || '';

                if (this.ShowPercentage && this.total > 0) {
                  const pct = ((val / this.total) * 100).toFixed(2);
                  return `${lbl}: ${val} (${pct}%)`;
                }
                return `${lbl}: ${val}`;
              }
            }
          }
        },

      };

      // Clone datasets, detaching from reference:
      var dataset = JSON.parse(JSON.stringify(chartObj.data.datasets[0]));

      for (let i = 0; i < this.data.length; i++) {
        let data = this.data[i];

        chartObj.data.labels.push(data[this.Configs.key]);

        dataset.backgroundColor.push(this.$utils.randomHexColor())

        dataset.data.push(data[this.Configs.valField]);
      }

      chartObj.data.datasets = [dataset];

      // Update chart:
      if (this.chartElement != null) {
        this.chartElement.data.labels = chartObj.data.labels
        this.chartElement.data.datasets = chartObj.data.datasets
        this.chartElement.update(0);
      }
      // Start new chart: 
      else {
        var ctx = this.$refs[`chart${this.Name}Canvas`].getContext('2d');
        this.chartElement = new Chart(ctx, chartObj);
      }

      this.loading = false;
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

  async mounted() {
  }
}
</script>