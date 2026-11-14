<template>
  <div :class="`row ${dense ? 'q-pa-xs' : 'q-pa-sm'}`">
    <!-- Video for open cam -->
    <div
      v-show="step < 2"
      :style="videoWrapperStyle"
      :class="['video-wrapper', 'col-12', 'bg-black']"
    >
      <video
        ref="videoEl"
        :aspect-ratio="aspectRatio"
        autoplay
        playsinline
      ></video>
    </div>

    <!-- Taken Photo preview -->
    <div v-show="step == 2" class="col-12">
      <q-img :src="photoUrl" style="width: 100%; border-radius: 5px"></q-img>
    </div>

    <!-- Taken Photo preview -->
    <div v-show="step == 3" class="col-12 text-center q-pa-sm">
      <q-icon name="fas fa-check-circle" color="positive" size="4em"></q-icon>
      <div class="text-grey-10 q-mt-sm">Foto capturada com sucesso</div>
    </div>

    <!-- Buttons and controls -->
    <div class="col-12 q-mt-xs">
      <q-btn
        class="q-ma-xs full-width"
        color="primary"
        icon="fas fa-play"
        v-show="step == 0"
        label="Abrir câmera"
        @click="startCamera"
      />
      <q-btn
        class="q-ma-xs full-width"
        color="primary"
        icon="fas fa-camera"
        v-show="step == 1"
        label="Tirar Foto"
        @click="shootPhoto"
      />
      <q-btn
        class="q-ma-xs full-width"
        color="grey-7"
        icon="fas fa-undo"
        v-show="step == 2"
        label="Tirar Outra"
        @click="startCamera"
      />
      <q-btn
        class="q-ma-xs full-width"
        color="positive"
        icon="fas fa-check"
        v-show="step == 2"
        label="Confirmar Foto"
        @click="confirmPhoto"
      />
    </div>

    <canvas ref="canvasEl" style="display: none"></canvas>
  </div>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from "vue";

defineOptions({ name: "ui-gadgets-photoshooter" });

const props = defineProps({
  ResultFileName: String,
  modelValue: Object,
  dense: Boolean,
  Orientation: {
    type: String,
    default: null, // 'portrait' ou 'landscape'
    validator: (val) => [null, "portrait", "landscape", "square"].includes(val),
  },
  AspectRatio: {
    type: String,
    default: null, // '3/4' ou '4/3'
    validator: (val) => /\d+\s*\/\s*\d+/.test(val) || val === null,
  },
  Widescreen: {
    type: Boolean,
    default: false,
  },
  DefaultCamera: {
    type: String,
    default: "back",
    validator: (v) => ["front", "back"].includes(v),
  },
});

const emit = defineEmits(["update:modelValue"]);

// Submódulo acessa os serviços do app pelo $getService global (resolução por URI) — equivalente
// ao this.$getService do Options API.
const getService =
  getCurrentInstance().appContext.config.globalProperties.$getService;

const videoEl = ref(null);
const canvasEl = ref(null);

const step = ref(0); // Controla se a câmera está aberta
const photoUrl = ref(null); // Armazena a URL da foto tirada
const photoFile = ref(null);
let stream = null; // Armazena o stream da câmera

const aspectRatio = computed(() => {
  if (!props.AspectRatio && !!props.Orientation) {
    switch (props.Orientation) {
      case "portrait":
        return props.Widescreen ? "9/16" : "3/4";
      case "landscape":
        return props.Widescreen ? "16/9" : "4/3";
      case "square":
        return "4/4";
      default:
        return "4/3";
    }
  }

  return "4/3";
});

const videoWrapperStyle = computed(() => ({
  aspectRatio: aspectRatio.value,
  width: "100%",
  height: "100%",
  maxWidth: "100%",
  maxHeight: "100%",
}));

const factory = computed(() => ({
  dataUrl: photoUrl.value,
  file: photoFile.value,
  fileName: props.ResultFileName ? `${props.ResultFileName}.jpg` : "captura.jpg",
  fnReset: reset,
}));

async function startCamera() {
  try {
    photoUrl.value = null;
    photoFile.value = null;

    const constraints = {
      video: {
        facingMode: {
          ideal: props.DefaultCamera === "front" ? "user" : "environment",
        },
      },
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.value.srcObject = stream;
    step.value = 1;
  } catch (err) {
    if (String(err).includes("NotFoundError")) {
      getService("toolcase/eventbroadcaster").$broadcast("no-camera");
    }
    console.error(
      "An error has occured on the attempt to start the camera",
      err,
    );
  }
}

function shootPhoto() {
  const video = videoEl.value;
  const canvas = canvasEl.value;
  const context = canvas.getContext("2d");

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  // Determina a proporção desejada com base na prop
  const desiredAspect = eval(`${aspectRatio.value}`);

  // Base: usamos a altura real do vídeo
  let drawWidth = videoWidth;
  let drawHeight = videoHeight;

  // Calcula área de corte para manter o aspecto desejado
  const actualAspect = videoWidth / videoHeight;

  if (actualAspect > desiredAspect) {
    // Vídeo mais largo que o desejado → cortar nas laterais
    drawWidth = videoHeight * desiredAspect;
  } else {
    // Vídeo mais alto que o desejado → cortar em cima/baixo
    drawHeight = videoWidth / desiredAspect;
  }

  // Define tamanho do canvas com base no aspecto desejado
  canvas.width = drawWidth;
  canvas.height = drawHeight;

  // Calcula o offset para centralizar o corte
  const offsetX = (videoWidth - drawWidth) / 2;
  const offsetY = (videoHeight - drawHeight) / 2;

  // Desenha o frame no canvas respeitando corte e proporção
  context.drawImage(
    video,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight,
    0,
    0,
    drawWidth,
    drawHeight,
  );

  // Gera base64 e arquivo
  photoUrl.value = canvas.toDataURL("image/jpeg");
  photoFile.value = base64ToFile(photoUrl.value, "captura.jpg");

  // Encerra a câmera
  const activeStream = video.srcObject;
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }

  stream = null;

  step.value = 2;
}

function base64ToFile(dataurl, filename) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

function confirmPhoto() {
  step.value = 3;
  emit("update:modelValue", factory.value);
}

function reset() {
  step.value = 0;
  photoUrl.value = null;
  stream = null;
  startCamera();
}
</script>

<style scoped>
.video-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border-radius: 5px;
}

.video-wrapper video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
