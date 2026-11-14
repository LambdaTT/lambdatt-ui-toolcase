<template>
  <div>
    <div
      v-if="isCustomIcon(Name)"
      :class="Color ? `text-${Color}` : ''"
      :style="`
                width: ${iconSizePx};
                height: ${iconSizePx};
                font-size: ${iconFontSizePx};
              `"
    >
      <component :is="Name" />
    </div>
    <div
      v-else-if="!!Html"
      v-html="Html"
      :class="Color ? `text-${Color}` : ''"
      :style="`
                width: ${iconSizePx};
                height: ${iconSizePx};
                font-size: ${iconFontSizePx};
              `"
    ></div>
    <q-icon
      v-else-if="!!Name"
      :name="Name"
      :size="Size ?? 'md'"
      :color="Color"
    ></q-icon>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from "vue";

defineOptions({ name: "ui-gadgets-icon" });

const props = defineProps({
  Name: String,
  Size: String,
  Color: String,
  Html: String,
});

const $isCustomIcon =
  getCurrentInstance().appContext.config.globalProperties.$isCustomIcon;

const iconSizePx = computed(() => {
  const sizeMap = {
    xs: "18px",
    sm: "24px",
    md: "32px",
    lg: "38px",
    xl: "46px",
  };
  const size = props.Size ?? "md";
  return sizeMap[size] ?? size;
});

const iconFontSizePx = computed(() => {
  const fontMap = {
    xs: "12px",
    sm: "16px",
    md: "20px",
    lg: "24px",
    xl: "30px",
  };
  const size = props.Size ?? "md";
  return fontMap[size] ?? size;
});

function isCustomIcon(name) {
  return typeof $isCustomIcon === "function" ? $isCustomIcon(name) : false;
}
</script>
