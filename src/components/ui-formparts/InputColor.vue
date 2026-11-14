<template>
  <div>
    <q-input hide-bottom-space :class="`full-width bg-${BgColor ? BgColor : 'white'}`" square filled :dense="dense" readonly v-model="value" :error="Error" :hint="hint"
      @focus="() => $emit('focus')" :label="Label">
      <template v-slot:append>
        <span v-if="!!value" :style="`background-color:${value};`" id="color-preview"></span>
        <q-icon id="clear-button" v-if="!!value && !readonly" name="cancel" clickable @click="clear()"
          class="cursor-pointer">
          <q-tooltip>Limpar seleção</q-tooltip>
        </q-icon>
        <q-icon v-if="readonly" name="colorize" color="grey-8" class="cursor-ban"></q-icon>
        <q-icon v-if="!readonly" clickable @click="$emit('focus');" name="colorize" color="primary"
          class="cursor-pointer">
          <q-tooltip>Selecionar cor</q-tooltip>
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-color v-model="value" />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

defineOptions({ name: 'ui-formparts-inputcolor' })

const props = defineProps({
  BgColor: String,
  readonly: Boolean,
  dense: Boolean,
  modelValue: String,
  Label: String,
  Error: Boolean,
  Default: String,
  hint: String,
})

const emit = defineEmits(['focus', 'update:model-value'])

const value = ref(null)

watch(() => props.modelValue, (v) => {
  value.value = v
})

watch(value, (v) => {
  updModelValue(v)
})

function updModelValue(v) {
  emit('update:model-value', v)
}

function clear() {
  if (props.Default) value.value = props.Default
  else value.value = props.modelValue
}

// created()
clear()
</script>

<style scoped>
#color-preview {
  display: inline-block;
  border: 0.5px solid;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}
</style>