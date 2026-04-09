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

<script>
export default {
  name: "ui-gadgets-icon",

  props: {
    Name: String,
    Size: String,
    Color: String,
    Html: String,
  },

  computed: {
    iconSizePx() {
      const sizeMap = {
        xs: "18px",
        sm: "24px",
        md: "32px",
        lg: "38px",
        xl: "46px",
      };
      const size = this.Size ?? "md";
      return sizeMap[size] ?? size;
    },
    iconFontSizePx() {
      const fontMap = {
        xs: "12px",
        sm: "16px",
        md: "20px",
        lg: "24px",
        xl: "30px",
      };
      const size = this.Size ?? "md";
      return fontMap[size] ?? size;
    },
  },

  methods: {
    isCustomIcon(name) {
      return typeof this.$isCustomIcon === "function"
        ? this.$isCustomIcon(name)
        : false;
    },
  },
};
</script>
