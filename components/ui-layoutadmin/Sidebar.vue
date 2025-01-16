<template>
  <q-drawer @hide="$emit('drawer-hide')" class="bg-grey-10 text-grey-1" v-model="drawerState" show-if-above
    :mini="miniState" @mouseover="miniState = false" @mouseout="miniState = true" mini-to-overlay bordered>
    <q-scroll-area class="fit" :horizontal-thumb-style="{ opacity: 0 }">
      <q-list padding>
        <!-- Link: My Account -->
        <q-item :class="`${$route.path == '/iam/my-account' ? 'bg-teal text-white' : ''}`" :clickable="true"
          @click="navTo('/iam/my-account')">
          <q-tooltip>Minha Conta</q-tooltip>
          <q-item-section avatar>
            <img style="border-radius: 50%; width:25px;" :src="loggedUser?.ds_avatar_img_url">
          </q-item-section>
          <q-item-section>
            <span>{{ loggedUser?.fullName }}</span>
          </q-item-section>
        </q-item>
        <q-separator></q-separator>

        <q-item>
          <q-tooltip>Pesquisar no sistema</q-tooltip>
          <q-item-section avatar>
            &nbsp;
          </q-item-section>
          <q-item-section>
            <span>
              <q-input style="height:10px;" standout="text-white" dark label="Pesquisar" square outlined dense
                v-model="searchTerm" @update:model-value="search" clearable>
                <template v-slot:append>
                  <q-icon name="search" color="grey-8" />
                </template>
              </q-input>
            </span>
          </q-item-section>
        </q-item>
      </q-list>

      <q-list padding>
        <template v-if="navigator.length == 0">
          <q-separator></q-separator>
          <q-item>
            <q-item-section avatar>
              &nbsp;
            </q-item-section>
            <q-item-section>
              <div class="q-pa-lg text-center">
                <q-tooltip>A pesquisa retornou vazia.</q-tooltip>
                <q-icon size="lg" color="grey" name="fas fa-folder-open"></q-icon> *
              </div>
            </q-item-section>
          </q-item>
        </template>
        <!-- Nav Items -->
        <template v-if="navigator.length > 0">
          <div v-for="(item, index) in navigator" :key="index">
            <q-separator v-if="item.type == 'header'" />
            <!-- Item with no children -->
            <q-item :class="`${$route.path == item.href ? 'bg-teal text-white' : ''}`" :clickable="item.type == 'item'"
              @click="navTo(item.href, item)" v-if="item.subItems.length == 0">
              <q-item-section avatar>
                <span v-if="item.type == 'header'">&nbsp;</span>
                <q-icon v-if="item.type == 'item'" :name="item.icon"></q-icon>
              </q-item-section>
              <q-item-section>
                <span :class="item.type == 'header' ? 'sidebar-section-title' : ''">{{ item.title }}</span>
              </q-item-section>
            </q-item>

            <!-- Item with children -->
            <q-expansion-item :default-opened="Boolean(item.menuOpen)"
              :class="`${$route.path.includes(item.href) ? 'bg-teal text-white' : ''}`" v-if="item.subItems.length > 0"
              :icon="item.icon" :label="item.title">
              <q-list padding>
                <q-item :class="`${$route.path == subitem.href ? 'bg-white text-teal' : ''}`"
                  v-for="(subitem, subindex) in item.subItems" :key="subindex" clickable v-ripple
                  @click="navTo(subitem.href, item, subitem)">
                  <q-item-section avatar>
                    &nbsp;
                  </q-item-section>

                  <q-item-section>
                    <span><q-icon name="fas fa-chevron-right" size="10px"></q-icon> {{ subitem.title }}</span>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </div>
        </template>

      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>

<script>
// Services:
import Sidebar from '../../../../services/sidebar.js'

export default {
  name: 'ui-layoutadmin-sidebar',
  data() {
    return {
      drawerState: false,
      miniState: true,
      loggedUser: null,
      rawNavigator: [],
      navigator: [],
      searchTerm: null,
      searchTimeout: null,
    }
  },

  props: {
    outerDrawerState: Boolean
  },

  watch: {
    outerDrawerState(value) {
      this.drawerState = value;
    }
  },

  methods: {
    getNavigatorData() {
      Sidebar.getData(this.$route.path)
        .then((navbardata) => {
          this.loggedUser = navbardata.loggedUser;
          this.loggedUser.fullName = this.loggedUser.ds_first_name + " " + this.loggedUser.ds_last_name;
          if (this.loggedUser.ds_avatar_img_url == null)
            this.loggedUser.ds_avatar_img_url = '/resources/img/unknown-user.jpg';

          this.navigator = navbardata.navigator;
          this.rawNavigator = navbardata.navigator;
        });
    },

    navTo(url) {
      this.$router.push(url);
    },

    search() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        if (!!this.searchTerm) {
          this.navigator = this.$utils.cloneObj(this.rawNavigator);
          for (let i = 0; i < this.navigator.length; i++) {
            let item = this.navigator[i];

            if (!!item.subItems) {
              item.menuOpen = true;
              item.subItems = item.subItems.filter((obj) => obj.tags.includes(this.searchTerm))
            }
          }

          this.navigator = this.navigator.filter((obj) => obj.tags.includes(this.searchTerm));
        }
        else {
          for (let i = 0; i < this.navigator.length; i++) {
            this.navigator[i].menuOpen = false;
          }
          this.navigator = this.rawNavigator;
        }

      }, 300);
    }
  },

  mounted() {
    this.getNavigatorData();
  },
}
</script>

<style scoped>
.sidebar-section-title {
  text-decoration: underline;
}
</style>
