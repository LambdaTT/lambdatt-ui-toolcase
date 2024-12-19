<template>
  <q-header elevated class="bg-white">
    <q-toolbar class="q-pa-sm text-grey-9">
      <!-- Btn: toggle menu -->
      <q-btn flat @click="$emit('toggle-drawer')" round dense icon="menu" />

      <!-- Main logo -->
      <q-toolbar-title>
        <span class="cursor-pointer" v-on:click="navToHome()">
          <q-img class="main-logo vertical-middle" alt="Logotipo" :src="LogoPath" />
          <q-tooltip>Ir para a Home</q-tooltip>
        </span>
      </q-toolbar-title>

      <!-- Input: Search on help (Desktop Only) -->
      <q-toolbar-title class="gt-sm" v-if="!!SearchOnHelpFn">
        <q-input disable label-color="grey-8" outlined v-model="searchTerm" label="Pesquisar na ajuda">
          <template v-slot:append>
            <q-btn flat size="sm">
              <q-icon @click="SearchOnHelpFn()" name="fas fa-search" color="grey-8" />
            </q-btn>
          </template>
        </q-input>
      </q-toolbar-title>

      <!-- Btn: Search on help (For Mobile) -->
      <q-btn class="lt-md q-pa-md" flat round size="sm" v-if="!!SearchOnHelpFn">
        <q-tooltip>Pesquisar na ajuda</q-tooltip>
        <q-icon name="fas fa-search" color="grey-8" />
        <q-menu>
          <q-input color="grey-3" label-color="grey-8" outlined v-model="searchTerm" label="Pesquisar na ajuda">
            <template v-slot:append>
              <q-btn v-on:click="SearchOnHelpFn()" flat size="sm">
                <q-icon name="fas fa-search" color="grey-8" />
              </q-btn>
            </template>
          </q-input>
        </q-menu>
      </q-btn>

      <!-- Btn: Notifications -->
      <q-btn class="q-ma-sm" flat round icon="fas fa-bell" size="sm">
        <q-tooltip v-if="notifications.length == 0">Não há nenhuma notificação.</q-tooltip>
        <q-tooltip v-if="notifications.length > 0">{{ notifications.length }} nova notificação(ões)</q-tooltip>
        <q-badge :rounded="true" v-if="newNotifications > 0" color="red" floating>{{ newNotifications }}</q-badge>
        <q-menu>
          <q-list class="q-pa-sm text-grey-8" style="max-height: 50vh; overflow-y: auto;">
            <q-item class="row" v-if="notifications.length == 0">
              <div class="col-3 q-pa-sm">
                <q-icon name="fas fa-folder-open" size="lg"></q-icon>
              </div>
              <div class="col-9 q-pa-sm">
                Não há notificações no momento.
              </div>
            </q-item>
            <q-item class="text-center">
              <div class="full-width">
                <q-btn color="primary" flat style="font-size: 0.95em;" @click="$router.push('/notifications')">
                  Ver todas notificações
                </q-btn>
              </div>
            </q-item>
            <q-item class="column" :clickable="true" @click="showNotificationModal(ntf)" v-for="ntf in notifications"
              :key="ntf.ds_key"
              :class="['notification-card', { 'callout-info': ntf.do_important != 'Y', 'callout-warning': ntf.do_important == 'Y', 'text-bold': ntf.do_read != 'Y' }]">
              <div>
                <span class="float-right text-caption text-warning" v-if="ntf.do_important == 'Y'">
                  <i class="fas fa-star"></i>
                  <q-tooltip>Importante!</q-tooltip>
                </span> &nbsp;
                <!-- <i class="fas fa-star"></i> -->
                <!-- <span class="text-h9">{{ ntf.author_name }}</span> -->
              </div>
              <div class="q-mt-sm media media-body">
                <img :src="ntf.author_avatar" alt="Avatar" class="img-size-avatar img-circle mr-3"> &nbsp;
                <div>

                  <!-- <div class="q-mt-sm"> -->
                  <p v-text="ntf.author_name"></p>
                  <p v-text="ntf.ds_brief"></p>
                  <p class="text-caption text-muted q-mt-sm">
                    <q-icon name="fas fa-clock"></q-icon> {{ ntf.dtCreated }}
                  </p>
                  <!-- </div> -->
                </div>
              </div>
            </q-item>
            <q-separator></q-separator>
          </q-list>
        </q-menu>
      </q-btn>

      <!-- Btn: Full screen -->
      <q-btn class="q-pa-md" flat round icon="fas fa-expand-arrows-alt" size="sm" @click="fullScreen()">
        <q-tooltip>Tela cheia</q-tooltip>
      </q-btn>

      <!-- Btn: Sign out -->
      <q-btn v-if="!!LogoutFn" class="q-pa-md" flat round icon="fas fa-sign-out-alt" size="sm" @click="logout()">
        <q-tooltip>Sair</q-tooltip>
      </q-btn>
    </q-toolbar>

    <!-- Notification Modal -->
    <NotificationModal v-model="showNotificationDialog" :notification="selectedNotification" />
  </q-header>
</template>

<script>
export default {
  name: 'ui-layoutadmin-headerbar',

  props: {
    LogoPath: String,
    SearchOnHelpFn: Function,
    LogoutFn: Function,
  },

  components: {
  },

  data() {
    return {
      newNotifications: 0,
      showNotificationDialog: false,
      selectedNotification: null,
      notifications: [],
      searchTerm: null
    }
  },

  created() {
    // this.getNotifications();
    // setInterval(this.getNotifications, 15 * 1000); // 15 seconds
  },

  methods: {
    navToHome() {
      location.href = '/';
    },

    fullScreen() {
      // if already full screen; exit
      // else go fullscreen
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        element.style.overflowY = 'hidden';
      } else {
        var element = document.getElementById('content-wrapper');
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen();
        }
        element.style.overflowY = 'scroll';
      }
    },

    getNotifications() {
      var $hdr = this;
      return this.$http.get('/api/usernotifications/v1/notification?$limit=15&$sort_by=2&$sort_direction=DESC')
        .then(function (response) {
          $hdr.notifications = [];
          $hdr.newNotifications = 0;

          for (var i = 0; i < response.data.length; i++) {
            var notification = response.data[i];

            // Handle creation date:
            notification.dtCreated = notification.dt_created ? this.$utils.dateFormat(new Date(notification.dt_created), 'd/m/y h:i:s') : null;

            // Handle author's avatar and name:
            notification.author_name = notification.author_name == 'System' ? 'Sistema' : notification.author_name;
            notification.author_avatar = !notification.author_avatar ? '/resources/img/unknown-user.jpg' : (notification.author_avatar == 'system' ? '/resources/img/system-icon.jpg' : notification.author_avatar);

            // Add notification on the list:
            $hdr.notifications.push(notification);

            if (notification.do_read != 'Y') $hdr.newNotifications++;
          }
        })
        .catch((error) => {
          console.log(error)
          if (error.response?.status == 401) location.href = '/login';
        });
    },

    showNotificationModal(notification) {
      this.selectedNotification = notification;
      this.showNotificationDialog = true;
      this.readNotification(notification);
    },

    readNotification(notification) {
      if (notification.do_read != 'Y') {
        this.$http.put('/api/usernotifications/v1/notification/' + notification.ds_key, { 'do_read': 'Y' })
          .then(() => {
            this.selectedNotification = notification;
            notification.do_read = 'Y'
          })
          .catch((response) => {
            console.error("An error has occurred on the attempt to read notification.", response);
            this.$utils.notifyError(response);
          });

      } else {
        this.selectedNotification = notification;
      }
    },

    logout() {
      if (!confirm("Deseja encerrar seu acesso?")) return false;

      return this.LogoutFn();
    },
  }
}
</script>

<style scoped>
.main-logo {
  max-width: 155px;
}

.img-size-avatar {
  margin-top: -20px;
  width: 50px;
  height: 50px;
}

.notification-card {
  border: 1px solid #dcdcdc;
  border-radius: 8px;
  margin-bottom: 4px;
  padding: 3px;
  background-color: #ffffff;
  position: relative;
  cursor: pointer;
  font-size: 1.00em;
  /* height: auto; */
}

.callout-info {
  border-left: 5px solid #117a8b;
}

.callout-warning {
  border-left: 5px solid #d39e00;
}

.media {
  display: -ms-flexbox;
  display: flex;
  -ms-flex-align: start;
  align-items: flex-start;
}

.media-body {
  -ms-flex: 1;
  flex: 1;
}

.img-circle {
  border-radius: 50%;
}

.mr-3 {
  margin-right: 1rem;
}

.q-menu .q-list {
  max-height: 50vh;
  overflow-y: auto;
}
</style>
