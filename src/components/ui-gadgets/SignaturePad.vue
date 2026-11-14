<template>
  <div style="position: relative;">
    <canvas ref="canvas" class="full-width" style="height:200px;border-radius:8px;background-color:#fff;"></canvas>
    <div style="position:absolute;bottom:8px;right:8px;display:flex;gap:8px;">
      <q-btn dense flat icon="fas fa-eraser" label="Limpar" color="negative" @click="handleClear" />
      <q-btn dense flat icon="fas fa-check-circle" label="Salvar" color="positive" @click="handleSave" />
    </div>
  </div>
</template>

<script setup>
// Libs:
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import SignaturePad from 'signature_pad';

defineOptions({ name: 'ui-gadgets-signaturepad' })

const props = defineProps({
  penColor: { type: String, default: 'rgb(0,0,0)' },
  bgColor: { type: String, default: 'rgb(255,255,255)' }
})

const emit = defineEmits(['cleared', 'saved', 'error'])

const canvas = ref(null)
let signaturePad = null
let dataURL = null

function initialize() {
  const el = canvas.value;
  if (!el) return;
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  el.width = el.offsetWidth * ratio;
  el.height = el.offsetHeight * ratio;
  el.getContext('2d').scale(ratio, ratio);

  signaturePad = new SignaturePad(el, {
    backgroundColor: props.bgColor,
    penColor: props.penColor
  });
}

function handleClear() {
  resize();

  if (signaturePad) {
    signaturePad.clear();
    dataURL = null;
    emit('cleared');
  }
}

function handleSave() {
  if (signaturePad && !signaturePad.isEmpty()) {
    dataURL = signaturePad.toDataURL('image/png');
    emit('saved', dataURL);
  } else {
    emit('error', 'empty'); // Emitir erro caso vazio
  }
}

function resize() {
  initialize();
}

onMounted(() => {
  nextTick(() => {
    initialize();
  });
  window.addEventListener('resize', resize);
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
})
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
