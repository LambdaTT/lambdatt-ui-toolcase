export default {
  routerInstance: null,

  getRouter() {
    return this.routerInstance;
  },

  getCurrentRoute() {
    return this.routerInstance?.currentRoute?.value;
  }
}
