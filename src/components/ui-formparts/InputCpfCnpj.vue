<template>
  <q-input type="text" square filled hide-bottom-space :label="Label" :clearable="false" :dense="dense" :hint="hint"
    :disable="disable" :readonly="readonly" maxlength="18" :mask="mask"
    :class="`full-width bg-${BgColor ? BgColor : 'white'}`" v-model="value" :error="Error" :error-message="ErrorMsg"
    @focus="() => $emit('focus')">
    <template v-slot:append>
      <slot name="buttons"></slot>
      <q-icon :name="Icon ?? 'fas fa-id-card'" color="grey-8" />
    </template>
  </q-input>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

defineOptions({ name: 'ui-formparts-input-cpf-cnpj' })

const props = defineProps({
  Icon: String,
  modelValue: String,
  readonly: Boolean,
  disable: Boolean,
  dense: Boolean,
  clearable: Boolean,
  Default: String,
  Label: String,
  Error: Boolean,
  ErrorMsg: String,
  CpfOnly: Boolean,
  CnpjOnly: Boolean,
  BgColor: String,
  hint: String,
})

const emit = defineEmits(['focus', 'update:modelValue'])

const value = ref(null)

const mask = computed(() => {
  let mask = '###.###.###-###'

  if (props.CpfOnly) mask = '###.###.###-##'
  if (props.CnpjOnly) mask = '##.###.###/####-##'

  if (value.value) {
    const onlyDigits = value.value.replace(/\D+/g, '')
    if (onlyDigits.length > 11) mask = '##.###.###/####-##'
  }

  return mask
})

watch(() => props.modelValue, (val) => {
  value.value = val ?? null
})

watch(value, (val) => {
  if (!val) return clear()
  else if (val.length < 14) return

  emitValue()
})

function clear() {
  value.value = props.Default || null
  emitValue()
}

function emitValue() {
  emit('update:modelValue', value.value)
}

onMounted(() => {
  if (props.Default) {
    value.value = props.Default
  }
})
</script>