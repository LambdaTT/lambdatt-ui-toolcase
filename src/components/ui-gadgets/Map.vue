<template>
  <div class="map-container" :id="`map-container-${uniqid}`">
    <!-- Empty -->
    <div
      v-show="mapState == 'empty'"
      class="q-pa-xl absolute bg-white column flex-center text-grey-8"
      id="map-empty"
    >
      <q-icon size="xl" name="fas fa-map"></q-icon>
      <div>Mapa Vazio.</div>
    </div>

    <!-- Loading -->
    <div
      class="q-pa-xl absolute bg-white text-center text-grey-8 row items-center"
      v-show="mapState == 'loading'"
      id="map-loading"
    >
      <div class="col-12">
        <q-spinner-gears size="lg" />
        <div class="text-caption">Carregando...</div>
      </div>
    </div>

    <!-- Offline -->
    <div
      v-show="mapState == 'offline'"
      class="q-pa-xl absolute bg-white text-center text-grey-8"
    >
      <div>
        <q-icon size="lg" name="wifi_off"></q-icon>
      </div>
      <div class="text-h6">Você Está Offline</div>
      <div class="text-caption">
        Não é possível carregar o mapa sem conexão.
      </div>
      <small>Para visualizar o mapa, reconecte a rede</small>
    </div>

    <!-- Ready -->
    <div class="map" :id="`map-${uniqid}`" v-show="mapState == 'ready'"></div>
  </div>
</template>
<script setup>
/* global google */
import { ref, watch, onMounted } from "vue";

defineOptions({ name: "ui-gadgets-map" });

const props = defineProps({
  AddressObj: Object,
  AddressStr: String,
});

const emit = defineEmits(["map-loaded"]);

const uniqid = ref(null);
const mapState = ref("empty");
let updMapDebounce = null;

watch(
  () => props.AddressObj,
  (val) => {
    handleAddressObj(val);
  },
  { deep: true },
);

watch(
  () => props.AddressStr,
  (val) => {
    handleAddressStr(val);
  },
);

function buildFullAddress(address) {
  if (!address || address.ds_street == null) return null;

  var fullAddress =
    address.ds_street +
    ", " +
    address.ds_number +
    (address.ds_complement ? ", " + address.ds_complement : "") +
    ", " +
    address.ds_neighborhood +
    ", " +
    address.ds_city +
    "/" +
    address.do_state +
    " - CEP: " +
    address.ds_zipcode;

  return fullAddress;
}

async function getGeoCode(address, callback) {
  var geocoder = new google.maps.Geocoder();

  await geocoder.geocode(
    {
      address: address,
    },
    function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        let latitude = results[0].geometry.location.lat();
        let longitude = results[0].geometry.location.lng();

        if (callback) callback(latitude, longitude);
      }
    },
  );
}

function updMapAddress(buildAddress) {
  buildAddress = buildAddress != null ? buildAddress : true;

  mapState.value = "loading";

  if (updMapDebounce) clearTimeout(updMapDebounce);

  updMapDebounce = setTimeout(() => {
    var fullAddress = buildAddress
      ? buildFullAddress(props.AddressObj)
      : props.AddressStr;

    if (fullAddress == null) return;

    getGeoCode(fullAddress, (latitude, longitude) => {
      initMap(latitude, longitude);
    });
  }, 300);
}

// Initialize and add the map
function initMap(lat, lng) {
  // The location
  var location = {
    lat: lat,
    lng: lng,
  };
  // The map, centered at location
  const map = new google.maps.Map(
    document.getElementById(`map-${uniqid.value}`),
    {
      zoom: 14,
      center: location,
    },
  );

  // The marker, positioned at location
  new google.maps.Marker({
    position: location,
    map: map,
  });

  mapState.value = "ready";
  emit("map-loaded");
}

function handleAddressStr() {
  if (!props.AddressStr) mapState.value = "empty";
  else updMapAddress(false);
}

function handleAddressObj(val) {
  if (
    !!val &&
    !!val.ds_street &&
    !!val.ds_number &&
    !!val.ds_neighborhood &&
    !!val.ds_city &&
    !!val.do_state
  ) {
    updMapAddress(true);
  } else mapState.value = "empty";
}

onMounted(() => {
  // Generate an uniqid
  var ts = String(new Date().getTime()),
    out = "";
  var i;
  for (i = 0; i < ts.length; i += 2) {
    out += Number(ts.substr(i, 2)).toString(36);
  }
  uniqid.value = "d" + out;

  if (navigator.onLine == false) {
    mapState.value = "offline";
    return;
  }

  if (props.AddressObj) handleAddressObj(props.AddressObj);
  else if (props.AddressStr) handleAddressStr();
});
</script>
<style scoped>
.map-container {
  position: relative;
  height: 300px;
}

.map {
  height: 300px;
}

.map-container > .absolute {
  width: 100%;
  height: 300px;
}
</style>
