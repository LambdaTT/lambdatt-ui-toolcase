<template>
  <Dialog :Headline="Title" :Icon="Icon" :ContentText="Content" :Actions="[{ label: 'Ok', fn: () => isShown = false }]"
    v-model="isShown" />
</template>

<script setup>
// IMPORTS
import { ref, onMounted } from 'vue'


// INITIALIZATION
defineExpose({ show })
const props = defineProps({
  Icon: String,
  Title: String,
  Content: String,
  persistent: Boolean,
  modelValue: Boolean,
  DefaultOpened: Boolean,
})
onMounted(() => {
  if (props.DefaultOpened !== null) show.value = props.DefaultOpened
})


// VARS
const isShown = ref(false)


// FUNCTIONS
function show() {
  isShown.value = true
}
</script>