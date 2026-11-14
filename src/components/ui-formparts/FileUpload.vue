<template>
  <div>
    <q-input
      :disable="disable"
      :readonly="readonly"
      hide-bottom-space
      square
      filled
      :clearable="clearable"
      v-model="fileData.name"
      @click="inputClicked()"
      type="text"
      :label="!!Label ? Label : 'Selecione o arquivo'"
      @clear="clearFile"
      :hint="hint"
      :color="!!Color ? Color : 'primary'"
      @focus="$emit('focus')"
      :error="Error"
    >
      <template v-slot:prepend>
        <q-icon name="cloud_upload" />
      </template>
      <template v-slot:append>
        <q-icon v-if="!!Icon" :name="Icon" />
      </template>
    </q-input>
    <div v-show="fileData.size != null" class="text-caption text-right">
      {{ (fileData.size / 1024).toFixed(2) }}
      kb
    </div>
    <input
      :disabled="readonly"
      ref="inputEl"
      :accept="accept"
      type="file"
      v-on:change="fileChange"
      style="display: none"
    />
  </div>
</template>
<script setup>
import { ref, watch, onMounted, getCurrentInstance } from "vue";

defineOptions({ name: "ui-formparts-fileupload" });

const props = defineProps({
  clearable: Boolean,
  disable: Boolean,
  readonly: Boolean,
  accept: String,
  modelValue: Object,
  Icon: String,
  Label: String,
  Color: String,
  Error: Boolean,
  ReadAsURL: Boolean,
  hint: String,
});

const emit = defineEmits([
  "focus",
  "update:model-value",
  "activateFn",
  "expose-ref",
]);

// Submódulo acessa os serviços do app pelo $getService global (resolução por URI) — equivalente
// ao this.$getService do Options API.
const getService =
  getCurrentInstance().appContext.config.globalProperties.$getService;

const inputEl = ref(null);
const fileData = ref({
  file: null,
  name: null,
  src: null,
  size: null,
});
let dialogIsOpen = false;
let repetitionLock = false;

watch(
  () => props.modelValue,
  (v) => {
    fileData.value = v;
  },
  { deep: true },
);

watch(
  fileData,
  (v) => {
    emit("update:model-value", v);
  },
  { deep: true },
);

function sleep(miliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(miliseconds), miliseconds);
  });
}

async function inputClicked() {
  if (!repetitionLock) {
    repetitionLock = true;
    getService("toolcase/eventbroadcaster").$broadcast(
      "fileupload-before-choose",
    );
    await sleep(100);
    dialogIsOpen = true;
    window.addEventListener("focus", onWindowFocus);
    inputEl.value.click();
    document.activeElement.blur();
  }
}

function clearFile() {
  var input = inputEl.value;
  input.value = null;
  clearFileData();
}

function clearFileData() {
  fileData.value = {
    file: null,
    name: null,
    src: null,
    size: null,
  };
}

function readFile(file) {
  return new Promise((resolve) => {
    var reader = new FileReader();
    reader.onload = function (evt) {
      resolve({
        src: evt.target.result,
        file: file,
      });
    };

    if (props.ReadAsURL) reader.readAsDataURL(file);
    else reader.readAsText(file);
  });
}

async function fileChange(evt) {
  dialogIsOpen = false;
  var input = evt.target;

  if (input.files.length > 0) {
    let filedata = await readFile(input.files[0]);
    fileData.value = {
      file: filedata.file,
      name: filedata.file.name,
      src: filedata.src,
      size: filedata.file.size,
    };
  } else {
    clearFileData();
  }

  repetitionLock = false;
  getService("toolcase/eventbroadcaster").$broadcast("fileupload-chosen");
}

function onWindowFocus() {
  window.removeEventListener("focus", onWindowFocus);

  setTimeout(() => {
    if (dialogIsOpen) fileChange({ target: { files: [] } });
  }, 100);
}

onMounted(() => {
  emit("activateFn", inputClicked);
  emit("expose-ref", inputEl.value);
});
</script>
