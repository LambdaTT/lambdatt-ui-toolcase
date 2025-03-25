<template>
  <div id="wrapper" class="text-center q-pa-sm">
    <div :class="`photo-container ${square ? 'square' : ''}`">
      <q-img :src="input.src ? input.src : DefaultImgPath" />
    </div>
    <FileUpload @activateFn="(fn) => activateFileInput = fn" class="hidden" v-model="input" :ReadAsURL="true"
      @update:model-value="updModelValue">
    </FileUpload>
    <q-btn class="bg-white" id="btn-edit" color="primary" flat round :disable="disable" icon="fas fa-edit"
      @click="activateFileInput()" size="md">
      <q-tooltip v-if="!disable">Alterar imagem</q-tooltip>
    </q-btn>
  </div>
</template>

<script>
export default {
  name: 'ui-formparts-photopicker',

  props: {
    DefaultImgPath: String,
    modelValue: Object,
    disable: Boolean,
    square: Boolean,
  },

  data() {
    return {
      activateFileInput: null,
      input: {
        file: null,
        name: null,
        src: null,
        size: null,
      }
    }
  },

  watch: {
    modelValue: {
      handler(v) {
        for (let k in this.input) {
          this.input[k] = v[k];
        }
      },
      deep: true
    }
  },

  methods: {
    updModelValue(v) {
      this.$emit('update:model-value', v);
    },
  }

}
</script>

<style scoped>
#wrapper {
  position: relative;
  width: 40%;
}

.photo-container {
  width: 100%;
  border-radius: 50%;
  overflow: hidden;
}

.photo-container>img {
  width: 100%;
}

#btn-edit {
  position: absolute;
  right: 0px;
  bottom: 0px;
}

.square {
  border-radius: 0%;
}
</style>