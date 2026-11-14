<template>
  <q-dialog backdrop-filter="blur(4px) contrast(40%)" :persistent="persistent" v-model="show">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          <q-icon v-if="!!Icon" :name="Icon"></q-icon>
          {{ Title }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        {{ Content }}
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="OK" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

defineOptions({ name: 'components-common-inconsistencewarning' })

const props = defineProps({
  Icon: String,
  Title: String,
  Content: String,
  persistent: Boolean,
  modelValue: Boolean,
  DefaultOpened: Boolean,
})

const emit = defineEmits(['update:model-value'])

const show = ref(false)

watch(() => props.modelValue, (v) => {
  show.value = v
})

watch(show, (v) => {
  emit('update:model-value', v)
})

onMounted(() => {
  if (props.DefaultOpened !== null) show.value = props.DefaultOpened
})
</script>