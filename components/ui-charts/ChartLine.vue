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

    <!-- Empty -->
    <div class="text-center q-pa-xl" v-show="!showLoader && data?.length == 0">
      <div>
        <q-icon size="lg" name="far fa-folder-open"></q-icon> *
      </div>
      <div class="text-h6">
        Sem Dados.
      </div>
    </div>

    <!-- Content -->
    <div v-show="!showLoader && data?.length > 0" :id="`chart-${Name}-container`">
      <canvas :style="this.CanvasStyle" :id="`chart-${Name}-canvas`"></canvas>
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
    Filter: Object,
    Datasets: Object,
    HideLegend: Boolean,
    CanvasStyle: String,
  },

  data() {
    return {
      chartElement: null,
      datasets: [],
      loading: false,
      showLoader: false,
      data: []
    }
  },

  watch: {
    loading: {
      handler: function (v) {
        this.showLoader = v;
      }
    },

    Filter: {
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
      if (!this.loading) {
        try {
          const response = await this.$http.get(this.DataURL, this.Filter);
          this.data = response.data;
        } catch (error) {
          this.$utils.notifyError(error);
          console.error("An error has occurred on the attempt to retrieve chart data.", error);
        }
      }
    },

    triggerChart() {
      var chartObj = {
        type: "line",
        data: {
          labels: [],
          datasets: []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: { display: !this.HideLegend },
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
      var labels = [];

      for (let i = 0; i < this.data.length; i++) {
        const row = this.data[i];
        labels.push(row.date);

        for (let k in row) {
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
        this.chartElement.config = chartObj;
        this.chartElement.update();
      }
      // Start new chart: 
      else {
        var ctx = document.getElementById(`chart-${this.Name}-canvas`);
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

    this.$emit('reload-fn', this.loadData);
  }
}
</script>