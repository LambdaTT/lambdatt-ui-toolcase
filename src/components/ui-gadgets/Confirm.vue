<template>
  <Dialog v-model="show" :Headline="question" :ContentText="details" :Actions="actions" @hide="onHide" />
</template>

<script setup>
// IMPORTS
import { ref, computed } from 'vue'


// VARS
const question = ref('')
const details = ref('')
const confirmationColor = ref('positive')
const show = ref(false)
// Guarda o resolve da Promise em aberto; nulo quando não há ask() pendente.
let resolver = null
// Computed para o `color` do Confirmar ser relido a cada ask() — um array estático
// congelaria a cor na primeira leitura e a troca por chamada não teria efeito.
const actions = computed(() => [
  { label: 'Cancelar', fn: () => settle(false) },
  { label: 'Confirmar', color: confirmationColor.value, fn: () => settle(true) },
])


// FUNCTIONS
function ask(q, c = 'positive', d = '') {
  question.value = q
  details.value = d
  confirmationColor.value = c
  return new Promise((resolve) => {
    resolver = resolve
    show.value = true
  })
}
function settle(value) {
  if (resolver) {
    resolver(value)
    resolver = null
  }
  show.value = false // fechar dispara @hide → onHide (já sem resolver, sem dupla resolução)
}
function onHide() {
  // Fechou pelo backdrop/ESC sem escolher → trata como cancelar, para o await nunca travar.
  if (resolver) {
    resolver(false)
    resolver = null
  }
}

defineExpose({ ask })
</script>
