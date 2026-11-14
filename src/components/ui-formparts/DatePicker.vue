<template>
  <q-input hide-bottom-space :class="`full-width bg-${BgColor ? BgColor : 'white'}`" :dense="dense" readonly filled :hint="hint"
    square v-model="formattedDate" :error="Error" :label="Label">
    <template v-slot:append>
      <q-icon id="clear-button" v-if="!!formattedDate && !readonly" name="cancel" clickable @click="clear()"
        class="cursor-pointer">
        <q-tooltip>Limpar seleção</q-tooltip>
      </q-icon>
      <q-icon v-if="readonly" name="fas fa-calendar-alt" color="grey-8" class="cursor-ban"></q-icon>
      <q-icon v-else clickable @click="$emit('focus');" name="fas fa-calendar-alt" color="primary"
        class="cursor-pointer">
        <q-tooltip>Selecionar {{ range ? 'Período' : 'Data' }}</q-tooltip>
        <q-popup-proxy cover transition-show="scale" transition-hide="scale" style="margin: 0;">
          <q-card>
            <q-date :emit-immediately="!range" :range="range" :today-btn="todayBtn" :options="dateOptions"
              :navigation-min-year-month="minDatePage" :navigation-max-year-month="maxDatePage" v-model="date"
              @update:model-value="updateModelValue()">
            </q-date>
            <div v-if="withTime" class="q-pa-sm">
              <TimePicker :withSeconds="withSeconds" dense :Label="range ? 'De:' : 'Hora'" v-model="firstTime"
                :Default="defaultFirstTime" @update:model-value="updateModelValue()">
              </TimePicker>
              <TimePicker :withSeconds="withSeconds" v-if="range" dense Label="Até:" v-model="lastTime"
                :Default="defaultLastTime" class="q-pt-sm" @update:model-value="updateModelValue()">
              </TimePicker>
            </div>
            <div class="row items-center justify-end q-pa-sm">
              <q-btn v-close-popup class="q-mr-sm" label="Digitar" color="primary" dense @click="typingMode = true" />
              <q-btn v-close-popup label="Fechar" color="primary" flat dense />
            </div>
          </q-card>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

defineOptions({ name: 'ui-formparts-datepicker' })

const props = defineProps({
  modelValue: { type: [String, Object] },
  Default: { type: [String, Object] },
  BgColor: String,
  Label: String,
  Error: { type: Boolean, default: false },
  dateOptions: { type: [Array, Function] },
  dense: Boolean,
  range: Boolean,
  readonly: Boolean,
  withTime: Boolean,
  withSeconds: Boolean,
  todayBtn: Boolean,
  minDatePage: String,
  maxDatePage: String,
  hint: String,
})

const emit = defineEmits(['focus', 'update:model-value'])

const defaultFirstTime = ref(null)
const defaultLastTime = ref(null)
const firstTime = ref(null)
const lastTime = ref(null)
const date = ref(null)
const typingMode = ref(false)

watch(date, () => {
  updateModelValue();
})

watch(firstTime, () => {
  updateModelValue();
})

watch(lastTime, () => {
  updateModelValue();
})

function setDefault() {
  var v = props.Default ?? null;
  var newDate;
  var newFirstTime;
  var newLastTime;

  if (v) {
    // For date range:
    if (typeof v == 'object') {
      newDate = {
        from: null,
        to: null
      };
      newFirstTime = null;
      newLastTime = null;

      if (v.from) {
        if (v.from.includes(':')) {
          let arr = v.from.split(' ');
          newDate.from = arr[0];
          newFirstTime = arr[1];
        } else {
          newDate.from = v.from;
        }
      }

      if (v.to) {
        if (v.to.includes(':')) {
          let arr = v.to.split(' ');
          newDate.to = arr[0];
          newLastTime = arr[1];
        } else {
          newDate.to = v.to;
        }
      }
    }

    // For single date:
    else {
      if (v.includes(':')) {
        let arr = v.split(' ');
        newDate = arr[0];
        newFirstTime = arr[1];
      } else {
        newDate = v;
      }
    }
  } else {
    newDate = null;
    newFirstTime = null;
    newLastTime = null;
  }

  date.value = newDate;
  firstTime.value = newFirstTime;
  lastTime.value = newLastTime;

  if (!!props.Default && newFirstTime) {
    defaultFirstTime.value = newFirstTime;
  }
  if (!!props.Default && newLastTime) {
    defaultLastTime.value = newLastTime;
  }
}

function updateModelValue() {
  var val;

  // For date range:
  if (props.range && date.value != null) {
    const normalize = (d) => (d ? d.replaceAll('/', '-') : null);

    let from, to;

    if (typeof date.value === 'object') {
      from = normalize(date.value.from);
      to   = normalize(date.value.to);
    } else {
      const normalized = normalize(date.value);
      from = normalized;
      to   = normalized;
    }

    if (from && firstTime.value) from = `${from} ${firstTime.value}`;
    if (to && lastTime.value) to = `${to} ${lastTime.value}`;

    val = { from, to };
  }

  // Legacy code:
  // if (this.date != null && (typeof this.date == 'object' || this.range)) {
  //   // 1. Handle date:
  //   val = {
  //     from: !!this.date.from ? this.date.from.replaceAll('/', '-') : null,
  //     to: !!this.date.to ? this.date.to.replaceAll('/', '-') : null,
  //   };
  //   // 2. Handle first time:
  //   if (!!val.from && this.firstTime) val.from = `${val.from} ${this.firstTime}`
  //   // 3. Handle last time:
  //   if (!!val.to && this.lastTime) val.to = `${val.to} ${this.lastTime}`
  // }

  // For single date:
  else {
    // 1. Handle date:
    val = date.value ? date.value.replaceAll('/', '-') : null;
    // 2. Handle first time:
    if (!!val && firstTime.value) val = `${val} ${firstTime.value}`
  }
  emit('update:model-value', val);
}

function clear() {
  setDefault();
  emit('update:model-value', props.Default);
  if (props.withTime) {
    defaultFirstTime.value = firstTime.value ? firstTime.value : '00:00:00';
    if (props.range)
      defaultLastTime.value = lastTime.value ? lastTime.value : '23:59:59';

  }
}

const formattedDate = computed(() => {
  if (props.modelValue) {
    if (typeof props.modelValue == 'object') {
      if (!props.modelValue?.from || !props.modelValue?.to) return null;

      let fromData = props.modelValue.from.split('-');
      let toData = props.modelValue.to.split('-');

      var dayFrom = fromData[2];
      var dayTo = toData[2];
      if (props.modelValue.from.includes(':')) {
        let dayData = dayFrom.split(' ');
        dayFrom = dayData[0];
        fromData[0] = `${fromData[0]} ${dayData[1]}`;
      }
      if (props.modelValue.to.includes(':')) {
        let dayData = dayTo.split(' ');
        dayTo = dayData[0];
        toData[0] = `${toData[0]} ${dayData[1]}`;
      }

      return `De: ${dayFrom}/${fromData[1]}/${fromData[0]}  ->  Até: ${dayTo}/${toData[1]}/${toData[0]}`
    } else {
      var dateData = props.modelValue.split('-');

      var day = dateData[2];
      if (props.modelValue.includes(':')) {
        let dayData = day.split(' ');
        day = dayData[0];
        dateData[0] = `${dateData[0]} ${dayData[1]}`;
      }
      return `${day}/${dateData[1]}/${dateData[0]}`
    }
  }
  else return null;
})

onMounted(() => {
  setTimeout(() => {
    setDefault();
  }, 200);
})
</script>
<style scoped>
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