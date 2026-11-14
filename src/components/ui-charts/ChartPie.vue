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

defineOptions({ name: "ui-charts-pie" });

const props = defineProps({
  ShowLegend: { type: Boolean, default: false },
  ShowPercentage: { type: Boolean, default: false },
  BeforeLoad: Function,
  OnLoaded: Function,
  Size: { type: String, default: () => "100%" },
  ChartType: { type: String, default: () => "pie" }, // 'pie' | 'doughnut'
  // Optional when `Data` is provided (local/mock mode, no HTTP).
  DataURL: { type: String, required: false, default: "" },
  // When provided, the chart renders this array directly instead of fetching
  // from `DataURL`. Additive & backward-compatible (null ⇒ HTTP path as before).
  Data: { type: Array, default: null },
  Filters: { type: Object, default: () => ({}) },
  /**
   * Configs: { LabelField: 'name', ValueField: 'value' }
   */
  Configs: {
    type: Object,
    required: true,
    validator: (v) => !!v.LabelField && !!v.ValueField,
  },
});

const emit = defineEmits(["error-thrown"]);

// Submódulo acessa os serviços do app pelo $getService global (resolução por URI) — equivalente
// ao this.$getService do Options API.
const getService =
  getCurrentInstance().appContext.config.globalProperties.$getService;

const canvas = ref(null);
let chartElement = null;
const data = ref([]);
const loading = ref(false);
const showLoader = ref(false);
const error = ref(null);
const state = ref("ready");
let debounce = null;

const height = computed(() => {
  const wrapper = canvas.value?.parentElement;
  if (!wrapper) return "250px";
  const width = wrapper.offsetWidth || 300;
  const aspectRatio = 1;
  return width * aspectRatio + "px";
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
  debounce = setTimeout(loadData, 400);
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

    const resp = await getService("toolcase/http").get(
      props.DataURL,
      props.Filters,
    );
    data.value = Array.isArray(resp.data) ? resp.data : [];

    if (props.OnLoaded) await props.OnLoaded(resp);
    state.value = "ready";
  } catch (err) {
    getService("toolcase/utils")?.notifyError?.(err);
    console.error("Error fetching chart data", err);
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

  chartElement = markRaw(
    new Chart(ctx, {
      type: props.ChartType,
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
      options: buildBaseOptions(),
    }),
  );
}

function buildBaseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: props.ShowLegend },
      // v4: callbacks de tooltip recebem (context)
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = Number(context.parsed) || 0;
            const dataset = context.dataset;
            const total = dataset.data.reduce((a, b) => a + Number(b || 0), 0);
            const pct =
              total > 0 ? ((value / total) * 100).toFixed(2) + "%" : "0%";
            const labelText = context.label || "";
            if (props.ShowPercentage) {
              return `${labelText}: ${value} (${pct})`;
            }
            return `${labelText}: ${value}`;
          },
        },
      },
    },
  };
}

// Cor estável por rótulo (evita "piscar" a cada update)
function colorForLabel(label) {
  let h = 0;
  for (let i = 0; i < String(label).length; i++) {
    h = (h * 31 + String(label).charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

function updateChart() {
  ensureChartInitialized();
  const ch = chartElement;
  if (!ch) return;

  if (!data.value || data.value.length === 0) {
    ch.data.labels = [];
    ch.data.datasets[0].data = [];
    ch.data.datasets[0].backgroundColor = [];
    ch.update("none");
    return;
  }

  const labelKey = props.Configs.LabelField;
  const valueKey = props.Configs.ValueField;

  const labels = [];
  const values = [];
  const colors = [];

  for (let i = 0; i < data.value.length; i++) {
    const row = data.value[i];
    const label = row?.[labelKey];
    const value = Number(row?.[valueKey] || 0);
    labels.push(label);
    values.push(value);
    colors.push(colorForLabel(label));
  }

  ch.data.labels = labels.slice();
  ch.data.datasets[0].data = values.slice();
  ch.data.datasets[0].backgroundColor = colors.slice();

  ch.update();
}

function _destroyChart() {
  if (chartElement) {
    try {
      chartElement.destroy();
    } catch {
      // noop
    } finally {
      chartElement = null;
    }
  }
}

onMounted(async () => {
  ensureChartInitialized();
  await loadData();
});

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce);
  _destroyChart();
});
</script>
