import localData from './localdata.js';
import utils from './utils.js';
import http from './http.js';

export default {
  add(data) {
    localData.insert('requestQueue', {
      'id': utils.uniqid(),
      'method': data.method.toLowerCase(),
      'url': data.url,
      'body': data.body ?? {},
      'callback': data.callback,
      'repeat': data.repeat ?? 0,
      'retry': data.retry ?? false
    });
  },

  async sendAll() {
    if (!navigator.onLine) return;

    localData.init('requestQueue');
    var requests = localData.find('requestQueue');

    for (let i = 0; i < requests.length; i++) {
      let req = requests[i];

      let markedForDel = req.repeat <= 0;

      try {
        var response = await http[req.method](req.url, req.body);
      } catch (e) {
        if (req.retry) markedForDel = false;
      }

      if (req.callback) req.callback(response);

      if (markedForDel)
        localData.delete('requestQueue', { 'id': req.id });
      else if (req.repeat > 0)
        localData.update('requestQueue', { 'id': req.id }, { repeat: req.repeat - 1 });


    }
  }
}
