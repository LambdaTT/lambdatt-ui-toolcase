import { is, Loading } from "quasar";

const toLoad = [];
var isLoading = false;

export default {
  load(evt) {
    if (evt && evt != '')
      toLoad.push(evt);

    if (!isLoading) {
      Loading.show();
      isLoading = true;
    }
  },

  loaded(evt) {
    var index = toLoad.indexOf(evt);

    if (index != -1) toLoad.splice(index, 1);

    if (toLoad.length == 0) {
      Loading.hide();
      isLoading = false;
    }
  },
};