<template>
  <div>
    <label>{{ Label }}</label>
    <div>
        <q-btn v-for="(option, index) in Options"
        :key="index"
        :disable="readonly"
        :label="option.label"
        :outline="!values.includes(option.value)"
        color="primary"
        @click="toggleValue(option.value)">
        <q-tooltip>{{ option.tooltip }}</q-tooltip>
        </q-btn>
    </div>
  </div>
</template>

<script>

  export default{
    name: 'ui-formparts-btnselector',
    props: {
      Label: String,
      Options: Array,
      modelValue: Array,
      readonly: Boolean,
    },
    data(){
      return{
        values: []
      }
    },
    watch: {
      values: {
        handler(){
          this.$emit("update:model-value", this.values)
        },
        deep: true
      },
      modelValue: {
        handler(){
          this.values = this.modelValue
        },
        deep: true
      }
    },
    methods: {
      toggleValue(value){
          if(this.values.includes(value)){
          this.values.splice(this.values.indexOf(value), 1)
        }else{
          this.values.push(value)
        }
      }
    }
  }
</script>
