<template>
  <div>
    <label>{{ Label }}</label>
    <div>
        <q-btn v-for="(option, index) in Options"
        :key="index"
        :disable="readonly"
        :label="option.label"
        :outline="!values.includes(option.value)"
        color="primary"
        @click="toggleValue(option.value)">
        <q-tooltip>{{ option.tooltip }}</q-tooltip>
        </q-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

defineOptions({ name: 'ui-formparts-btnselector' })

const props = defineProps({
  Label: String,
  Options: Array,
  modelValue: Array,
  readonly: Boolean,
})

const emit = defineEmits(['update:model-value'])

const values = ref([])

watch(values, () => {
  emit('update:model-value', values.value)
}, { deep: true })

watch(() => props.modelValue, () => {
  values.value = props.modelValue
}, { deep: true })

function toggleValue(value) {
  if (values.value.includes(value)) {
    values.value.splice(values.value.indexOf(value), 1)
  } else {
    values.value.push(value)
  }
}
</script>
