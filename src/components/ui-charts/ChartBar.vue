<template>
  <ChartLinear ChartType="bar" :BeforeLoad="BeforeLoad" :OnLoaded="OnLoaded" :Height="Height" :DataURL="DataURL"
    :Data="Data" :Filters="Filters" :Datasets="Datasets" :Configs="Configs">
  </ChartLinear>
</template>

<script setup>
defineOptions({ name: 'ui-charts-bar' })

defineProps({
  BeforeLoad: Function,
  OnLoaded: Function,
  Height: String,
  DataURL: String,
  // Static data (mock mode) — passed through to ChartLinear.
  Data: { type: Array, default: null },
  Filters: Object,
  Datasets: Array,
  Configs: Object,
})
</script>
