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
        <b>{{ error?.response?.status }}</b> {{ error?.response?.statusText }}
      </div>
    </div>

    <!-- Empty -->
    <div
      class="text-center q-pa-xl"
      v-show="!showLoader && !error && data?.length === 0"
    >
      <div><q-icon size="lg" name="far fa-folder-open" /></div>
      <div class="text-h6">Sem Dados</div>
      <div class="text-caption">
        Nenhuma informação disponível para alimentar o gráfico
      </div>
    </div>

    <!-- Content -->
    <div v-show="!showLoader && !error && data && data.length > 0">
      <div class="text-center" :style="{ width: Size, height: height }">
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
  name: "ui-charts-pie",

  props: {
    ShowLegend: { type: Boolean, default: false },
    ShowPercentage: { type: Boolean, default: false },
    BeforeLoad: Function,
    OnLoaded: Function,
    Size: { type: String, default: () => "100%" },
    ChartType: { type: String, default: () => "pie" }, // 'pie' | 'doughnut'
    DataURL: { type: String, required: true },
    Filters: { type: Object, default: () => ({}) },
    /**
     * Configs: { LabelField: 'name', ValueField: 'value' }
     */
    Configs: {
      type: Object,
      required: true,
      validator: (v) => !!v.LabelField && !!v.ValueField,
    },
  },

  data() {
    return {
      chartElement: null,
      data: [],
      loading: false,
      showLoader: false,
      error: null,
      state: "ready",
      debounce: null,
    };
  },

  computed: {
    height() {
      const wrapper = this.$refs.canvas?.parentElement;
      if (!wrapper) return "250px";
      const width = wrapper.offsetWidth || 300;
      const aspectRatio = 1;
      return width * aspectRatio + "px";
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
      this.debounce = setTimeout(this.loadData, 400);
    },

    async loadData() {
      this.error = null;
      this.state = "loading";
      try {
        if (this.BeforeLoad) await this.BeforeLoad(this.Filters);

        const resp = await this.$getService("toolcase/http").get(
          this.DataURL,
          this.Filters,
        );
        this.data = Array.isArray(resp.data) ? resp.data : [];

        if (this.OnLoaded) await this.OnLoaded(resp);
        this.state = "ready";
      } catch (err) {
        this.$getService("toolcase/utils")?.notifyError?.(err);
        console.error("Error fetching chart data", err);
        this.error = err;
        this.$emit("error-thrown", err);
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

      this.chartElement = new Chart(ctx, {
        type: this.ChartType,
        data: {
          labels: [],
          datasets: [
            {
              label: "",
              data: [],
              backgroundColor: [],
              hoverOffset: 4,
            },
          ],
        },
        options: this.buildBaseOptions(),
      });
    },

    buildBaseOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: this.ShowLegend },
          // v4: callbacks de tooltip recebem (context)
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.parsed) || 0;
                const dataset = context.dataset;
                const total = dataset.data.reduce(
                  (a, b) => a + Number(b || 0),
                  0,
                );
                const pct =
                  total > 0
                    ? ((value / total) * 100).toFixed(2) + "%"
                    : "0%";
                const labelText = context.label || "";
                if (this.ShowPercentage) {
                  return `${labelText}: ${value} (${pct})`;
                }
                return `${labelText}: ${value}`;
              },
            },
          },
        },
      };
    },

    // Cor estável por rótulo (evita "piscar" a cada update)
    colorForLabel(label) {
      let h = 0;
      for (let i = 0; i < String(label).length; i++) {
        h = (h * 31 + String(label).charCodeAt(i)) >>> 0;
      }
      const hue = h % 360;
      return `hsl(${hue}, 65%, 55%)`;
    },

    updateChart() {
      this.ensureChartInitialized();
      const ch = this.chartElement;
      if (!ch) return;

      if (!this.data || this.data.length === 0) {
        ch.data.labels = [];
        ch.data.datasets[0].data = [];
        ch.data.datasets[0].backgroundColor = [];
        ch.update("none");
        return;
      }

      const labelKey = this.Configs.LabelField;
      const valueKey = this.Configs.ValueField;

      const labels = [];
      const values = [];
      const colors = [];

      for (let i = 0; i < this.data.length; i++) {
        const row = this.data[i];
        const label = row?.[labelKey];
        const value = Number(row?.[valueKey] || 0);
        labels.push(label);
        values.push(value);
        colors.push(this.colorForLabel(label));
      }

      ch.data.labels = labels.slice();
      ch.data.datasets[0].data = values.slice();
      ch.data.datasets[0].backgroundColor = colors.slice();

      ch.update();
    },

    _destroyChart() {
      if (this.chartElement) {
        try {
          this.chartElement.destroy();
        } catch (_) {
          // noop
        } finally {
          this.chartElement = null;
        }
      }
    },
  },

  async mounted() {
    this.ensureChartInitialized();
    await this.loadData();
  },

  beforeUnmount() {
    if (this.debounce) clearTimeout(this.debounce);
    this._destroyChart();
  },
};
</script>
