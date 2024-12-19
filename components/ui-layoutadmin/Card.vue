<template>
  <q-card>
    <q-card-section :class="`${dense ? 'q-pa-sm' : 'q-pa-lg'} bg-${style.headerBgColor} text-${style.headerTextColor}`">
      <!--Card Header-->
      <div class="row">
        <div class="col-12 col-md-6 q-mb-sm q-mb-md-none" style="display: flex; align-items: center;">
          <span class="text-h6" :style="`display: flex; align-items: center; gap: ${dense ? '1px' : '4px'}`">
            <q-icon v-if="!!Icon" :name="Icon" :size="dense ? 'xs' : 'md'"></q-icon>
            <span v-if="!!Icon">&nbsp;</span>
            {{ Title }}
          </span>
        </div>
        <div class="col-12 col-md-6 text-right">
          <slot name="actions"></slot>
        </div>
      </div>
    </q-card-section>

    <!--Main Section-->
    <q-card-section class="card-main-section q-pa-none q-pa-md-md">
      <slot></slot>
    </q-card-section>

    <!--Secondary Sections-->
    <div v-for="(section, name) in $slots" :key="name">
      <q-separator v-if="name != 'actions' && name != 'default'"></q-separator>
      <q-card-section class="q-pa-xs q-pa-md-md" v-if="name != 'actions' && name != 'default'">
        <slot :name="name"></slot>
      </q-card-section>
    </div>
  </q-card>
</template>

<script>
export default {
  name: 'ui-layoutadmin-card',

  props: {
    Title: String,
    Icon: String,
    HeaderBgColor: String,
    HeaderTextColor: String,
    dense: Boolean,
  },

  data() {
    return {
      style: {
        headerBgColor: 'teal',
        headerTextColor: 'white'
      }
    }
  },

  mounted() {
    if (!!this.HeaderBgColor) this.style.headerBgColor = this.HeaderBgColor;
    if (!!this.HeaderTextColor) this.style.headerTextColor = this.HeaderTextColor;
  }
}
</script>

<style scoped>
.card-main-section {
  overflow-x: scroll;
}
</style>