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

export default {
  name: "ui-charts-gauge",

  props: {
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
  },

  data() {
    return {
      chartInstance: null,
      gaugeColor: "#000",
      debounceTimeoutId: null,
    };
  },

  mounted() {
    const ctx = this.$refs.gaugeChart.getContext("2d");
    const gaugeValue = Math.min(
      Math.max(this.value, this.minValue),
      this.maxValue,
    );
    const normalizedValue =
      ((gaugeValue - this.minValue) / (this.maxValue - this.minValue)) * 100;

    const gaugeColor =
      normalizedValue < 33
        ? "#FF0000" // Red for low
        : normalizedValue < 66
        ? "#FFFF00" // Yellow for medium
        : "#4CAF50"; // Green for high
    this.gaugeColor = gaugeColor;

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

    this.chartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [normalizedValue, 100 - normalizedValue],
            backgroundColor: [gaugeColor, "#E0E0E0"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        rotation: -Math.PI,        // v4: radianos, começa da esquerda
        circumference: Math.PI,    // semi-círculo
        cutout: "60%",             // v4: usa string com %, não cutoutPercentage
        _gaugeMax: 100,            // valor customizado lido pelo plugin
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: { duration: 1000 },
      },
      plugins: [needlePlugin],
    });
  },

  watch: {
    value(newValue) {
      this.updChartData(newValue);
    },

    maxValue() {
      this.updChartData(this.value);
    },

    minValue() {
      this.updChartData(this.value);
    },
  },

  methods: {
    updChartData(newValue) {
      if (this.debounceTimeoutId) clearTimeout(this.debounceTimeoutId);

      this.debounceTimeoutId = setTimeout(() => {
        if (this.chartInstance) {
          const gaugeValue = Math.min(
            Math.max(newValue, this.minValue),
            this.maxValue,
          );
          const normalizedValue =
            ((gaugeValue - this.minValue) / (this.maxValue - this.minValue)) *
            100;

          const gaugeColor =
            normalizedValue < 33
              ? "#FF0000"
              : normalizedValue < 66
              ? "#FFFF00"
              : "#4CAF50";

          this.gaugeColor = gaugeColor;

          this.chartInstance.data.datasets[0].data = [
            normalizedValue,
            100 - normalizedValue,
          ];
          this.chartInstance.data.datasets[0].backgroundColor = [
            gaugeColor,
            "#E0E0E0",
          ];
          this.chartInstance.update();
        }
      }, 200);
    },
  },

  beforeUnmount() {
    if (this.debounceTimeoutId) clearTimeout(this.debounceTimeoutId);
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  },
};
</script>

<style scoped>
canvas {
  max-width: 100%;
  max-height: 100%;
}
</style>
