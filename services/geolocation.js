import Http from './http.js'

const getGeolocation = () => new Promise((resolve, reject) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  } else {
    reject(new Error("Geolocalização não é suportada pelo navegador."));
  }
});

export const GeolocationService = {
  async trackGeolocation() {
    try {
      const position = await getGeolocation();

      const data = {
        vl_latitude: position.latitude,
        vl_longitude: position.longitude,
      };

      await Http.post('/api/app/operators/v1/geolocation', data)
    } catch (error) {
      console.error('Erro ao coletar ou enviar geolocalização:', error);
    }
  }
};