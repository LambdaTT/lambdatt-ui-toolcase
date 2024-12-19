<template>
  <div>
    <q-banner v-if="showInstallBanner" class="q-mb-md" dense>
      <div class="text-justify">
        <q-icon name="fas fa-info-circle" size="xs" class="q-ma-xs" />
        {{ installMessage }}
        Clique abaixo para mais detalhes.
      </div>
      <q-btn flat color="primary" @click="openVideoModal" label="Como Instalar" />
      <q-btn flat color="primary" @click="dismissBanner" label="Dispensar" />
    </q-banner>

    <q-dialog v-if="detectPlatform() == 'android'" v-model="videoModalOpen">
      <q-card>
        <q-toolbar>
          <q-toolbar-title>Como Instalar o App</q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-toolbar>
        <q-card-section>
          <div class="text-subtitle1">
            <b>Passo 1:</b> Abra o menu do navegador clicando no ícone localizado no canto superior direito da tela
          </div>
          <div>
            <q-img src="~assets/installation/android1.png"></q-img>
          </div>
        </q-card-section>

        <q-separator></q-separator>

        <q-card-section>
          <div class="text-subtitle1">
            <b>Passo 2:</b> No menu suspenso que vai se abrir, localize a opção "Adicionar à Tela Inicial".
          </div>
          <div>
            <q-img src="~assets/installation/android2.png"></q-img>
          </div>
        </q-card-section>

        <q-separator></q-separator>

        <q-card-actions align="right">
          <q-btn flat label="Fechar" @click="closeVideoModal" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-if="detectPlatform() == 'ios'" v-model="videoModalOpen">
      <q-card>
        <q-toolbar>
          <q-toolbar-title>Como Instalar o App</q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-toolbar>
        <q-card-section>
          <div class="text-subtitle1">
            <b>Passo 1:</b> Abra o menu de compartilhamento clicando no ícone localizado na parte de baixo da tela.
          </div>
          <div>
            <q-img src="~assets/installation/iphone1.png"></q-img>
          </div>
        </q-card-section>

        <q-separator></q-separator>

        <q-card-section>
          <div class="text-subtitle1">
            <b>Passo 2:</b> No menu que vai se abrir, localize a opção "Adicionar à Tela de Início".
          </div>
          <div>
            <q-img src="~assets/installation/iphone2.png"></q-img>
          </div>
        </q-card-section>

        <q-separator></q-separator>

        <q-card-actions align="right">
          <q-btn flat label="Fechar" @click="closeVideoModal" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
export default {
  name: 'ui-layoutapp2-installationbanner',

  data() {
    return {
      showInstallBanner: false,
      installMessage: '',
      videoModalOpen: false
    };
  },
  methods: {
    isPwaInstalled() {
      return window.matchMedia('(display-mode: standalone)').matches;
    },
    detectPlatform() {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      if (/android/i.test(userAgent)) {
        return 'android';
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'ios';
      } else {
        return 'other';
      }
    },
    setInstallMessage() {
      const platform = this.detectPlatform();
      if (platform === 'android') {
        this.installMessage = 'Para instalar este aplicativo, toque no botão de menu do seu navegador e depois em "Adicionar à tela inicial".';
      } else if (platform === 'ios') {
        this.installMessage = 'Para instalar este aplicativo, toque no ícone de compartilhamento do seu navegador e depois em "Adicionar à Tela de Início".';
      } else {
        this.installMessage = 'Para instalar este aplicativo, use a opção "Adicionar à tela inicial" do seu navegador.';
      }
    },
    dismissBanner() {
      this.showInstallBanner = false;
    },
    openVideoModal() {
      this.videoModalOpen = true;
    },
    closeVideoModal() {
      this.videoModalOpen = false;
    }
  },
  created() {
    if (!this.isPwaInstalled()) {
      this.setInstallMessage();
      this.showInstallBanner = true;
    }
  }
};
</script>

<style scoped>
.q-banner {
  background-color: #343a40;
  color: #f8f9fa;
}
</style>
