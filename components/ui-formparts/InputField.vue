<template>
  <div :class="dense ? 'q-pa-xs' : 'q-pa-sm'">
    <!-- Input text: -->
    <q-input ref="InputFieldRef" hide-bottom-space v-if="type == 'text' || type == null"
      :class="`full-width bg-${BgColor ? BgColor : 'white'}`" square filled :dense="dense" :clearable="clearable"
      :readonly="readonly" :disable="disable" v-model="value" :error="Error" @focus="() => $emit('focus')" type="text"
      :maxlength="maxlength" :label="Label" :mask="Mask" @update:model-value="updModelValue">
      <template v-slot:append>
        <slot name="buttons"></slot>
        <q-icon v-if="!!Icon" :name="Icon" color="grey-8" />
      </template>
    </q-input>

    <!-- Input password: -->
    <q-input ref="InputFieldRef" hide-bottom-space v-if="type == 'password'" :class="`full-width bg-${BgColor ? BgColor : 'white'}`" square
      filled :dense="dense" :clearable="clearable" :readonly="readonly" :disable="disable" v-model="value" :error="Error"
      @focus="() => $emit('focus')" type="password" :maxlength="maxlength" :label="Label"
      @update:model-value="updModelValue">
      <template v-slot:append>
        <slot name="buttons"></slot>
        <q-icon v-if="!!Icon" :name="Icon" color="grey-8" />
      </template>
    </q-input>

    <!-- Input textarea: -->
    <q-input ref="InputFieldRef" hide-bottom-space v-if="type == 'textarea'" :class="`full-width bg-${BgColor ? BgColor : 'white'}`" square
      filled :dense="dense" :clearable="clearable" :readonly="readonly" :disable="disable" v-model="value" :error="Error"
      @focus="() => $emit('focus')" type="textarea" :maxlength="maxlength" :label="Label"
      @update:model-value="updModelValue">
      <template v-slot:append>
        <slot name="buttons"></slot>
        <q-icon v-if="!!Icon" :name="Icon" color="grey-8" />
      </template>
    </q-input>

    <!-- Input email: -->
    <q-input ref="InputFieldRef" hide-bottom-space v-if="type == 'email'" :class="`full-width bg-${BgColor ? BgColor : 'white'}`" square
      filled :dense="dense" :clearable="clearable" :readonly="readonly" :disable="disable" v-model="value" :error="Error"
      @focus="() => $emit('focus')" type="email" maxlength="255" :label="Label" @update:model-value="updModelValue">
      <template v-slot:append>
        <slot name="buttons"></slot>
        <q-icon v-if="!!Icon" :name="Icon" color="grey-8" />
      </template>
    </q-input>

    <!-- Input number: -->
    <q-input ref="InputFieldRef" hide-bottom-space v-if="type == 'number'" :class="`full-width bg-${BgColor ? BgColor : 'white'}`" square
      filled :dense="dense" :clearable="clearable" :readonly="readonly" :disable="disable" v-model="value" :error="Error"
      @focus="() => $emit('focus')" type="number" :step="step" :max="max" :min="min" :label="Label"
      @update:model-value="updModelValue">
      <template v-slot:append>
        <slot name="buttons"></slot>
        <q-icon v-if="!!Icon" :name="Icon" color="grey-8" />
      </template>
    </q-input>

    <!-- Input select: -->
    <Select2 :BgColor="BgColor" v-if="type == 'select'" :clearable="clearable" :dense="dense" :disable="disable" :readonly="readonly" v-model="value"
      :Options="Options" :Label="Label" :Icon="Icon" :Error="Error" @focus="() => $emit('focus')"
      @update:model-value="updModelValue">
    </Select2>

    <!-- Input date: -->
    <InputDate :BgColor="BgColor" v-if="type == 'date'" :dense="dense" :disable="disable" :readonly="readonly" v-model="value"
      :Default="Default" :Label="Label" :Error="Error" @focus="() => $emit('focus')"
      @update:model-value="updModelValue">
    </InputDate>

    <!-- Input daterange: -->
    <InputDate :BgColor="BgColor" v-if="type == 'daterange'" :dense="dense" :disable="disable" :readonly="readonly" v-model="value" range
      :Default="Default" :Label="Label" :Error="Error" @focus="() => $emit('focus')"
      @update:model-value="updModelValue">
    </InputDate>

    <!-- Input datetime: -->
    <InputDate :BgColor="BgColor" v-if="type == 'datetime'" :dense="dense" :disable="disable" :readonly="readonly" v-model="value" withTime
      :Default="Default" :Label="Label" :Error="Error" @focus="() => $emit('focus')"
      @update:model-value="updModelValue">
    </InputDate>

    <!-- Input datetimerange: -->
    <InputDate :BgColor="BgColor" v-if="type == 'datetimerange'" :dense="dense" :disable="disable" :readonly="readonly" v-model="value" range withTime
      :Default="Default" :Label="Label" :Error="Error" @focus="() => $emit('focus')"
      @update:model-value="updModelValue">
    </InputDate>

    <!-- Input time: -->
    <InputTime :BgColor="BgColor" v-if="type == 'time'" :dense="dense" :disable="disable" :readonly="readonly" v-model="value"
      :Default="Default" :Label="Label" :Error="Error" @update:model-value="updModelValue" @focus="() => $emit('focus')">
    </InputTime>

    <!-- Input color: -->
    <InputColor :BgColor="BgColor" v-if="type == 'color'" :clearable="clearable" :dense="dense" :disable="disable" :readonly="readonly" v-model="value"
      :Default="Default" :Label="Label" :Error="Error" @focus="() => $emit('focus')" @update:model-value="updModelValue">
    </InputColor>

    <!-- Input file: -->
    <FileUpload v-if="type == 'file'" :accept="accept" :clearable="clearable" :readonly=readonly v-model="value"
      :ReadAsURL="ReadAsURL" :Label="Label" :Icon="Icon" :Error="Error" 
      @focus="() => $emit('focus')"
      @update:model-value="updModelValue"
      @fileupload-before-choose="broadcast('fileupload-before-choose')" 
      @fileupload-chosen="broadcast('fileupload-chosen')"   >
    </FileUpload>

    <!-- Input Editor -->
    <InputEditor v-if="type == 'editor'" :disable="disable" :readonly=readonly v-model="value"
      :Label="Label" :Error="Error" :placeholder="placeholder"
      @focus="() => $emit('focus')"
      @update:model-value="updModelValue" >
    </InputEditor>
  </div>

</template>

<script>
export default {
  name: 'ui-formparts-inputfield',

  props: {
    BgColor: String,
    type: String,
    readonly: Boolean,
    disable: Boolean,
    dense: Boolean,
    modelValue: [String, Object, Number],
    Icon: String,
    Label: String,
    Mask: String,
    clearable: Boolean,
    Options: Array,
    Error: Boolean,
    maxlength: String,
    step: String,
    max: String,
    min: String,
    Default: [String, Object, Number],
    accept: String,
    ReadAsURL: Boolean,
    placeholder: String,
  },

  data() {
    return {
      value: null
    }
  },

  watch: {
    modelValue(v) {
      this.value = v;
    }
  },

  methods: {
    updModelValue(v) {
      this.$emit('update:model-value', v);
    },

    broadcast(eventName, data) {
      this.$emit(eventName, data);
    }
  },

  created() {
    this.value = this.modelValue;
  },

  mounted() {
    this.$emit('expose-ref', this.$refs.InputFieldRef);
  }
}
</script>