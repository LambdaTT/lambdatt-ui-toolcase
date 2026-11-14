<template>
  <q-input type="text" square filled hide-bottom-space :label="Label" :clearable="clearable" :dense="dense"
  :disable="disable" :readonly="readonly" :mask="mask" :hint="hint"
    :class="`full-width bg-${BgColor ? BgColor : 'white'}`" v-model="value" :error="hasError" :error-message="ErrorMsg"
    @focus="() => $emit('focus')">
    <template v-slot:append>
      <slot name="buttons"></slot>
      <q-icon :name="Icon ?? 'fas fa-calendar-alt'" color="grey-8" />
    </template>
  </q-input>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

defineOptions({ name: 'ui-formparts-inputdate' })

const props = defineProps({
  modelValue: String,
  readonly: Boolean,
  disable: Boolean,
  dense: Boolean,
  clearable: Boolean,
  withTime: Boolean,
  withSeconds: Boolean,
  Icon: String,
  BrazilianFormat: Boolean,
  Default: String,
  Label: String,
  Error: Boolean,
  ErrorMsg: String,
  BgColor: String,
  hint: String,
})

const emit = defineEmits(['focus', 'update:modelValue', 'update:state'])

const value = ref(null)
const state = ref('pending')
const error = ref(false)
const errormsg = ref('')

const hasError = computed(() => state.value === 'error' || error.value || props.Error)

const mask = computed(
  () => `${props.withTime ? `##/##/#### ##:##${props.withSeconds ? ':##' : ''}` : '##/##/####'}`,
)

watch(() => props.modelValue, (val) => {
  if (val && val.length >= 10) {
    let date = val.split(' ')[0];
    let time = val.split(' ')[1] ?? null;

    // If typing mode is enabled, we set the modelValue to the current date, but reverting from 'yyyy-mm-dd' to 'dd/mm/yyyy':
    let dateParts = date.split('-');
    value.value = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

    if (props.withTime) {
      value.value += ` ${time ?? '00:00:00'}`;
    }
  } else {
    // Reset the typing mode options when closed
    value.value = null;
  }
})

watch(value, (val) => {
  error.value = false;
  errormsg.value = '';
  state.value = 'pending';

  if (!val) return clear();
  else if (val.length < 10) return;

  doEmit(val);
})

function clear() {
  value.value = props.Default || null;
  error.value = false;
  errormsg.value = '';
  doEmit(value.value);
}

function doEmit(val) {
  let emitValue = null;

  if (val) {
    const [datePart, timePart] = val.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);

    if (!(day > 0 && day <= 31 && month > 0 && month <= 12 && year > 0)) {
      error.value = true;
      errormsg.value = 'Data inválida';
      state.value = 'error';
      return;
    }

    if (timePart) {
      const timeParts = timePart.split(':');
      if (timeParts.length < 2 || timeParts.length > 3) {
        error.value = true;
        errormsg.value = 'Hora inválida';
        state.value = 'error';
        return;
      }
      const [hours, minutes, seconds] = timeParts.map(Number);
      if (!(hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60 && (seconds === undefined || (seconds >= 0 && seconds < 60)))) {
        error.value = true;
        errormsg.value = 'Hora inválida';
        state.value = 'error';
        return;
      }
    }

    state.value = 'success';

    emitValue = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    if (props.withTime) emitValue += ` ${timePart ?? '00:00:00'}`;
  }

  emit('update:modelValue', emitValue);
  emit('update:state', state.value);
}

onMounted(() => {
  if (props.Default) {
    value.value = props.Default;
  }
})
</script>