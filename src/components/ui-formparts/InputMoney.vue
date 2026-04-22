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
};

export default {
  name: 'ui-formparts-input-money',

  props: {
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
  },

  data() {
    return {
      displayValue: '',
      focused: false,
    };
  },

  computed: {
    cfg() {
      return CURRENCIES[this.Currency] ?? CURRENCIES.BRL;
    },
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(val) {
        if (!this.focused) {
          this.displayValue = this.formatFloat(val);
        }
      },
    },

    Currency() {
      const floatVal = this.parseDisplay(this.displayValue);
      this.displayValue = this.formatFloat(floatVal);
    },
  },

  methods: {
    // ─── Formatting ───────────────────────────────────────────────────────────

    /**
     * Float → "R$ 1.234,56" / "$ 1,234.56"
     */
    formatFloat(val) {
      if (val === null || val === undefined || val === '') return this.cfg.symbol + this.formatDigitsAsCents('0');

      const num = parseFloat(val);
      if (isNaN(num)) return this.cfg.symbol + this.formatDigitsAsCents('0');

      const { thousandsSep, decimalSep, decimalPlaces, symbol } = this.cfg;
      const fixed = Math.abs(num).toFixed(decimalPlaces);
      const [intPart, decPart] = fixed.split('.');
      const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);

      return `${symbol}${num < 0 ? '-' : ''}${intFormatted}${decimalSep}${decPart}`;
    },

    /**
     * "R$ 1.234,56" → 1234.56
     * Strips the symbol prefix, then normalizes separators.
     */
    parseDisplay(str) {
      if (!str && str !== 0) return null;

      const { thousandsSep, decimalSep, symbol } = this.cfg;

      // Remove symbol prefix (handles "R$ ", "$ ")
      let normalized = String(str);
      if (normalized.startsWith(symbol)) {
        normalized = normalized.slice(symbol.length);
      }

      // Remove thousands sep, swap decimal sep with dot
      normalized = normalized
        .replace(new RegExp('\\' + thousandsSep, 'g'), '')
        .replace(new RegExp('\\' + decimalSep, 'g'), '.');

      const num = parseFloat(normalized);
      return isNaN(num) ? null : Math.round(num * 100) / 100;
    },

    /**
     * Raw digit string → formatted with symbol prefix.
     * e.g. digits "123456" (BRL) → "R$ 1.234,56"
     */
    formatDigitsAsCents(digits) {
      const { thousandsSep, decimalSep, decimalPlaces, symbol } = this.cfg;

      const padded = digits.padStart(decimalPlaces + 1, '0');
      const intDigits = padded.slice(0, padded.length - decimalPlaces);
      const decDigits = padded.slice(padded.length - decimalPlaces);
      const intFormatted = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);

      return `${symbol}${intFormatted}${decimalSep}${decDigits}`;
    },

    // ─── Event Handlers ───────────────────────────────────────────────────────

    onFocus() {
      this.focused = true;
      this.$emit('focus');
    },

    onBlur() {
      this.focused = false;
      const floatVal = this.parseDisplay(this.displayValue);
      this.displayValue = this.formatFloat(floatVal);
      this.emitValue(floatVal);
    },

    onKeydown(e) {
      // Allow navigation/control keys
      const allowed = [
        'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
        'ArrowUp', 'ArrowDown', 'Home', 'End',
      ];
      if (allowed.includes(e.key)) return;

      // Allow digits only
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    },

    onInput(val) {
      const { symbol } = this.cfg;

      // Strip symbol prefix before extracting digits
      let raw = String(val ?? '');
      if (raw.startsWith(symbol)) raw = raw.slice(symbol.length);

      // Extract only digits
      const digits = raw.replace(/\D/g, '');

      if (!digits || /^0+$/.test(digits)) {
        this.displayValue = this.formatDigitsAsCents('');
        this.emitValue(null);
        return;
      }

      const trimmed = digits.replace(/^0+/, '') || '0';
      this.displayValue = this.formatDigitsAsCents(trimmed);

      const floatVal = parseFloat(trimmed) / Math.pow(10, this.cfg.decimalPlaces);
      this.emitValue(Math.round(floatVal * 100) / 100);
    },

    emitValue(floatVal) {
      this.$emit('update:modelValue', floatVal);
    },
  },

  mounted() {
    this.displayValue = this.formatFloat(this.modelValue);
  },
};
</script>
