<template>
  <q-drawer class="bg-grey-3 text-grey-10 text-body2" v-model="drawerState" :breakpoint="1920" bordered
    @update:model-value="updateModel">
    <q-scroll-area class="fit" :horizontal-thumb-style="{ opacity: 0 }">
      <div class="text-center q-pa-lg" v-on:click="$router.push('/')">
        <q-img class="main-logo vertical-middle full-width" alt="Logo do sindicato" :src="MainLogoSrc" />
      </div>
      <q-separator></q-separator>
      <q-list>
        <!-- Nav Items: -->
        <template v-for="(item, index) in NavItems" :key="index">
          <q-expansion-item v-if="item.subitems && item.subitems.length > 0" :icon="item.icon" :label="item.title">
            <q-list padding>
              <q-item v-for="(subitem, idx) in item.subitems" :key="idx" clickable @click="subitem.fn">
                <q-item-section avatar>
                  &nbsp;
                </q-item-section>
                <q-item-section>
                  <span><q-icon name="fas fa-chevron-right" size="10px"></q-icon> {{ subitem.title }}</span>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>

          <q-item v-else clickable @click="item.fn">
            <q-item-section avatar>
              <q-icon v-if="item.icon" :name="item.icon"></q-icon>
            </q-item-section>
            <q-item-section>
              <span>{{ item.title }}</span>
            </q-item-section>
          </q-item>

        </template>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>

<script>

export default {
  name: 'ui-layoutapp2-sidebar',
  data() {
    return {
      drawerState: false,
    }
  },

  props: {
    MainLogoSrc: String,
    NavItems: Array,
    modelValue: Boolean,
  },

  watch: {
    modelValue(value) {
      this.drawerState = value;
    }
  },

  methods: {
    updateModel(val) {
      this.$emit('update:model-value', val);
    },
  },

}
</script>