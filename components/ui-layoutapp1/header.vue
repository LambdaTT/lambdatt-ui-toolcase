<template>
  <q-header elevated class="bg-white">
    <q-toolbar class="q-pa-sm text-grey-9">
      <!-- Main logo -->
      <q-toolbar-title>
        <img class="main-logo vertical-middle" alt="Logo App do operador" src="~assets/logo-mqv-vertical.png" />
        <!-- <img class="main-logo vertical-middle" alt="Logo App do operador" src="~assets/mqv-logo-horizontal.png" /> -->
      </q-toolbar-title>

      <!-- Btn: Marcar Ponto -->
      <q-btn :disable="!canOperatorWork || workdayControl() > 3" class="q-pa-xs" icon="fas fa-stopwatch" size="md"
        color="amber-9" label="Marcar Jornada">
        <q-menu>
          <q-list class="q-pa-sm text-grey-8">
            <q-item clickable v-close-popup :disable="isClockUnavailable('I')" @click="addClockEntry('I')">
              <q-item-section side>
                <q-icon size="sm" name="fas fa-play" />
              </q-item-section>
              <q-item-section>Iniciar Jornada</q-item-section>
            </q-item>
            <q-item clickable v-close-popup :disable="isClockUnavailable('L')" @click="addClockEntry('L')">
              <q-item-section side>
                <q-icon size="sm" name="fas fa-pause" />
              </q-item-section>
              <q-item-section>Pausa Almoço</q-item-section>
            </q-item>
            <q-item clickable v-close-popup :disable="isClockUnavailable('B')" @click="addClockEntry('B')">
              <q-item-section side>
                <q-icon size="sm" name="fas fa-play" />
              </q-item-section>
              <q-item-section>Retorno Almoço</q-item-section>
            </q-item>
            <q-item clickable v-close-popup :disable="isClockUnavailable('O')" @click="addClockEntry('O')">
              <q-item-section side>
                <q-icon size="sm" name="fas fa-stop" />
              </q-item-section>
              <q-item-section>Encerrar Jornada</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>

      <!-- Btn: Sign out -->
      <q-btn class="q-pa-md" flat round icon="fas fa-user" size="md">
        <q-menu>
          <q-list class="q-pa-sm text-grey-8">
            <q-item v-close-popup clickable disable>
              <q-item-section side>
                <q-icon size="sm" name="fas fa-user-cog" />
              </q-item-section>
              <q-item-section>Meus Dados</q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="logout()">
              <q-item-section side>
                <q-icon size="sm" name="fas fa-sign-out" />
              </q-item-section>
              <q-item-section>Sair</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-toolbar>
  </q-header>
</template>

<script>
import Http from '../../services/http.js'
import Utils from '../../services/utils.js'
import ServerData from '../../services/serverdata.js'
import OperatorService from '../../services/operator.js'

export default {
  name: 'header-component',

  data() {
    return {
      registeredCallbacks: [],
      operator: null,
      workday: null,
      clocksToday: [],
      canOperatorWork: false
    }
  },

  methods: {
    init() {
      this.operator = OperatorService.getOperatorData();
      this.getWorkday();
      this.clocksToday = OperatorService.getClocksToday();
      this.blockScreen();
    },

    logout() {
      if (!confirm("Deseja encerrar seu acesso?")) return false;

      var $hdr = this;

      $hdr.$emit('load', 'logout');

      var url = '/api/auth/v1/logout';

      if (localStorage.getItem('authtoken'))
        url += '?token=' + localStorage.getItem('authtoken');

      Http.delete(url)
        .then(function () {
          $hdr.$emit('loaded', 'logout');
          localStorage.removeItem('authtoken');
          localStorage.removeItem('xsrf_token');
          localStorage.removeItem('iam_session_key');
          localStorage.removeItem('iam_session_started')
          location.href = '/login';
        });
    },

    getWorkday() {
      this.workday = OperatorService.getOperatorWorkday();

      if (!this.workday) {
        this.canOperatorWork = false;
        return false;
      }

      this.canOperatorWork = this.checkOperatorWorkPermission();

      return this.canOperatorWork;
    },

    isClockUnavailable(type) {
      var clockedTypes = []
      var clockedLunchTime = null;
      for (let i in this.clocksToday) {
        let clock = this.clocksToday[i];

        if (clock.do_type == 'L') {
          clockedLunchTime = new Date(clock.dt_clock)
        }
        clockedTypes.push(clock.do_type);
      }

      switch (type) {
        case 'I':
          if (clockedTypes.includes('I')) return true;
          break;
        case 'L':
          if (!clockedTypes.includes('I')) return true;
          if (clockedTypes.includes('L')) return true;
          break;
        case 'B':
          if (!clockedTypes.includes('I')) return true;
          if (!clockedTypes.includes('L')) return true;
          if (clockedTypes.includes('B')) return true;

          // if (this.operator.do_contract_type == 'E') {
          //   if (new Date().getTime() - clockedLunchTime.getTime() < 1000 * 60 * 60) // 1 hour
          //     return true;
          // }
          break;
        case 'O':
          if (!clockedTypes.includes('I')) return true;
          if (!clockedTypes.includes('L')) return true;
          if (!clockedTypes.includes('B')) return true;
          if (clockedTypes.includes('O')) return true;
          break;
      }

      return false;
    },

    checkOperatorWorkPermission() {
      var curDate = Utils.currentDatetime();

      var startDate = Utils.currentDatetime();
      startDate.setHours(...this.workday.tm_start.split(':'));

      var endDate = Utils.currentDatetime();
      endDate.setHours(...this.workday.tm_end.split(':'));

      if (curDate > startDate && curDate < endDate) return true;

      return false;
    },

    async addClockEntry(type) {
      if (!confirm("Deseja marcar o ponto agora?")) return false;

      await OperatorService.addClockEntry(this, type);

      this.clocksToday = OperatorService.getClocksToday();

      this.blockScreen();
    },

    blockScreen() {
      var result = !this.canOperatorWork || (this.workdayControl() != 1 && this.workdayControl() != 3);
      this.$emit('block-screen', result);
      this.$emit('block-screen-msg', this.workdayControlMsg());
      return result;
    },

    workdayControl() {
      var clockedTypes = []
      var clockTypesDict = {
        'I': 1,
        'L': 2,
        'B': 3,
        'O': 4,
      }

      for (let i in this.clocksToday) {
        let clock = this.clocksToday[i];

        clockedTypes.push(clockTypesDict[clock.do_type]);
      }

      if (clockedTypes.length == 0) return 0;
      else return Math.max.apply(null, clockedTypes);
    },

    workdayControlMsg() {
      if (this.canOperatorWork === false)
        return {
          'icon': 'fas fa-user-slash',
          'msg': 'Você não tem permissão para trabalhar no momento.',
        };

      switch (this.workdayControl()) {
        case 0:
          return {
            'icon': 'fas fa-briefcase',
            'msg': 'Inicie a jornada para interagir com o aplicativo.',
          };
          break;
        case 2:
          return {
            'icon': 'fas fa-business-time',
            'msg': 'Você está em horário de almoço.',
          };
          break;
        case 4:
          return {
            'icon': 'fas fa-hourglass-end',
            'msg': 'Sua jornada de hoje foi encerrada. Bom descanso!',
          };
          break;
      }

      return { 'icon': '', 'msg': '' };
    },
  },

  created() {
    this.init();
    this.registeredCallbacks.push(ServerData.registerCallback(this.init));
  },

  beforeUnmount() {
    for (let i = 0; i < this.registeredCallbacks.length; i++) {
      ServerData.unregisterCallback(this.registeredCallbacks[i]);
    }
  }
}
</script>

<style scoped>
.main-logo {
  max-width: 155px;
}
</style>
