import axios from 'axios';
import { utils, eventbroadcaster } from '../services.js'

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
      url = `${url}${url.includes('?') ? '&' : '?'}${_params}`;
    }

    var reqConf = {
      headers: { ...headers }
    };

    headers = {};

    var xsrfToken = localStorage.getItem('xsrf_token');
    if (xsrfToken != null) reqConf.headers['Xsrf-Token'] = xsrfToken;

    var sessionKey = localStorage.getItem('iam_session_key');
    if (sessionKey != null) reqConf.headers['Iam-Session-Key'] = sessionKey;

    var reqPromise = axios.get(url, reqConf);

    // Evt Trigger
    eventbroadcaster.$broadcast('http-request-sent', reqPromise);

    return reqPromise;
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

    var reqPromise = axios.post(url, data, reqConf);

    // Evt Trigger
    eventbroadcaster.$broadcast('http-request-sent', reqPromise);

    return reqPromise
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

    var reqPromise = axios.put(url, data, reqConf);

    // Evt Trigger
    eventbroadcaster.$broadcast('http-request-sent', reqPromise);

    return reqPromise
  },

  delete: function (url, params) {
    url = `${process.env.API}${url}`;
    var _params = '';
    if (utils.objectSize(params) > 0) {
      _params = utils.objToSerialString(params);
      url = `${url}${url.includes('?') ? '&' : '?'}${_params}`;
    }

    var reqConf = {
      headers: { ...headers }
    };

    headers = {};

    var xsrfToken = localStorage.getItem('xsrf_token');
    if (xsrfToken != null) reqConf.headers['Xsrf-Token'] = xsrfToken;

    var sessionKey = localStorage.getItem('iam_session_key');
    if (sessionKey != null) reqConf.headers['Iam-Session-Key'] = sessionKey;

    var reqPromise = axios.delete(url, reqConf);

    // Evt Trigger
    eventbroadcaster.$broadcast('http-request-sent', reqPromise);

    return reqPromise;
  },

  download: function ({ url, params, method, filename }) {
    method = !!method ? method.toLowerCase() : 'get';
    url = `${process.env.API}${url}`;

    if (utils.objectSize(params) > 0)
      url = `${url}${url.includes('?') ? '&' : '?'}${utils.objToSerialString(params)}`;

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

    var reqPromise = axios[method](url, reqConf)
      .then((response) => {
        let fname;
        if (!!filename) {
          fname = filename;
        } else if (!!response.headers['content-filename']) {
          fname = decodeURI(response.headers['content-filename']).replaceAll('+', ' ');
        } else fname = 'downloaded_file';

        let blob = new Blob([response.data], { type: response.headers['content-type'] })
        var _url = window.URL.createObjectURL(blob);

        let anchorElement = document.createElement('a');
        anchorElement.style.display = 'none';
        anchorElement.href = _url;
        anchorElement.download = fname;
        anchorElement.click();

        window.URL.revokeObjectURL(_url);
        anchorElement.remove();
      });

    // Evt Trigger
    eventbroadcaster.$broadcast('http-request-sent', reqPromise);

    return reqPromise;
  },

  upload: function (url, params, method) {
    if (!(data instanceof FormData)) throw 'You can only upload data in the form a FormData object';

    method = !!method ? method.toLowerCase() : 'post';
    url = `${process.env.API}${url}`;

    if (utils.objectSize(params) > 0)
      url = `${url}${url.includes('?') ? '&' : '?'}${utils.objToSerialString(params)}`;

    var reqConf = {
      headers: { 'Content-Type': 'multipart/form-data', ...headers }
    };

    headers = {};

    var xsrfToken = localStorage.getItem('xsrf_token');
    if (xsrfToken != null) reqConf.headers['Xsrf-Token'] = xsrfToken;

    var sessionKey = localStorage.getItem('iam_session_key');
    if (sessionKey != null) reqConf.headers['Iam-Session-Key'] = sessionKey;

    var reqPromise = axios[method](url, reqConf);

    // Evt Trigger
    eventbroadcaster.$broadcast('http-request-sent', reqPromise);

    return reqPromise;
  }
}