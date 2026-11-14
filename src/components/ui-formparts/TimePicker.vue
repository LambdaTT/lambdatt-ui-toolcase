<template>
  <q-input hide-bottom-space :class="`full-width bg-${BgColor ? BgColor : 'white'}`" :label="Label" :dense="dense" :hint="hint"
    readonly filled :model-value="displayValue" :error="Error">
    <template v-slot:append>
      <q-icon id="clear-button" v-if="hasValue && !readonly" name="cancel" clickable @click="clear()"
        class="cursor-pointer">
        <q-tooltip>Limpar seleção</q-tooltip>
      </q-icon>
      <q-icon v-if="readonly" name="fas fa-clock" color="grey-8" class="cursor-ban"></q-icon>
      <q-icon v-if="!readonly" name="fas fa-clock" color="primary" clickable @click="$emit('focus')"
        class="cursor-pointer">
        <q-tooltip>Selecionar hora</q-tooltip>
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <div v-if="range" class="column items-center q-pa-sm">
            <div class="row no-wrap q-gutter-sm time-range-picker">
              <div class="column items-center">
                <div class="text-caption q-pb-xs">De</div>
                <q-time :with-seconds="withSeconds" :model-value="value?.from"
                  @update:model-value="updateRangeValue('from', $event)" format24h>
                </q-time>
              </div>
              <div class="column items-center">
                <div class="text-caption q-pb-xs">Até</div>
                <q-time :with-seconds="withSeconds" :model-value="value?.to"
                  @update:model-value="updateRangeValue('to', $event)" format24h>
                </q-time>
              </div>
            </div>
            <div class="row items-center justify-end full-width q-pt-sm">
              <q-btn v-close-popup label="Fechar" color="primary" flat />
            </div>
          </div>
          <q-time v-else :with-seconds="withSeconds" @update:model-value="updateModelValue" v-model="value" format24h>
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Fechar" color="primary" flat />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

defineOptions({ name: 'ui-formparts-timepicker' })

const props = defineProps({
  BgColor: String,
  dense: Boolean,
  Label: String,
  Error: Boolean,
  modelValue: [String, Object],
  readonly: Boolean,
  Default: [String, Object],
  withSeconds: Boolean,
  hint: String,
  range: Boolean,
})

const emit = defineEmits(['focus', 'update:model-value'])

const value = ref(null)

watch(() => props.modelValue, (v) => {
  value.value = v;
})

function updateModelValue(v) {
  value.value = `${v}`;
  emit('update:model-value', value.value);
}

function updateRangeValue(endpoint, val) {
  value.value = {
    from: value.value?.from ?? null,
    to: value.value?.to ?? null,
    [endpoint]: val,
  };
  emit('update:model-value', value.value);
}

function clear() {
  value.value = props.Default;
  emit('update:model-value', props.Default);
}

const displayValue = computed(() => {
  if (!props.range) return value.value;

  const from = value.value?.from;
  const to = value.value?.to;

  if (from && to) return `De: ${from} - Até: ${to}`;
  if (from) return `De: ${from}`;
  if (to) return `Até: ${to}`;
  return null;
})

const hasValue = computed(() =>
  props.range ? !!(value.value?.from || value.value?.to) : !!value.value,
)

onMounted(() => {
  if (!props.modelValue)
    clear();
  else value.value = props.modelValue;
})
</script>
<style scoped>
.time-range-picker {
  max-height: calc(100vh - 32px);
  overflow: auto;
}

@media (max-width: 640px) {
  .time-range-picker {
    flex-direction: column;
    align-items: center;
  }
}

.cursor-ban {
  cursor: not-allowed
}

#clear-button {
  opacity: 0.7;
}

#clear-button:hover {
  opacity: 1;
}
</style>