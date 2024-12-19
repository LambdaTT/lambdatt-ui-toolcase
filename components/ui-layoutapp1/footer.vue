<template>
  <q-footer elevated>
    <q-tabs v-model="currentTab" indicator-color="amber-9" active-color="amber-9" class="bg-white text-grey-8 shadow-2">
      <q-tab name="tickets" icon="fas fa-ticket" label="Chamados" @click="() => {$emit('main-tab-change', currentTab)}" />
      <q-tab name="replenishment" icon="fas fa-truck-ramp-box" label="Abastecimento" @click="() => {$emit('main-tab-change', currentTab)}" />
    </q-tabs>
  </q-footer>
</template>

<script>
export default {
  name: 'header-component',

  data() {
    return {
      currentTab: 'tickets'
    }
  },
}
</script>

<style scoped>
footer{
  position: fixed !important;
}
</style>
