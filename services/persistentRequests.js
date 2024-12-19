import { utils, http, localData } from '../services.js'

export default {
  store(data) {
    localData.insert('persistentRequests', {
      'id': utils.uniqid(),
      'method': data.method,
      'url': data.url,
      'body': data.body ? data.body : {},
      'callback': data.callback
    });
  },

  async sendAll() {
    localData.init('persistentRequests');
    var requests = localData.find('persistentRequests');

    for (let i = 0; i < requests.length; i++) {
      let req = requests[i];
      localData.delete('persistentRequests', { 'id': req.id });

      var response = await http[req.method.toLowerCase()](req.url, req.body);
      if (req.callback) req.callback(response);

    }
  }
}
