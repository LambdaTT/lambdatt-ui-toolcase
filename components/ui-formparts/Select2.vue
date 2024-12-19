<template>
  <q-select hide-bottom-space :bg-color="`bg-${BgColor ? BgColor : 'white'}`" option-disable="inactive"
    :disable="disable" :hide-dropdown-icon="readonly" :dense="dense" filled square :clearable="clearable"
    v-model="selected" use-input hide-selected fill-input input-debounce="300" :options="options" @filter="filterFn"
    :label="Label" :error="Error" @focus="$emit('focus')" :readonly="readonly">
    <template v-if="!!Icon" v-slot:append>
      <q-icon :name="Icon" color="grey-8" />
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey">
          Nenhum resultado
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script>
export default {
  name: 'ui-formparts-select2',

  props: {
    BgColor: String,
    Options: Array,
    Label: String,
    Icon: String,
    Error: Boolean,
    readonly: Boolean,
    disable: Boolean,
    dense: Boolean,
    modelValue: {
      types: ['string', 'object', 'number']
    },
    clearable: Boolean
  },

  data() {
    return {
      options: [],
      selected: null,
    }
  },

  watch: {
    selected() {
      var selectedValue = !!this.selected ? this.selected.value : null;

      this.$emit('update:model-value', selectedValue);
    },

    modelValue(v) {
      this.setValue()
    },

    Options: {
      handler(v) {
        this.options = v;
      },

      deep: true
    }
  },

  methods: {
    setValue() {
      if (this.Options?.length) {
        if (this.modelValue === null || typeof this.modelValue == 'undefined' || this.modelValue === '') {
          this.selected = null;
        }
        else {
          this.selected = this.Options.filter((v) => {
            v.value = (typeof v.value == "number") ? String(v.value) : v.value; // Number to String
            return JSON.stringify(v.value).toLocaleLowerCase() == JSON.stringify(this.modelValue).toLocaleLowerCase();
          })[0];
        }
      } else {
        setTimeout(this.setValue, 100);
      }
    },

    filterFn(val, update) {
      if (!!val == false || val === '') {
        update(() => {
          this.options = this.Options;
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.options = this.Options.filter(v => v.label.toLowerCase().includes(needle));
      })
    },
  },

  mounted() {
    this.options = this.Options;
    this.setValue()
  }
}
</script>