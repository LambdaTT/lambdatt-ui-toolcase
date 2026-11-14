<template>
  <div>
    <div
      v-if="ShowProgression"
      class="text-center text-bold text-h6"
      :style="`color:${gaugeColor}`"
    >
      {{ FormatProgression ? FormatProgression(value) : value }} /
      {{ FormatProgression ? FormatProgression(maxValue) : maxValue }}
    </div>
    <canvas style="width: 100%" ref="gaugeChart"></canvas>
  </div>
</template>

<script>
// Libs (chart.js v4 — ESM com tipos embutidos):
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
</script>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";

defineOptions({ name: "ui-charts-gauge" });

const props = defineProps({
  ShowProgression: Boolean,
  FormatProgression: Function,
  value: {
    type: Number,
    required: true,
  },
  minValue: {
    type: Number,
    default: 0,
  },
  maxValue: {
    type: Number,
    default: 100,
  },
});

const gaugeChart = ref(null);
const gaugeColor = ref("#000");
let chartInstance = null;
let debounceTimeoutId = null;

watch(
  () => props.value,
  (newValue) => {
    updChartData(newValue);
  },
);

watch(
  () => props.maxValue,
  () => {
    updChartData(props.value);
  },
);

watch(
  () => props.minValue,
  () => {
    updChartData(props.value);
  },
);

function updChartData(newValue) {
  if (debounceTimeoutId) clearTimeout(debounceTimeoutId);

  debounceTimeoutId = setTimeout(() => {
    if (chartInstance) {
      const gaugeValue = Math.min(
        Math.max(newValue, props.minValue),
        props.maxValue,
      );
      const normalizedValue =
        ((gaugeValue - props.minValue) / (props.maxValue - props.minValue)) *
        100;

      const color =
        normalizedValue < 33
          ? "#FF0000"
          : normalizedValue < 66
          ? "#FFFF00"
          : "#4CAF50";

      gaugeColor.value = color;

      chartInstance.data.datasets[0].data = [
        normalizedValue,
        100 - normalizedValue,
      ];
      chartInstance.data.datasets[0].backgroundColor = [color, "#E0E0E0"];
      chartInstance.update();
    }
  }, 200);
}

onMounted(() => {
  const ctx = gaugeChart.value.getContext("2d");
  const gaugeValue = Math.min(
    Math.max(props.value, props.minValue),
    props.maxValue,
  );
  const normalizedValue =
    ((gaugeValue - props.minValue) / (props.maxValue - props.minValue)) * 100;

  const color =
    normalizedValue < 33
      ? "#FF0000" // Red for low
      : normalizedValue < 66
      ? "#FFFF00" // Yellow for medium
      : "#4CAF50"; // Green for high
  gaugeColor.value = color;

  // Plugin inline (v4): acesso via chart.ctx, chart.chartArea, chart.getDatasetMeta()
  const needlePlugin = {
    id: "gaugeNeedle",
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data || meta.data.length === 0) return;

      const arc = meta.data[0];
      const outerRadius = arc.outerRadius;
      const innerRadius = arc.innerRadius;
      const radius = (innerRadius + outerRadius) / 2;

      // Centro do semi-círculo
      const centerX = arc.x;
      const centerY = arc.y;

      // Ângulo da agulha baseado no valor normalizado (0–100 → 180°–0°)
      const normalizedValue = chart.data.datasets[0].data[0];
      const angle =
        Math.PI + (normalizedValue / chart.options._gaugeMax) * Math.PI;

      // Desenha a agulha
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.02);
      ctx.lineTo(radius * 0.9, 0);
      ctx.lineTo(0, radius * 0.02);
      ctx.fillStyle = "#000000";
      ctx.fill();
      ctx.restore();

      // Texto da porcentagem
      const chartHeight = chart.chartArea.bottom - chart.chartArea.top;
      ctx.font = `${Math.round(chartHeight / 5)}px Arial`;
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.fillText(
        `${Math.round(normalizedValue)}%`,
        centerX,
        centerY - radius * 0.6,
      );
    },
  };

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [normalizedValue, 100 - normalizedValue],
          backgroundColor: [color, "#E0E0E0"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      rotation: -Math.PI, // v4: radianos, começa da esquerda
      circumference: Math.PI, // semi-círculo
      cutout: "60%", // v4: usa string com %, não cutoutPercentage
      _gaugeMax: 100, // valor customizado lido pelo plugin
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      animation: { duration: 1000 },
    },
    plugins: [needlePlugin],
  });
});

onBeforeUnmount(() => {
  if (debounceTimeoutId) clearTimeout(debounceTimeoutId);
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>

<style scoped>
canvas {
  max-width: 100%;
  max-height: 100%;
}
</style>
