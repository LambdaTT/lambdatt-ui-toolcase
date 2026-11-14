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
</script>

<script setup>
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  markRaw,
  getCurrentInstance,
} from "vue";

defineOptions({ name: "ui-charts-linear" });

const props = defineProps({
  BeforeLoad: Function,
  OnLoaded: Function,
  Height: { type: String, default: () => "100%" },
  Width: { type: String, default: () => "100%" },
  ChartType: { type: String, default: () => "line" }, // 'line' | 'bar' | etc
  // Optional when `Data` is provided (local/mock mode, no HTTP).
  DataURL: { type: String, required: false, default: "" },
  // When provided, the chart renders this array directly instead of fetching
  // from `DataURL` (presentation/mock mode). Additive & backward-compatible:
  // when null, the HTTP path is used exactly as before.
  Data: { type: Array, default: null },
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
});

const emit = defineEmits(["error-thrown"]);

// Submódulo acessa os serviços do app pelo $getService global (resolução por URI) — equivalente
// ao this.$getService do Options API.
const getService =
  getCurrentInstance().appContext.config.globalProperties.$getService;

const vTypes = ["column"];
const hTypes = ["line", "bar", "area"];
let chartElement = null;
const data = ref([]);
const loading = ref(false);
const showLoader = ref(false);
const error = ref(null);
const state = ref("ready"); // ready | loading | error
let debounce = null;

// Internal mapping to control datasets by "field"
let dsIndexByField = Object.create(null);

const canvas = ref(null);

const orientation = computed(() => {
  if (vTypes.includes(props.ChartType)) return "vertical";
  if (hTypes.includes(props.ChartType)) return "horizontal";
  throw new Error("Invalid chart type");
});

// Horizontal bars (Configs.indexAxis === 'y') grow in HEIGHT with the number
// of categories so the chart scrolls vertically inside its container; width
// stays fluid. Everything else keeps the original vertical behavior.
const isHorizontalBars = computed(() => props.Configs?.indexAxis === "y");

const dynamicWidth = computed(() => {
  if (isHorizontalBars.value) return props.Width;
  if (orientation.value === "vertical") return props.Width;
  const w = Math.max(250, data.value.length * 25);
  return `${Math.ceil(w)}px`;
});

const dynamicHeight = computed(() => {
  if (isHorizontalBars.value) {
    // Stacked ⇒ one bar per category; grouped ⇒ one per dataset.
    const perCategory = props.Configs?.stacked
      ? 44
      : Math.max(44, (props.Datasets?.length || 1) * 22);
    const h = Math.max(250, data.value.length * perCategory);
    return `${Math.ceil(h)}px`;
  }
  if (orientation.value === "horizontal") return props.Height;
  const w = Math.max(250, data.value.length * 25);
  return `${Math.ceil(w)}px`;
});

watch(loading, (v) => {
  showLoader.value = v;
});

watch(
  () => props.Filters,
  () => {
    debouncedLoad();
  },
  { deep: true },
);

// Local/mock mode: re-render when the provided array changes (e.g. filters).
watch(
  () => props.Data,
  () => {
    loadData();
  },
  { deep: true },
);

watch(
  data,
  () => {
    updateChart();
  },
  { deep: true },
);

watch(
  () => props.Datasets,
  () => {
    reconcileDatasetsStructureAndUpdate();
  },
  { deep: true },
);

// v4 não suporta troca de tipo em runtime — recria o chart
watch(
  () => props.ChartType,
  () => {
    _destroyChart();
    nextTick(() => {
      ensureChartInitialized();
      updateChart();
    });
  },
);

function debouncedLoad() {
  loading.value = true;
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(loadData, 500);
}

async function loadData() {
  error.value = null;
  state.value = "loading";
  try {
    if (props.BeforeLoad) await props.BeforeLoad(props.Filters);

    // Local/mock mode: render the provided array, skip HTTP entirely.
    if (Array.isArray(props.Data)) {
      data.value = props.Data.slice();
      if (props.OnLoaded) await props.OnLoaded({ data: data.value });
      state.value = "ready";
      return;
    }

    const response = await getService("toolcase/http").get(
      props.DataURL,
      props.Filters,
    );
    data.value = Array.isArray(response.data) ? response.data : [];
    if (props.OnLoaded) await props.OnLoaded(response);
    state.value = "ready";
  } catch (err) {
    getService("toolcase/utils")?.notifyError?.(err);
    console.error(
      "An error has occurred on the attempt to retrieve chart data.",
      err,
    );
    error.value = err;
    emit("error-thrown", err);
    state.value = "error";
  } finally {
    debounce = null;
    loading.value = false;
  }
}

function ensureChartInitialized() {
  if (chartElement) return;

  const el = canvas.value;
  if (!el) return;
  const ctx = el.getContext("2d");

  const baseOptions = buildBaseOptions();

  chartElement = markRaw(
    new Chart(ctx, {
      type: props.ChartType,
      data: { labels: [], datasets: [] },
      options: baseOptions,
    }),
  );

  dsIndexByField = Object.create(null);
  reconcileDatasetsStructureAndUpdate(true);
}

function buildBaseOptions() {
  // Optional orientation/stacking via Configs (default: current behavior).
  const indexAxis = props.Configs.indexAxis === "y" ? "y" : "x";
  const stacked = !!props.Configs.stacked;
  const horizontal = indexAxis === "y";
  const hasSecondary = (props.Datasets || []).some((d) => d.secondaryAxis);

  // The category axis gets the truncating tick callback; it is the x axis
  // for vertical charts and the y axis for horizontal bars.
  const categoryTicks = {
    autoSkip: false,
    callback: function (val) {
      const tick = this.getLabelForValue(val);
      const characterLimit = 12;
      if ((tick?.length ?? 0) >= characterLimit) {
        return (
          tick.substring(0, characterLimit - 1).trim().toLowerCase() + "..."
        );
      }
      return tick?.toLowerCase();
    },
  };

  // v4: tooltips agora em plugins.tooltip; callback recebe (context)
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis,
    animation: props.UseAnimation ? { duration: 400 } : false,
    plugins: {
      legend: { display: !props.Configs.hideLegend },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) => {
            const dsIndex = context.datasetIndex;
            const ds = props.Datasets[dsIndex];
            // On horizontal bars the measured value lives on the x axis.
            const value = horizontal ? context.parsed.x : context.parsed.y;
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
        stacked,
        beginAtZero: horizontal ? true : undefined,
        ticks: horizontal ? {} : categoryTicks,
      },
      y: {
        stacked,
        beginAtZero: horizontal ? undefined : true,
        ticks: horizontal ? categoryTicks : {},
      },
      // Opt-in secondary value axis (e.g. a small-magnitude series like
      // quantity shown next to large currency series). Datasets request it
      // via `secondaryAxis: true`; the axis id is 'v2'.
      ...(hasSecondary
        ? {
            v2: horizontal
              ? { axis: "x", position: "top", beginAtZero: true, grid: { drawOnChartArea: false } }
              : { axis: "y", position: "right", beginAtZero: true, grid: { drawOnChartArea: false } },
          }
        : {}),
    },
  };
}

function makePlainDatasetFromSpec(spec) {
  // Honor an explicit per-series color when provided (stable across
  // reloads); otherwise fall back to a random color.
  const color = spec.color
    ? spec.color
    : getService("toolcase/utils")?.randomHexColor
      ? getService("toolcase/utils").randomHexColor()
      : "#3489db";

  // Line smoothing: opt-in via Configs.tension (or per-series spec.tension).
  // Default 0 keeps the original straight segments for existing consumers.
  // Ignored by chart.js for non-line datasets (e.g. bars).
  const tension = spec.tension ?? props.Configs?.tension ?? 0;

  const ds = {
    label: spec.label,
    data: [],
    fill: false,
    backgroundColor: color,
    borderColor: color,
    borderWidth: 3,
    tension,
  };

  // Bind to the secondary value axis when requested (id 'v2'); the value
  // axis is x for horizontal bars and y otherwise.
  if (spec.secondaryAxis) {
    if (isHorizontalBars.value) ds.xAxisID = "v2";
    else ds.yAxisID = "v2";
  }

  return ds;
}

function reconcileDatasetsStructureAndUpdate(firstInit = false) {
  ensureChartInitialized();
  if (!chartElement) return;

  const chart = chartElement;
  const current = chart.data.datasets;
  const wanted = props.Datasets.map((ds) => ds.field);

  // 1) Remover datasets que não existem mais
  for (let i = current.length - 1; i >= 0; i--) {
    const fieldAtI = Object.keys(dsIndexByField).find(
      (f) => dsIndexByField[f] === i,
    );
    if (!fieldAtI || !wanted.includes(fieldAtI)) {
      current.splice(i, 1);
      rebuildDsIndexMapAfterRemoval(i);
    }
  }

  // 2) Adicionar/garantir datasets na ordem correta
  dsIndexByField = Object.create(null);
  for (let i = 0; i < props.Datasets.length; i++) {
    const spec = props.Datasets[i];
    if (current[i]) {
      current[i].label = spec.label;
    } else {
      current.push(makePlainDatasetFromSpec(spec));
    }
    dsIndexByField[spec.field] = i;
  }

  if (firstInit) {
    chart.update("none");
  } else {
    updateChart();
  }
}

function rebuildDsIndexMapAfterRemoval(removedIndex) {
  const newMap = Object.create(null);
  for (const field in dsIndexByField) {
    const idx = dsIndexByField[field];
    if (idx < removedIndex) newMap[field] = idx;
    else if (idx > removedIndex) newMap[field] = idx - 1;
  }
  dsIndexByField = newMap;
}

function updateChart() {
  ensureChartInitialized();
  const chart = chartElement;
  if (!chart) return;

  if (!data.value || data.value.length === 0) {
    chart.data.labels = [];
    chart.data.datasets.forEach((d) => {
      d.data = [];
    });
    chart.update("none");
    return;
  }

  const labels = [];
  const seriesByField = Object.create(null);
  for (const { field } of props.Datasets) {
    seriesByField[field] = [];
  }

  const xKey = props.Configs.xAxisKey;

  for (let i = 0; i < data.value.length; i++) {
    const row = data.value[i];
    labels.push(row[xKey]);
    for (const field in seriesByField) {
      seriesByField[field].push(row[field]);
    }
  }

  chart.data.labels = labels.slice();

  for (let i = 0; i < props.Datasets.length; i++) {
    const { field, label } = props.Datasets[i];
    const idx = dsIndexByField[field];
    if (idx == null) continue;
    const ds = chart.data.datasets[idx];
    ds.label = label;
    ds.data = (seriesByField[field] || []).slice();
  }

  // v4: update sem animação usa 'none' (antes era 0)
  chart.update(props.UseAnimation ? undefined : "none");
}

function _destroyChart() {
  if (chartElement) {
    try {
      chartElement.destroy();
    } catch {
      // noop
    } finally {
      chartElement = null;
      dsIndexByField = Object.create(null);
    }
  }
}

onMounted(() => {
  ensureChartInitialized();
  loadData();
});

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce);
  _destroyChart();
});
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
