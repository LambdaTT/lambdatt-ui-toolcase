<template>
  <q-card :flat="!card">
    <div v-if="showTitle">
      <div v-if="!card" class="q-pa-sm" style="font-size: 20px;">Informações de Endereço</div>
      <div v-else class="bg-grey-9 q-pa-md text-bold text-white q-pl-lg card-title">Endereço</div>
    </div>
    <div class="row" :class="!card ? '' : 'q-pa-md'">
      <div class="col-12 row">
        <div :class="`col-12 ${wrapFields == true ? '' : 'col-md-6'}`">
          <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="CEP*" Icon="fas fa-search"
            v-model="input.ds_zipcode" :Error="inputError.ds_zipcode"
            @focus="inputError.ds_zipcode = false" Mask="#####-###" @update:model-value="getAddressByZipcode()">
          </InputField>
          <span class="q-ml-sm text-amber-9 text-caption text-bold" v-if="!!zipcodeWarning">{{ zipcodeWarning }}</span>
        </div>
      </div>
      <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-6'}`">
        <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="Endereço*"
          Icon="fas fa-map-marker-alt" v-model="input.ds_street" :Error="inputError.ds_street"
          @focus="inputError.ds_street = false"></InputField>
      </div>
      <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-2'}`">
        <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="Número*"
          Icon="fas fa-map-marker-alt" v-model="input.ds_number" :Error="inputError.ds_number"
          @focus="inputError.ds_number = false"></InputField>
      </div>
      <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-4'}`">
        <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="Complemento"
          Icon="fas fa-map-marker-alt" v-model="input.ds_complement"></InputField>
      </div>
      <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-6'}`">
        <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="Bairro*"
          Icon="fas fa-map-marker-alt" v-model="input.ds_neighborhood" :Error="inputError.ds_neighborhood"
          @focus="inputError.ds_neighborhood = false"></InputField>
      </div>
      <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-4'}`">
        <InputField type="text" clearable :dense="dense" :readonly="formReadonly" Label="Cidade*" Icon="fas fa-building"
          v-model="input.ds_city" :Error="inputError.ds_city" @focus="inputError.ds_city = false">
        </InputField>
      </div>
      <div :class="`col-12 ${wrapFields === true ? '' : 'col-md-2'}`">
        <InputField type="select" clearable :dense="dense" :readonly="formReadonly" Label="UF*"
          Icon="fas fa-map-marker-alt" v-model="input.do_state" :Options="brazilianStates"
          :Error="inputError.do_state" @focus="inputError.do_state = false"></InputField>
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
  </q-card>
</template>

<script>
export default {
  name: 'components-common-addressinfo',

  props: {
    card: Boolean,
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
        ds_zipcode: null,
        ds_street: null,
        ds_number: null,
        ds_complement: null,
        ds_neighborhood: null,
        ds_city: null,
        do_state: null,
      },
      inputError: {
        ds_zipcode: false,
        ds_street: false,
        ds_number: false,
        ds_neighborhood: false,
        ds_city: false,
        do_state: false,
      },
      formReadonly: !!this.readonly,
      zipcodeWarning: null
    }
  },

  computed: {
    brazilianStates() {
      return this.$getService('toolcase/utils').brazilianStates();
    },

    factory() {
      return {
        validate: this.validateFields,
        read: (data) => {
          setTimeout(() => {
            for (let k in this.input)
              if (!!data && k in data)
                this.input[k] = data[k];
          }, 100)
        },
        getInput: () => this.input
      }
    }
  },

  methods: {
    validateFields() {
      if (!this.$getService('toolcase/utils').validateForm(this.input, this.inputError)) return false;
      return true;
    },

    updModel() {
      this.$emit("update:model-value", this.factory);
    },

    async getAddressByZipcode() {
      var address = await this.$getService('toolcase/utils').getAddressByZipCode(this.input.ds_zipcode, false);
      if (address === null) return;
      if (address === false) {
        this.zipcodeWarning = 'CEP não encontrado. Preencha o endereço manualmente.'
        return;
      }
      this.zipcodeWarning = null
      // Updating Values
      this.input.ds_street = address.logradouro;
      this.input.ds_neighborhood = address.bairro;
      this.input.ds_city = address.localidade;
      this.input.do_state = address.uf;
      // Updating Errors
      this.inputError.ds_street = false;
      this.inputError.ds_neighborhood = false;
      this.inputError.ds_city = false;
      this.inputError.do_state = false;
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
          if (!!newValue && k in newValue) {
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
.card-title {
  font-size: 16px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}
</style>