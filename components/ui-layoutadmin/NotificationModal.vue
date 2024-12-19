<template>
  <q-dialog v-model="internalShow" :persistent="false" @click-outside="closeModal" class="modal-background">
    <q-card :class="['notification-card', calloutClass]" class="modal-content">
      <q-card-section class="card-content">
        <div class="text-h6">
          <span class="text-sm text-warning" title="Importante!" v-if="notification.do_important === 'Y'">
            <q-icon name="fas fa-star"></q-icon>
          </span>
          {{ notification.ds_headline }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="card-body">
        <p v-if="!notification" class="animation-fade text-center">
          <q-icon name="fas fa-spinner" class="fa-spin fa-2x"></q-icon>
        </p>
        <div v-if="notification" class="animation-fade d-flex align-items-start notification-card">
          <img :src="notification.author_avatar" alt="Avatar" class="img-size-80 img-circle mr-3">
          <div>
            <div class="d-flex align-items-center mb-2">
              <span class="author-name">{{ notification.author_name }}</span>
            </div>
            <div class="mt-3">
              <p class="text-sm" v-html="notification.tx_content"></p>

              <div class="notification-date">
                <p class="text-sm text-muted">
                  <q-icon name="fas fa-clock"></q-icon> {{ dtCreated }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Ok" color="primary" @click="closeModal">
          <q-icon name="fas fa-check"></q-icon>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  name: 'ui-layoutadmin-modal',
  
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    notification: {
      type: Object,
      required: false,
      default: null
    }
  },

  data() {
    return {
      internalShow: this.modelValue
    }
  },

  computed: {
    calloutClass() {
      return this.notification.do_important === 'Y' ? 'callout-warning' : 'callout-info';
    },

    dtCreated() {
      return this.$utils.dateFormat(new Date(this.notification.dt_created), 'd/m/y h:i:s');
    }
  },

  watch: {
    modelValue(val) {
      this.internalShow = val;
    },

    internalShow(val) {
      this.$emit('update:modelValue', val);
    }
  },

  methods: {
    closeModal() {
      this.internalShow = false;
    },
  }
}
</script>

<style scoped>
.notification-card {
  border: 1px solid #dcdcdc;
  border-radius: 15px;
  padding: 16px;
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
  word-wrap: break-word;
  display: flex;
  flex-direction: column;
}

.callout-info {
  border-left: 5px solid #117a8b;
}

.callout-warning {
  border-left: 5px solid #d39e00;
}

.img-size-80 {
  margin-top: -10px;
  width: 80px;
  height: 80px;
}

.img-circle {
  border-radius: 50%;
}

.mr-3 {
  margin-right: 1rem;
}

.animation-fade {
  animation: fade 0.3s;
}

@keyframes fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.modal-background {
  background-color: rgba(0, 0, 0, 0.6);
}

.modal-content {
  border-radius: 10px;
  background-color: #ffffff;
  min-width: 600px;
}

.author-name {
  font-weight: bold;
  margin-left: 10px;
}

.mt-3 {
  margin-top: 20px;
}

.notification-date {
  margin-top: 8px;
  font-size: 0.875rem;
  color: #666666;
}

.card-content {
  flex-grow: 0;
}

.card-body {
  flex-grow: 1;
  overflow-y: auto;
}
</style>
