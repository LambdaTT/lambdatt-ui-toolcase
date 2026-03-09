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
        // Others
        "fas fa-coffee",
        "fas fa-utensils",
        "fas fa-pizza-slice",
        "fas fa-hamburger",
        "fas fa-glass-martini-alt",
        "fas fa-beer",
        "fas fa-wine-glass",
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
