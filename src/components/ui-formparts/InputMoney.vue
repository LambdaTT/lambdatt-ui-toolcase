<template>
  <q-input
    type="text"
    square
    filled
    hide-bottom-space
    :label="Label"
    :dense="dense"
    :hint="hint"
    :disable="disable"
    :readonly="readonly"
    :class="`full-width bg-${BgColor ? BgColor : 'white'}`"
    :error="Error"
    :error-message="ErrorMsg"
    v-model="displayValue"
    @focus="onFocus"
    @blur="onBlur"
    @keydown="onKeydown"
    @update:model-value="onInput"
  >
    <template v-slot:append>
      <slot name="buttons"></slot>
      <q-icon :name="Icon ?? 'fas fa-dollar-sign'" color="grey-8" />
    </template>
  </q-input>
</template>

<script>
const CURRENCIES = {
  BRL: {
    symbol: 'R$ ',
    thousandsSep: '.',
    decimalSep: ',',
    decimalPlaces: 2,
  },
  USD: {
    symbol: '$ ',
    thousandsSep: ',',
    decimalSep: '.',
    decimalPlaces: 2,
  },
}
</script>

<script setup>
import { ref, computed, watch } from 'vue'

defineOptions({ name: 'ui-formparts-input-money' })

const props = defineProps({
  modelValue: {
    type: Number,
    default: null,
  },
  Currency: {
    type: String,
    default: 'BRL',
    validator: (v) => Object.keys(CURRENCIES).includes(v),
  },
  Label: String,
  Icon: String,
  readonly: Boolean,
  disable: Boolean,
  dense: Boolean,
  Error: Boolean,
  ErrorMsg: String,
  BgColor: String,
  hint: String,
})

const emit = defineEmits(['focus', 'update:modelValue'])

const displayValue = ref('')
const focused = ref(false)

const cfg = computed(() => CURRENCIES[props.Currency] ?? CURRENCIES.BRL)

watch(
  () => props.modelValue,
  (val) => {
    if (!focused.value) {
      displayValue.value = formatFloat(val)
    }
  },
  { immediate: true },
)

watch(
  () => props.Currency,
  () => {
    const floatVal = parseDisplay(displayValue.value)
    displayValue.value = formatFloat(floatVal)
  },
)

// ─── Formatting ───────────────────────────────────────────────────────────

/**
 * Float → "R$ 1.234,56" / "$ 1,234.56"
 */
function formatFloat(val) {
  if (val === null || val === undefined || val === '')
    return formatDigitsAsCents('0')

  const num = parseFloat(val)
  if (isNaN(num)) return formatDigitsAsCents('0')

  const { thousandsSep, decimalSep, decimalPlaces, symbol } = cfg.value
  const fixed = Math.abs(num).toFixed(decimalPlaces)
  const [intPart, decPart] = fixed.split('.')
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep)

  return `${symbol}${num < 0 ? '-' : ''}${intFormatted}${decimalSep}${decPart}`
}

/**
 * "R$ 1.234,56" → 1234.56
 * Strips the symbol prefix, then normalizes separators.
 */
function parseDisplay(str) {
  if (!str && str !== 0) return null

  const { thousandsSep, decimalSep, symbol } = cfg.value

  // Remove symbol prefix (handles "R$ ", "$ ")
  let normalized = String(str)
  if (normalized.startsWith(symbol)) {
    normalized = normalized.slice(symbol.length)
  }

  // Remove thousands sep, swap decimal sep with dot
  normalized = normalized
    .replace(new RegExp('\\' + thousandsSep, 'g'), '')
    .replace(new RegExp('\\' + decimalSep, 'g'), '.')

  const num = parseFloat(normalized)
  return isNaN(num) ? null : Math.round(num * 100) / 100
}

/**
 * Raw digit string → formatted with symbol prefix.
 * e.g. digits "123456" (BRL) → "R$ 1.234,56"
 */
function formatDigitsAsCents(digits) {
  const { thousandsSep, decimalSep, decimalPlaces, symbol } = cfg.value

  const padded = digits.padStart(decimalPlaces + 1, '0')
  const intDigits = padded.slice(0, padded.length - decimalPlaces)
  const decDigits = padded.slice(padded.length - decimalPlaces)
  const intFormatted = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep)

  return `${symbol}${intFormatted}${decimalSep}${decDigits}`
}

// ─── Event Handlers ───────────────────────────────────────────────────────

function onFocus() {
  focused.value = true
  emit('focus')
}

function onBlur() {
  focused.value = false
  const floatVal = parseDisplay(displayValue.value)
  displayValue.value = formatFloat(floatVal)
  emitValue(floatVal)
}

function onKeydown(e) {
  // Allow navigation/control keys
  const allowed = [
    'Backspace',
    'Delete',
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]
  if (allowed.includes(e.key)) return

  // Allow digits only
  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
  }
}

function onInput(val) {
  const { symbol } = cfg.value

  // Strip symbol prefix before extracting digits
  let raw = String(val ?? '')
  if (raw.startsWith(symbol)) raw = raw.slice(symbol.length)

  // Extract only digits
  const digits = raw.replace(/\D/g, '')

  if (!digits || /^0+$/.test(digits)) {
    displayValue.value = formatDigitsAsCents('')
    emitValue(null)
    return
  }

  const trimmed = digits.replace(/^0+/, '') || '0'
  displayValue.value = formatDigitsAsCents(trimmed)

  const floatVal = parseFloat(trimmed) / Math.pow(10, cfg.value.decimalPlaces)
  emitValue(Math.round(floatVal * 100) / 100)
}

function emitValue(floatVal) {
  emit('update:modelValue', floatVal)
}
</script>
