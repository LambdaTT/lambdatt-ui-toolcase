<template>
  <InputField ignorePadding :disable="disable" :Mask="mask" v-model="value" :Label="Label" :dense="dense" :Error="Error"
    :readonly="readonly" :clearable="clearable" @focus="() => $emit('focus')" :Icon="Icon ?? 'fas fa-phone'"
    maxlength="15" />
</template>

<script>
export default {
  name: 'ui-formparts-inputphone',

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
  },

  data() {
    return {
      value: null,
    }
  },

  computed: {
    mask() {
      if (!this.value) return '';
      const onlyDigits = this.value.replace(/\D+/g, '');;

      if (onlyDigits.length <= 10) return '(##) ####-#####';

      return '(##) #####-####'
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