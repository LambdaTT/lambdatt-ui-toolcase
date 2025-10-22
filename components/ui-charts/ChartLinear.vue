<template>
  <div>
    <!-- Loading -->
    <div class="text-center q-pa-xl text-grey-8" v-show="showLoader">
      <div><q-spinner-gears size="lg" /></div>
      <div class="text-caption">Carregando...</div>
    </div>

    <!-- Error -->
    <div class="text-center q-pa-xl text-red-3" v-if="!!error && !showLoader">
      <div><q-icon size="lg" name="fas fa-bomb" /></div>
      <div class="text-h6">ERRO!</div>
      <div class="text-caption"><b>{{ error.response && error.response.status }}</b> {{ error.response &&
        error.response.statusText }}</div>
    </div>

    <!-- Empty -->
    <div class="text-center q-pa-xl" v-show="!showLoader && !error && data && data.length === 0">
      <div><q-icon size="lg" name="far fa-folder-open" /></div>
      <div class="text-h6">Sem Dados</div>
      <div class="text-caption">Nenhuma informação disponível para alimentar o gráfico</div>
    </div>

    <!-- Content -->
    <div v-show="!showLoader && !error && data && data.length > 0">
      <canvas :style="CanvasStyle" ref="canvas" :key="canvasKey"></canvas>
    </div>
  </div>
</template>

<script>
// Libs:
import Chart from 'chart.js' // v2.9.4

export default {
  name: 'ui-charts-linear',

  props: {
    BeforeLoad: Function,
    OnLoaded: Function,
    Height: String,
    Width: String,
    ChartType: { type: String, default: () => 'line' },
    DataURL: { type: String, required: true },
    Filters: { type: Object, default: () => ({}) },
    Datasets: {
      type: Array,
      required: true,
      validator: (v) => v.every(d => 'field' in d)
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
      // Keep a "base" datasets spec under our control (reactive but NOT given to Chart.js directly)
      datasets: [],
      data: [],
      loading: false,
      showLoader: false,
      error: null,
      state: 'ready', // ready | loading | error
      canvasKey: 0,
    }
  },

  computed: {
    CanvasStyle() {
      const cssH = this.Height ? `min-height: ${this.Height}px; height: ${this.Height}px; max-height: ${this.Height}px;` : '';
      const cssW = this.Width ? `min-height: ${this.Width}px; height: ${this.Width}px; max-height: ${this.Width}px;` : '';

      return `${cssH} ${cssW}`;
    }
  },

  watch: {
    loading(v) {
      this.showLoader = v
    },

    Filters: {
      deep: true,
      handler() {
        this.loadData()
      }
    },

    data: {
      deep: true,
      handler() {
        this.triggerChart()
      }
    }
  },

  methods: {
    async loadData() {
      this.error = null
      this.state = 'loading'
      if (this.loading) return
      this.loading = true

      try {
        if (this.BeforeLoad) await this.BeforeLoad(this.Filters)

        const response = await this.$http.get(this.DataURL, this.Filters)
        this.data = response.data

        if (this.OnLoaded) await this.OnLoaded(response)
        this.state = 'ready'
      } catch (error) {
        this.$utils && this.$utils.notifyError && this.$utils.notifyError(error)
        console.error('An error has occurred on the attempt to retrieve chart data.', error)
        this.error = error
        this.$emit('error-thrown', error)
        this.state = 'error'
      } finally {
        this.loading = false
      }
    },

    triggerChart() {
      if (!this.data || this.data.length === 0) {
        this.destroyChart()
        return
      }

      // Reset labels and dataset data before refilling
      const labels = []
      this.datasets.forEach(d => { d.data = [] })

      for (let i = 0; i < this.data.length; i++) {
        const row = this.data[i]
        labels.push(row[this.Configs.xAxisKey])

        for (const k in row) {
          if (k === this.Configs.xAxisKey) continue
          const dsInfo = this.findDataset(k)
          if (!dsInfo) continue
          dsInfo.dataset.data.push(row[k])
        }
      }

      // Build a **fresh clone** for Chart.js so it can mutate safely without touching our reactive copies
      const datasetsForChart = this.datasets.map(d => ({
        label: d.label,
        data: d.data.slice(),
        fill: false,
        backgroundColor: d.backgroundColor,
        borderColor: d.borderColor,
        borderWidth: d.borderWidth,
        // DO NOT pass custom fields (like `field`) if you don't want Chart.js to keep them
      }))

      const chartConfig = {
        type: this.ChartType,
        data: {
          labels,
          datasets: datasetsForChart
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: { display: !this.Configs.hideLegend },
          tooltips: {
            mode: 'label',
            callbacks: {
              label: (tooltipItem, data) => {
                const index = tooltipItem.datasetIndex
                if (this.Datasets[index] && typeof this.Datasets[index].formatTooltip === 'function') {
                  return this.Datasets[index].formatTooltip(
                    data.datasets[index].label,
                    tooltipItem.yLabel
                  )
                }
                return data.datasets[index].label + ': ' + tooltipItem.yLabel
              }
            }
          },
          scales: {
            xAxes: [{
              ticks: {
                autoSkip: false,
                callback: function (tick) {
                  var characterLimit = 12;
                  if (tick?.length ?? 0 >= characterLimit) {
                    tick = tick.slice(0, tick.length).substring(0, characterLimit - 1).trim() + '...';
                  }
                  return tick?.toLowerCase();
                }
              }
            }],
            yAxes: [{
              ticks: { beginAtZero: true }
            }]
          }
        }
      }

      // Recreate the chart each time to avoid Chart.js writing metadata back into our reactive objects
      this.destroyChart()
      this.canvasKey++
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

    findDataset(field) {
      // No deep clone here—return the live reactive reference we control
      for (let i = 0; i < this.datasets.length; i++) {
        const dataset = this.datasets[i]
        if (dataset.field === field) {
          return { idx: i, dataset }
        }
      }
      return null
    }
  },

  mounted() {
    // Initialize our **base** datasets once
    for (let i = 0; i < this.Datasets.length; i++) {
      const set = this.Datasets[i]
      const color = this.$utils.randomHexColor()
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

    this.loadData()
  },

  beforeDestroy() {
    this.destroyChart()
  }
}
</script>
