<template>
  <InputField :disable="disable" :Mask="mask" v-model="value" :Label="Label" :dense="dense" :Error="error || Error"
    :ErrorMsg="errormsg" :readonly="readonly" :clearable="clearable" @focus="() => $emit('focus')"
    Icon="fas fa-calendar-alt" />
</template>

<script>
export default {
  name: 'ui-formparts-inputdate',

  props: {
    modelValue: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    disable: { type: Boolean, default: false },
    dense: { type: Boolean, default: false },
    clearable: { type: Boolean, default: true },
    withTime: { type: Boolean, default: false },
    withSeconds: { type: Boolean, default: false },
    BrazilianFormat: { type: Boolean, default: true },
    Default: { type: String, default: null },
    Label: { type: String, default: 'Digite a Data' },
    Error: { type: Boolean, default: false },
  },

  data() {
    return {
      value: null,
      mask: `${this.withTime ? `##/##/#### ##:##${this.withSeconds ? ':##' : ''}` : '##/##/####'}`,
      state: 'pending',
      error: false,
      errormsg: '',
    }
  },

  watch: {
    modelValue(val) {
      if (val && val.length >= 10) {
        let date = val.split(' ')[0];
        let time = val.split(' ')[1] ?? null;

        // If typing mode is enabled, we set the modelValue to the current date, but reverting from 'yyyy-mm-dd' to 'dd/mm/yyyy':
        let dateParts = date.split('-');
        this.value = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

        if (this.withTime) {
          this.value += ` ${time ?? '00:00:00'}`;
        }
      } else {
        // Reset the typing mode options when closed
        this.value = null;
      }
    },

    value(val) {
      this.state = 'pending';
      let emitValue = null;

      if (val && val.length >= 10) {
        const [datePart, timePart] = val.split(' ');
        const [day, month, year] = datePart.split('/').map(Number);

        if (!(day > 0 && day <= 31 && month > 0 && month <= 12 && year > 0)) {
          this.error = true;
          this.errormsg = 'Data inválida';
          this.state = 'error';
          return;
        }

        if (!!timePart) {
          const timeParts = timePart.split(':');
          if (timeParts.length < 2 || timeParts.length > 3) {
            this.error = true;
            this.errormsg = 'Hora inválida';
            this.state = 'error';
            return;
          }
          const [hours, minutes, seconds] = timeParts.map(Number);
          if (!(hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60 && (seconds === undefined || (seconds >= 0 && seconds < 60)))) {
            this.error = true;
            this.errormsg = 'Hora inválida';
            this.state = 'error';
            return;
          }
        }

        this.error = false;
        this.errormsg = '';
        this.state = 'success';

        emitValue = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        if (this.withTime) emitValue += ` ${timePart ?? '00:00:00'}`;

      } else this.clear();

      this.$emit('update:modelValue', { value: emitValue, state: this.state });
    }
  },

  methods: {
    clear() {
      this.value = this.Default || null;
    }
  },

  mounted() {
    if (this.Default) {
      this.value = this.Default;
    }
  }
}
</script>