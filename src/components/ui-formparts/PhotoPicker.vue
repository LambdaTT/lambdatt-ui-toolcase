<template>
  <div id="wrapper" :class="`q-pa-sm ${setAlign}`">
    <q-card v-if="cover" class="q-pa-sm">
      <div
        v-if="!setSrc"
        class="empty-state-cover column flex-center"
        :style="{ height: coverHeight || '200px', width: coverWidth || '100%' }"
      >
        <q-icon
          name="fas fa-image"
          size="xl"
          class="q-mb-sm text-blue-grey-4"
        />
        <span class="text-subtitle2 text-blue-grey-7" style="font-weight: 600"
          >Nenhuma Imagem Selecionada</span
        >
      </div>
      <q-img
        v-else
        class="bg-grey-3"
        :src="setSrc"
        :ratio="setRatio"
        :fit="setFit"
        :height="coverHeight"
        :width="coverWidth"
      />

      <FileUpload
        class="hidden"
        v-model="input"
        :ReadAsURL="true"
        :accept="accept ? accept : 'image/*'"
        @activateFn="(fn) => (activateFileInput = fn)"
        @update:model-value="updModelValue"
      >
      </FileUpload>

      <q-btn
        flat
        round
        class="bg-white"
        id="btn-edit"
        color="primary"
        :disable="disable"
        icon="fas fa-edit"
        @click="activateFileInput()"
        :size="setIconSize"
      >
        <q-tooltip v-if="!disable">Alterar imagem</q-tooltip>
      </q-btn>
    </q-card>

    <q-avatar v-else :square="square" :size="setSize">
      <div v-if="!setSrc" class="empty-state-avatar column flex-center">
        <q-icon
          name="fas fa-image"
          :size="!size || parseInt(size) >= 100 ? '32px' : '20px'"
          class="text-blue-grey-4"
        />
        <span
          v-if="!size || parseInt(size) >= 100"
          class="text-caption text-center q-mt-xs text-blue-grey-7"
          style="line-height: 1.2; font-weight: 600; font-size: 13px"
        >
          Selecionar<br />Imagem
        </span>
      </div>
      <q-img v-else :src="setSrc" :ratio="setRatio" :fit="setFit" />

      <FileUpload
        class="hidden"
        v-model="input"
        :ReadAsURL="true"
        :accept="accept ? accept : 'image/*'"
        @activateFn="(fn) => (activateFileInput = fn)"
        @update:model-value="updModelValue"
      >
      </FileUpload>

      <q-btn
        flat
        round
        id="btn-edit"
        class="bg-white"
        color="primary"
        icon="fas fa-edit"
        :disable="disable"
        :size="setIconSize"
        @click="activateFileInput()"
      >
        <q-tooltip v-if="!disable">Alterar imagem</q-tooltip>
      </q-btn>
    </q-avatar>
  </div>
</template>

<script>
export default {
  name: "ui-formparts-photopicker",

  props: {
    DefaultImgPath: String,
    modelValue: Object,
    disable: Boolean,
    square: Boolean,
    size: String,
    cover: Boolean,
    coverHeight: String,
    coverWidth: String,
    align: String,
    fit: String,
    accept: {
      type: String,
      validator: (val) =>
        val === "image/*" ||
        val === "image/png" ||
        val === "image/jpeg" ||
        val === "image/jpg",
    },
  },

  data() {
    return {
      activateFileInput: null,
      input: {
        file: null,
        name: null,
        src: null,
        size: null,
      },
    };
  },

  watch: {
    modelValue: {
      handler(v) {
        if (!v) return;
        for (let k in this.input) {
          if (v[k] !== undefined && this.input[k] !== v[k]) {
            this.input[k] = v[k];
          }
        }
      },
      deep: true,
      immediate: true,
    },
  },

  computed: {
    setSrc() {
      return this.input.src ? this.input.src : this.DefaultImgPath;
    },

    setSize() {
      if (!!this.size) {
        return this.size + "px";
      }
      return "150px";
    },

    setIconSize() {
      if (!!this.size) {
        if (this.size <= 70) return this.size / 7 + "px";
        if (this.size <= 100) return "sm";
        if (this.size <= 300) return "md";
        return "lg";
      }
      return "md";
    },

    setAlign() {
      if (!!this.align) {
        switch (this.align) {
          case "left":
            return "text-left";
          case "right":
            return "text-right";
          default:
            return "text-center";
        }
      }
      return "text-center";
    },

    setRatio() {
      return this.cover ? 16 / 9 : 1;
    },

    setFit() {
      return this.fit ? this.fit : "cover";
    },
  },

  methods: {
    updModelValue(v) {
      this.$emit("update:model-value", v);
    },
  },
};
</script>

<style scoped>
#wrapper {
  position: relative;
  width: 100%;
}

.photo-container {
  width: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0px 0px 2px;
}

.photo-container > img {
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

.empty-state-avatar {
  width: 100%;
  height: 100%;
  border: 2px dashed #cfd8dc;
  border-radius: inherit;
  background-color: #f4f6f8;
  box-sizing: border-box;
}

.empty-state-cover {
  border: 2px dashed #cfd8dc;
  border-radius: 6px;
  background-color: #f4f6f8;
  box-sizing: border-box;
}
</style>
