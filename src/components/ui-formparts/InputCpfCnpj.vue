<template>
  <InputField ignorePadding :disable="disable" :Mask="mask" v-model="value" :Label="Label" :dense="dense" :Error="Error"
    :readonly="readonly" :clearable="clearable" @focus="() => $emit('focus')" :Icon="Icon ?? 'fas fa-id-card'"
    maxlength="18" />
</template>

<script>
export default {
  name: 'ui-formparts-input-cpf-cnpj',

  props: {
    Icon: String,
    modelValue: String,
    readonly: Boolean,
    disable: Boolean,
    dense: Boolean,
    clearable: Boolean,
    Default: String,
    Label: String,
    Error: Boolean,
    CpfOnly: Boolean,
    CnpjOnly: Boolean,
  },

  data() {
    return {
      value: null,
    }
  },

  computed: {
    mask() {
      if (!this.value) return '';
      if (!!this.CpfOnly) return '###.###.###-##';
      if (!!this.CnpjOnly) return '##.###.###/####-##';

      const onlyDigits = this.value.replace(/\D+/g, '');
      if (onlyDigits.length <= 11 || !!this.CpjOnly)
        return '###.###.###-##';

      return '##.###.###/####-##'
    }
  },

  watch: {
    modelValue(val) {
      this.value = val ?? null;
    },

    value(val) {
      if (!val) return this.clear();
      else if (val.length < 14) return;

      this.emit();
    }
  },

  methods: {
    clear() {
      this.value = this.Default || null;
      this.emit();
    },

    emit() {
      this.$emit('update:modelValue', this.value);
    }
  },

  mounted() {
    if (this.Default) {
      this.value = this.Default;
    }
  }
}
</script>