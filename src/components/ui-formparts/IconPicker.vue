<template>
  <div class="icon-picker">
    <q-input
      v-model="search"
      placeholder="Pesquisar ícones..."
      outlined
      dense
      class="q-mb-md"
      clearable
    >
      <template v-slot:append>
        <q-icon name="fas fa-search" />
      </template>
    </q-input>

    <q-scroll-area style="height: 300px; max-width: 100%">
      <div class="row q-col-gutter-xs justify-center">
        <div v-for="icon in filteredIcons" :key="icon" class="col-auto">
          <q-btn
            flat
            padding="sm"
            :color="modelValue === icon ? 'primary' : 'grey-7'"
            @click="selectIcon(icon)"
            :class="modelValue === icon ? 'bg-blue-1' : ''"
          >
            <q-icon :name="icon" size="24px" />
            <q-tooltip>{{ icon }}</q-tooltip>
          </q-btn>
        </div>
      </div>
    </q-scroll-area>

    <div v-if="modelValue" class="q-mt-md text-center">
      <div class="text-caption text-grey-7">Ícone selecionado:</div>
      <div class="text-subtitle2">
        <q-icon :name="modelValue" size="xs" class="q-mr-xs" />
        {{ modelValue }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "IconPicker",

  props: {
    modelValue: String,
  },

  data() {
    return {
      search: "",
      icons: [
        // Basic
        "fas fa-home",
        "fas fa-user",
        "fas fa-cog",
        "fas fa-search",
        "fas fa-envelope",
        "fas fa-heart",
        "fas fa-star",
        "fas fa-check",
        "fas fa-times",
        "fas fa-plus",
        "fas fa-minus",
        "fas fa-info-circle",
        "fas fa-exclamation-triangle",
        "fas fa-question-circle",
        // Business
        "fas fa-briefcase",
        "fas fa-chart-line",
        "fas fa-chart-bar",
        "fas fa-pie-chart",
        "fas fa-copy",
        "fas fa-paste",
        "fas fa-save",
        "fas fa-trash-alt",
        "fas fa-edit",
        "fas fa-calendar-alt",
        "fas fa-clock",
        "fas fa-building",
        "fas fa-handshake",
        "fas fa-lightbulb",
        // Commerce
        "fas fa-shopping-cart",
        "fas fa-shopping-bag",
        "fas fa-credit-card",
        "fas fa-tag",
        "fas fa-tags",
        "fas fa-money-bill-alt",
        "fas fa-wallet",
        "fas fa-barcode",
        "fas fa-qrcode",
        "fas fa-box",
        "fas fa-truck",
        "fas fa-gift",
        // Direction
        "fas fa-arrow-up",
        "fas fa-arrow-down",
        "fas fa-arrow-left",
        "fas fa-arrow-right",
        "fas fa-chevron-up",
        "fas fa-chevron-down",
        "fas fa-chevron-left",
        "fas fa-chevron-right",
        "fas fa-external-link-alt",
        "fas fa-share",
        "fas fa-reply",
        // File
        "fas fa-file",
        "fas fa-file-alt",
        "fas fa-file-pdf",
        "fas fa-file-word",
        "fas fa-file-excel",
        "fas fa-file-powerpoint",
        "fas fa-file-image",
        "fas fa-file-video",
        "fas fa-file-audio",
        "fas fa-file-archive",
        "fas fa-file-code",
        // Media
        "fas fa-camera",
        "fas fa-image",
        "fas fa-video",
        "fas fa-music",
        "fas fa-microphone",
        "fas fa-volume-up",
        "fas fa-volume-mute",
        "fas fa-play",
        "fas fa-pause",
        "fas fa-stop",
        "fas fa-forward",
        "fas fa-backward",
        // Medical
        "fas fa-plus-square",
        "fas fa-ambulance",
        "fas fa-heartbeat",
        "fas fa-hospital",
        "fas fa-medkit",
        "fas fa-stethoscope",
        "fas fa-user-md",
        "fas fa-virus",
        "fas fa-shield-virus",
        // Shapes
        "fas fa-circle",
        "fas fa-square",
        "fas fa-star",
        "fas fa-bolt",
        "fas fa-cloud",
        "fas fa-moon",
        "fas fa-sun",
        "fas fa-tree",
        "fas fa-leaf",
        "fas fa-fire",
        "fas fa-water",
        // Social
        "fas fa-share-alt",
        "fas fa-thumbs-up",
        "fas fa-thumbs-down",
        "fas fa-comment",
        "fas fa-comments",
        "fas fa-users",
        "fas fa-user-friends",
        "fas fa-user-plus",
        "fas fa-user-minus",
        // Users & People
        "fas fa-user-circle",
        "fas fa-user-tie",
        "fas fa-user-graduate",
        "fas fa-user-ninja",
        "fas fa-user-astronaut",
        "fas fa-baby",
        "fas fa-child",
        "fas fa-male",
        "fas fa-female",
        // Food & Beverage
        "fas fa-apple-whole",
        "fas fa-bacon",
        "fas fa-beer-mug-empty",
        "fas fa-blender",
        "fas fa-bone",
        "fas fa-bottle-droplet",
        "fas fa-bottle-water",
        "fas fa-bowl-food",
        "fas fa-bowl-rice",
        "fas fa-bread-slice",
        "fas fa-burger",
        "fas fa-cake-candles",
        "fas fa-candy-cane",
        "fas fa-carrot",
        "fas fa-champagne-glasses",
        "fas fa-cheese",
        "fas fa-cloud-meatball",
        "fas fa-cookie",
        "fas fa-cubes-stacked",
        "fas fa-drumstick-bite",
        "fas fa-egg",
        "fas fa-fish",
        "fas fa-fish-fins",
        "fas fa-flask",
        "fas fa-glass-water",
        "fas fa-glass-water-droplet",
        "fas fa-hotdog",
        "fas fa-ice-cream",
        "fas fa-jar",
        "fas fa-jar-wheat",
        "fas fa-lemon",
        "fas fa-martini-glass",
        "fas fa-martini-glass-citrus",
        "fas fa-martini-glass-empty",
        "fas fa-mug-hot",
        "fas fa-mug-saucer",
        "fas fa-pepper-hot",
        "fas fa-pizza-slice",
        "fas fa-plate-wheat",
        "fas fa-seedling",
        "fas fa-shrimp",
        "fas fa-stroopwafel",
        "fas fa-wheat-awn",
        "fas fa-wheat-awn-circle-exclamation",
        "fas fa-whiskey-glass",
        "fas fa-wine-bottle",
        "fas fa-wine-glass",
        "fas fa-wine-glass-empty",
        "fas fa-utensils",
        "fas fa-coffee",
        // Others
        "fas fa-map-marker-alt",
        "fas fa-map",
        "fas fa-globe",
        "fas fa-plane",
        "fas fa-car",
        "fas fa-bicycle",
        "fas fa-motorcycle",
      ],
    };
  },

  computed: {
    filteredIcons() {
      if (!this.search) return this.icons;
      const s = this.search.toLowerCase();
      return this.icons.filter((icon) => icon.toLowerCase().includes(s));
    },
  },

  methods: {
    selectIcon(icon) {
      this.$emit("update:modelValue", icon);
    },
  },
};
</script>

<style scoped>
.icon-picker {
  width: 100%;
}
</style>
