<template>
  <div class="row">
    <div class="col-12 q-pa-xs" v-if="showTitle">
      <div class="q-pa-xs">
        <h1>Informações de Endereço</h1>
      </div>
    </div>
    <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-6'}`">
      <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="CEP" Icon="fas fa-search"
        v-model="input.ds_addresszipcode" :Error="inputError.ds_addresszipcode"
        @focus="inputError.ds_addresszipcode = false" Mask="#####-###" @update:model-value="getAddressByZipcode()">
      </InputField>
    </div>
    <div v-if="!wrapFields" class="col-12 col-md-6">
      &nbsp;
    </div>
    <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-6'}`">
      <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="Endereço"
        Icon="fas fa-map-marker-alt" v-model="input.ds_addressstreet" :Error="inputError.ds_addressstreet"
        @focus="inputError.ds_addressstreet = false"></InputField>
    </div>
    <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-2'}`">
      <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="Número"
        Icon="fas fa-map-marker-alt" v-model="input.ds_addressnumber" :Error="inputError.ds_addressnumber"
        @focus="inputError.ds_addressnumber = false"></InputField>
    </div>
    <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-4'}`">
      <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="Complemento"
        Icon="fas fa-map-marker-alt" v-model="input.ds_addresscomplement"></InputField>
    </div>
    <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-6'}`">
      <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="Bairro"
        Icon="fas fa-map-marker-alt" v-model="input.ds_addressneighborhood" :Error="inputError.ds_addressneighborhood"
        @focus="inputError.ds_addressneighborhood = false"></InputField>
    </div>
    <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-4'}`">
      <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="Cidade" Icon="fas fa-city"
        v-model="input.ds_addresscity" :Error="inputError.ds_addresscity" @focus="inputError.ds_addresscity = false">
      </InputField>
    </div>
    <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-2'}`">
      <InputField type="select" clearable :dense="dense" :readonly="formReadonly" Label="UF"
        Icon="fas fa-map-marker-alt" v-model="input.do_addressuf" :Options="brazilianStates"
        :Error="inputError.do_addressuf" @focus="inputError.do_addressuf = false"></InputField>
    </div>
    <div class="col-12" v-if="!hideMap">
      <q-separator></q-separator>
      <div class="row">
        <div :class="`col-12 q-pa-${dense ? 'xs' : 'sm'}`">
          <Map :AddressObj="input"></Map>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'components-common-addressinfo',

  props: {
    dense: Boolean,
    hideMap: Boolean,
    readonly: Boolean,
    showTitle: Boolean,
    wrapFields: Boolean,
    modelValue: {
      type: Object,
    },
  },

  data() {
    return {
      input: {
        ds_addresszipcode: null,
        ds_addressstreet: null,
        ds_addressnumber: null,
        ds_addresscomplement: null,
        ds_addressneighborhood: null,
        ds_addresscity: null,
        do_addressuf: null,
      },
      inputError: {
        ds_addresszipcode: false,
        ds_addressstreet: false,
        ds_addressnumber: false,
        ds_addressneighborhood: false,
        ds_addresscity: false,
        do_addressuf: false,
      },
      formReadonly: !!this.readonly,
    }
  },

  computed: {
    brazilianStates() {
      return this.$utils.brazilianStates();
    },

    factory() {
      return {
        validate: this.validateFields,
        read: (data) => {
          for (let k in this.input)
            if (k in data)
              this.input[k] = data[k];
        },
        input: {
          ...this.input
        }
      }
    }
  },

  methods: {
    validateFields() {
      if (!this.$utils.validateForm(this.input, this.inputError)) return false;
      return true;
    },

    updModel() {
      this.$emit("update:model-value", this.factory);
    },

    async getAddressByZipcode() {
      var address = await this.$utils.getAddressByZipCode(this.input.ds_addresszipcode);
      if (address === null) return;
      if (address === false) {
        this.inputError.ds_addresszipcode = true;
        return;
      }
      // Updating Values
      this.input.ds_addressstreet = address.logradouro;
      this.input.ds_addressneighborhood = address.bairro;
      this.input.ds_addresscity = address.localidade;
      this.input.do_addressuf = address.uf;
      // Updating Errors
      this.inputError.ds_addressstreet = false;
      this.inputError.ds_addressneighborhood = false;
      this.inputError.ds_addresscity = false;
      this.inputError.do_addressuf = false;
    },
  },

  watch: {
    input: {
      handler() {
        this.updModel();
      },
      deep: true,
    },

    modelValue: {
      handler(newValue) {
        for (let k in this.input) {
          if (k in newValue) {
            this.input[k] = newValue[k];
          }
        }
      },
      deep: true,
    },
  },

  mounted() {
    this.updModel();
  }
}
</script>

<style scoped>
h1 {
  font-size: 1.5rem;
  line-height: 15px;
}
</style>