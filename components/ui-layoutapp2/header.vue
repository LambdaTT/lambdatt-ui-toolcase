<template>
  <q-header elevated class="bg-white">
    <q-toolbar class="q-pa-sm text-grey-9">
      <!-- Main logo -->
      <q-btn class="q-pa-md" flat round icon="fas fa-bars" size="md" @click="$emit('toggle-drawer')">
      </q-btn>
      <q-toolbar-title class="text-center">
        <q-img class="main-logo vertical-middle" alt="Logo Principal" :src="MainLogoSrc" />
      </q-toolbar-title>
      <!-- Notification Bell -->
      <q-btn flat round icon="fas fa-bell" size="md">
        <q-badge color="red" floating>{{ notifications.length }}</q-badge>
        <q-menu>
          <q-list class="q-pa-sm text-grey-8 text-justify" style="max-height: 300px; overflow-y: auto;">
            <q-item v-for="(notification, index) in notifications" :key="index"
              :class="`border-all-1 border-grey-7 q-hoverable hover-notification ${notification.important}`" clickable
              @click="notification.fn">
              <q-card class="full-width">
                <q-card-section>
                  <div class="row items-center q-pb-xs">
                    <span class="text-subtitle2 text-weight-bold">{{ notification.title }}</span>
                    <q-icon v-if="notification.important" name="fas fa-star" color="yellow" class="q-ml-xs" />
                  </div>
                  <div class="text-body1 q-px-xs">{{ notification.message }}</div>
                  <div class="text-caption text-grey-6 q-mt-xs">
                    <q-icon name="far fa-clock" class="q-mr-xs" /> {{ notification.date }}
                  </div>
                </q-card-section>
              </q-card>
            </q-item>
          </q-list>

        </q-menu>
      </q-btn>

      <!-- Btn: Header Actions -->
      <q-btn class="q-pa-md" flat round :icon="BtnActionsIcon" size="md">
        <q-menu>
          <q-list class="q-pa-sm text-grey-8 text-no-wrap">
            <q-item v-for="(a, idx) in Actions" :key="idx" v-close-popup clickable @click="a.fn()">
              <q-item-section side>
                <q-icon v-if="a.icon" size="sm" :name="a.icon" />
              </q-item-section>
              <q-item-section v-if="a.title">{{ a.title }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-toolbar>
  </q-header>
</template>

<script>
export default {
  name: 'ui-layoutapp2-header',

  props: {
    BtnActionsIcon: String,
    Actions: Array,
    MainLogoSrc: String,
    LoadNotificationsFn: Function,
    NotificationsInterval: Number,
  },

  data() {
    return {
      notifications: [
      ]
    }
  },

  methods: {
    async loadNotifications() {
      if (!!this.loadNotifications) {
        var response = await this.LoadNotificationsFn();

        this.notifications = response.data;
      }
    }
  },

  mounted() {
    this.loadNotifications();
    setInterval(this.loadNotifications, !!this.NotificationsInterval ? this.NotificationsInterval : 15000);
  }

}
</script>

<style scoped>
.main-logo {
  max-width: 155px;
}

.hover-notification:hover {
  background-color: #f5f5f5;
}

.q-item-section {
  white-space: normal;
}

.text-body1,
.text-caption {
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}
</style>
