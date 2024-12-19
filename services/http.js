import axios from 'axios';
import { utils } from '../services.js'

var headers = {};
export default {
  setHeader: function (name, value) {
    headers[name] = value;
  },

  get: function (url, params) {
    url = `${process.env.API}${url}`;
    var _params = '';
    if (utils.objectSize(params) > 0) {
      _params = utils.objToSerialString(params);
      url = `${url}?${_params}`;
    }

    var reqConf = {
      headers: { ...headers }
    };

    headers = {};

    var xsrfToken = localStorage.getItem('xsrf_token');
    if (xsrfToken != null) reqConf.headers['Xsrf-Token'] = xsrfToken;

    var sessionKey = localStorage.getItem('iam_session_key');
    if (sessionKey != null) reqConf.headers['Iam-Session-Key'] = sessionKey;

    return axios.get(url, reqConf);
  },

  post: function (url, data) {
    url = `${process.env.API}${url}`;
    var reqConf = {
      headers: { ...headers }
    };

    headers = {};

    var xsrfToken = localStorage.getItem('xsrf_token');
    if (xsrfToken != null) reqConf.headers['Xsrf-Token'] = xsrfToken;

    var sessionKey = localStorage.getItem('iam_session_key');
    if (sessionKey != null) reqConf.headers['Iam-Session-Key'] = sessionKey;

    return axios.post(url, data, reqConf);
  },

  put: function (url, data) {
    url = `${process.env.API}${url}`;
    var reqConf = {
      headers: { ...headers }
    };

    headers = {};

    var xsrfToken = localStorage.getItem('xsrf_token');
    if (xsrfToken != null) reqConf.headers['Xsrf-Token'] = xsrfToken;

    var sessionKey = localStorage.getItem('iam_session_key');
    if (sessionKey != null) reqConf.headers['Iam-Session-Key'] = sessionKey;

    return axios.put(url, data, reqConf);
  },

  delete: function (url, params) {
    url = `${process.env.API}${url}`;
    var _params = '';
    if (utils.objectSize(params) > 0) {
      _params = utils.objToSerialString(params);
      url = `${url}?${_params}`;
    }

    var reqConf = {
      headers: { ...headers }
    };

    headers = {};

    var xsrfToken = localStorage.getItem('xsrf_token');
    if (xsrfToken != null) reqConf.headers['Xsrf-Token'] = xsrfToken;

    var sessionKey = localStorage.getItem('iam_session_key');
    if (sessionKey != null) reqConf.headers['Iam-Session-Key'] = sessionKey;

    return axios.delete(url, reqConf);
  },

  download: function (url, params, method) {
    method = !!method ? method.toLowerCase() : 'get';
    url = `${process.env.API}${url}`;

    if (utils.objectSize(params) > 0)
      url = `${url}?${utils.objToSerialString(params)}`;

    var reqConf = {
      responseType: 'arrayBuffer',
      responseEncoding: 'utf8',
      headers: { ...headers }
    };

    headers = {};

    var xsrfToken = localStorage.getItem('xsrf_token');
    if (xsrfToken != null) reqConf.headers['Xsrf-Token'] = xsrfToken;

    var sessionKey = localStorage.getItem('iam_session_key');
    if (sessionKey != null) reqConf.headers['Iam-Session-Key'] = sessionKey;

    axios[method](url, reqConf)
      .then((response) => {
        let blob = new Blob([response.data], { type: response.headers['content-type'] })
        var _url = window.URL.createObjectURL(blob);

        let anchorElement = document.createElement('a');
        anchorElement.style.display = 'none';
        anchorElement.href = _url;
        anchorElement.download = decodeURI(response.headers['content-filename']).replaceAll('+', ' ');
        anchorElement.click();

        window.URL.revokeObjectURL(_url);
        anchorElement.remove();
      });
  },

  upload: function (url, params, method) {
    if (!(data instanceof FormData)) throw 'You can only upload data in the form a FormData object';

    method = !!method ? method.toLowerCase() : 'post';
    url = `${process.env.API}${url}`;

    if (utils.objectSize(params) > 0)
      url = `${url}?${utils.objToSerialString(params)}`;

    var reqConf = {
      headers: { 'Content-Type': 'multipart/form-data', ...headers }
    };

    headers = {};

    var xsrfToken = localStorage.getItem('xsrf_token');
    if (xsrfToken != null) reqConf.headers['Xsrf-Token'] = xsrfToken;

    var sessionKey = localStorage.getItem('iam_session_key');
    if (sessionKey != null) reqConf.headers['Iam-Session-Key'] = sessionKey;

    return axios[method](url, reqConf);
  }
}