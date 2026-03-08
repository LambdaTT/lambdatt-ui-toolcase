<template>
  <q-select filled square hide-bottom-space hide-dropdown-icon use-input fill-input
    behavior="menu" :bg-color="`bg-${BgColor ? BgColor : 'white'}`" option-disable="inactive" input-debounce="300"
    :clearable="clearable" :dense="dense" :disable="disable" :label="Label" :readonly="readonly" :hide-selected="!Multiple"
    :options="options" :error="Error" :multiple="Multiple" :use-chips="UseChips" :stack-label="StackLabel"
    v-model="selected"
    @filter="filterFn" @focus="$emit('focus')" @popup-show="isOpen = true" @popup-hide="isOpen = false"
  >
    <template v-slot:append>
      <q-icon v-if="!readonly" :class="isOpen ? 'rotate-180' : ''" name="arrow_drop_down" color="grey-8"
        style="transition: transform 0.28s" />
      <q-icon v-if="!!Icon" :name="Icon" color="grey-8" />
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey">Nenhum resultado</q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script>
export default {
  name: 'ui-formparts-select2',

  props: {
    modelValue: {
      type: [String, Number, Array, Object],
      default: null
    },
    Options: {
      type: Array,
      default: () => []
    },

    BgColor: String,
    Label: String,
    Icon: String,
    Error: Boolean,

    readonly: Boolean,
    disable: Boolean,
    dense: Boolean,
    clearable: Boolean,

    Multiple: Boolean,
    UseChips: Boolean,
    StackLabel: Boolean,

    Default: [String, Object, Number],
  },

  data() {
    return {
      filteredOptions: this.Options,
      selected: null,
      isOpen: false,
      internalUpdate: false,
    }
  },

  watch: {
    selected(v) {
      v = v ?? this.Default ?? null;
      this.emitValue(v)
    },

    modelValue(v) {
      if (this.internalUpdate) {
        this.internalUpdate = false
        return
      }

      this.setValue(v);
    },

    Options(v) {
      this.filteredOptions = [...v].sort(
        (a, b) => String(a.label).localeCompare(String(b.label), 'pt-BR', { sensitivity: 'base' })
      );
      this.setValue(this.modelValue)
    }
  },

  computed: {
    options() {
      return this.filteredOptions
    }
  },

  methods: {
    setValue(v) {
      const source = this.Options
      if (!source?.length) return

      if (!v) {
        this.selected = this.Multiple ? [] : null
        return
      }

      this.selected = this.Multiple
        ? source.filter(opt => (Array.isArray(v) ? v : []).includes(opt.value))
        : source.find(opt =>
            String(opt.value).toLowerCase() === String(v).toLowerCase()
          ) || null
    },

    filterFn(val, update) {
      update(() => {
        if (!(val)) {
          this.filteredOptions = this.Options;
          return
        }

        const needle = val.toLowerCase()
        this.filteredOptions = this.Options.filter(opt =>
          String(opt.label).toLowerCase().includes(needle)
        )
      })
    },

    emitValue(v) {
      if (this.Multiple) {
        this.internalUpdate = true
        this.$emit('update:model-value', Array.isArray(v) ? [...v] : [])
        return
      }

      if (v instanceof Object && "value" in v) v = v.value;

      const payload = v ? v : null
      if (payload === this.modelValue) return

      this.internalUpdate = true
      this.$emit('update:model-value', payload)
    }
  },

  mounted() {
    setTimeout(() => {
      if (this.Default) {
        this.selected = this.Default;
      }
    }, 200);
  }
}
</script>
