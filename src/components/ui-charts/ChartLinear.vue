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
      <div class="text-caption">
        <b>{{ error.response && error.response.status }}</b>
        {{ error.response && error.response.statusText }}
      </div>
    </div>

    <!-- Empty -->
    <div
      class="text-center q-pa-xl"
      v-show="!showLoader && !error && data && data.length === 0"
    >
      <div><q-icon size="lg" name="far fa-folder-open" /></div>
      <div class="text-h6">Sem Dados</div>
      <div class="text-caption">
        Nenhuma informação disponível para alimentar o gráfico
      </div>
    </div>

    <!-- Content -->
    <div
      v-show="!showLoader && !error && data && data.length > 0"
      class="chart-scroll"
    >
      <div
        :style="{
          minHeight: '100%',
          minWidth: '100%',
          width: dynamicWidth,
          height: dynamicHeight,
        }"
      >
        <canvas ref="canvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
// Libs (chart.js v4 — ESM com tipos embutidos):
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default {
  name: "ui-charts-linear",

  props: {
    BeforeLoad: Function,
    OnLoaded: Function,
    Height: { type: String, default: () => "100%" },
    Width: { type: String, default: () => "100%" },
    ChartType: { type: String, default: () => "line" }, // 'line' | 'bar' | etc
    DataURL: { type: String, required: true },
    Filters: { type: Object, default: () => ({}) },

    /**
     * Datasets spec:
     * [
     *   { field: 'y1', label: 'Serie A', formatTooltip?: (label, value) => string }
     * ]
     */
    Datasets: {
      type: Array,
      required: true,
      validator: (v) => v.every((d) => "field" in d),
    },

    /**
     * Configs: { xAxisKey: 'name', hideLegend?: boolean }
     */
    Configs: {
      type: Object,
      required: true,
      validator: (v) => !!v.xAxisKey,
    },

    /**
     * Control animation on updates (default true)
     */
    UseAnimation: { type: Boolean, default: () => true },
  },

  data() {
    return {
      vTypes: ["column"],
      hTypes: ["line", "bar", "area"],
      chartElement: null,
      data: [],
      loading: false,
      showLoader: false,
      error: null,
      state: "ready", // ready | loading | error
      debounce: null,

      // Internal mapping to control datasets by "field"
      dsIndexByField: Object.create(null),
    };
  },

  computed: {
    orientation() {
      if (this.vTypes.includes(this.ChartType)) return "vertical";
      if (this.hTypes.includes(this.ChartType)) return "horizontal";
      throw new Error("Invalid chart type");
    },

    dynamicWidth() {
      if (this.orientation === "vertical") return this.Width;
      const w = Math.max(250, this.data.length * 25);
      return `${Math.ceil(w)}px`;
    },

    dynamicHeight() {
      if (this.orientation === "horizontal") return this.Height;
      const w = Math.max(250, this.data.length * 25);
      return `${Math.ceil(w)}px`;
    },
  },

  watch: {
    loading(v) {
      this.showLoader = v;
    },

    Filters: {
      deep: true,
      handler() {
        this.debouncedLoad();
      },
    },

    data: {
      deep: true,
      handler() {
        this.updateChart();
      },
    },

    Datasets: {
      deep: true,
      handler() {
        this.reconcileDatasetsStructureAndUpdate();
      },
    },

    // v4 não suporta troca de tipo em runtime — recria o chart
    ChartType() {
      this._destroyChart();
      this.$nextTick(() => {
        this.ensureChartInitialized();
        this.updateChart();
      });
    },
  },

  methods: {
    debouncedLoad() {
      this.loading = true;
      if (this.debounce) clearTimeout(this.debounce);
      this.debounce = setTimeout(this.loadData, 500);
    },

    async loadData() {
      this.error = null;
      this.state = "loading";
      try {
        if (this.BeforeLoad) await this.BeforeLoad(this.Filters);

        const response = await this.$getService("toolcase/http").get(
          this.DataURL,
          this.Filters,
        );
        this.data = Array.isArray(response.data) ? response.data : [];
        if (this.OnLoaded) await this.OnLoaded(response);
        this.state = "ready";
      } catch (error) {
        this.$getService("toolcase/utils")?.notifyError?.(error);
        console.error(
          "An error has occurred on the attempt to retrieve chart data.",
          error,
        );
        this.error = error;
        this.$emit("error-thrown", error);
        this.state = "error";
      } finally {
        this.debounce = null;
        this.loading = false;
      }
    },

    ensureChartInitialized() {
      if (this.chartElement) return;

      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      const baseOptions = this.buildBaseOptions();

      this.chartElement = new Chart(ctx, {
        type: this.ChartType,
        data: { labels: [], datasets: [] },
        options: baseOptions,
      });

      this.dsIndexByField = Object.create(null);
      this.reconcileDatasetsStructureAndUpdate(true);
    },

    buildBaseOptions() {
      // v4: tooltips agora em plugins.tooltip; callback recebe (context)
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: this.UseAnimation ? { duration: 400 } : false,
        plugins: {
          legend: { display: !this.Configs.hideLegend },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (context) => {
                const dsIndex = context.datasetIndex;
                const ds = this.Datasets[dsIndex];
                const value = context.parsed.y;
                const label = context.dataset.label || "";
                if (ds && typeof ds.formatTooltip === "function") {
                  return ds.formatTooltip(label, value);
                }
                return `${label}: ${value}`;
              },
            },
          },
        },
        // v4: scales são objetos com IDs diretos, não arrays
        scales: {
          x: {
            ticks: {
              autoSkip: false,
              callback: function (val, index) {
                const tick = this.getLabelForValue(val);
                const characterLimit = 12;
                if ((tick?.length ?? 0) >= characterLimit) {
                  return tick
                    .substring(0, characterLimit - 1)
                    .trim()
                    .toLowerCase() + "...";
                }
                return tick?.toLowerCase();
              },
            },
          },
          y: {
            beginAtZero: true,
          },
        },
      };
    },

    makePlainDatasetFromSpec(spec) {
      const color = this.$getService("toolcase/utils")?.randomHexColor
        ? this.$getService("toolcase/utils").randomHexColor()
        : "#3489db";

      return {
        label: spec.label,
        data: [],
        fill: false,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
      };
    },

    reconcileDatasetsStructureAndUpdate(firstInit = false) {
      this.ensureChartInitialized();
      if (!this.chartElement) return;

      const chart = this.chartElement;
      const current = chart.data.datasets;
      const wanted = this.Datasets.map((ds) => ds.field);

      // 1) Remover datasets que não existem mais
      for (let i = current.length - 1; i >= 0; i--) {
        const fieldAtI = Object.keys(this.dsIndexByField).find(
          (f) => this.dsIndexByField[f] === i,
        );
        if (!fieldAtI || !wanted.includes(fieldAtI)) {
          current.splice(i, 1);
          this.rebuildDsIndexMapAfterRemoval(i);
        }
      }

      // 2) Adicionar/garantir datasets na ordem correta
      this.dsIndexByField = Object.create(null);
      for (let i = 0; i < this.Datasets.length; i++) {
        const spec = this.Datasets[i];
        if (current[i]) {
          current[i].label = spec.label;
        } else {
          current.push(this.makePlainDatasetFromSpec(spec));
        }
        this.dsIndexByField[spec.field] = i;
      }

      if (firstInit) {
        chart.update("none");
      } else {
        this.updateChart();
      }
    },

    rebuildDsIndexMapAfterRemoval(removedIndex) {
      const newMap = Object.create(null);
      for (const field in this.dsIndexByField) {
        const idx = this.dsIndexByField[field];
        if (idx < removedIndex) newMap[field] = idx;
        else if (idx > removedIndex) newMap[field] = idx - 1;
      }
      this.dsIndexByField = newMap;
    },

    updateChart() {
      this.ensureChartInitialized();
      const chart = this.chartElement;
      if (!chart) return;

      if (!this.data || this.data.length === 0) {
        chart.data.labels = [];
        chart.data.datasets.forEach((d) => {
          d.data = [];
        });
        chart.update("none");
        return;
      }

      const labels = [];
      const seriesByField = Object.create(null);
      for (const { field } of this.Datasets) {
        seriesByField[field] = [];
      }

      const xKey = this.Configs.xAxisKey;

      for (let i = 0; i < this.data.length; i++) {
        const row = this.data[i];
        labels.push(row[xKey]);
        for (const field in seriesByField) {
          seriesByField[field].push(row[field]);
        }
      }

      chart.data.labels = labels.slice();

      for (let i = 0; i < this.Datasets.length; i++) {
        const { field, label } = this.Datasets[i];
        const idx = this.dsIndexByField[field];
        if (idx == null) continue;
        const ds = chart.data.datasets[idx];
        ds.label = label;
        ds.data = (seriesByField[field] || []).slice();
      }

      // v4: update sem animação usa 'none' (antes era 0)
      chart.update(this.UseAnimation ? undefined : "none");
    },

    _destroyChart() {
      if (this.chartElement) {
        try {
          this.chartElement.destroy();
        } catch (_) {
          // noop
        } finally {
          this.chartElement = null;
          this.dsIndexByField = Object.create(null);
        }
      }
    },
  },

  mounted() {
    this.ensureChartInitialized();
    this.loadData();
  },

  beforeUnmount() {
    if (this.debounce) clearTimeout(this.debounce);
    this._destroyChart();
  },
};
</script>

<style scoped>
.chart-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
}

canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
