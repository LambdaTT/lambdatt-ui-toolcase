<template>
  <div>

    <!-- No errors -->
    <q-select v-if="error === null" filled square hide-bottom-space hide-dropdown-icon use-input fill-input
      :loading="loading" behavior="menu" :bg-color="`bg-${BgColor ? BgColor : 'white'}`" option-disable="inactive"
      input-debounce="300" :clearable="clearable" :dense="dense" :disable="disable" :label="Label" :readonly="readonly"
      :hide-selected="!Multiple" :options="options" :error="Error" :multiple="Multiple" :use-chips="UseChips"
      :stack-label="StackLabel" v-model="selected" @filter="filterFn" @focus="$emit('focus')"
      @popup-show="isOpen = true" @popup-hide="isOpen = false">
      <template v-slot:append>
        <q-icon v-if="!readonly" :class="isOpen ? 'rotate-180' : ''" name="arrow_drop_down" color="grey-8"
          style="transition: transform 0.28s" />
        <q-icon v-if="!!Icon" :name="Icon" color="grey-8" />
      </template>
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">Nenhum resultado</q-item-section>
        </q-item>
      </template>
    </q-select>

    <!-- Error state -->
    <label v-else
      class="q-field row no-wrap items-start q-field--filled q-input q-field--square q-field--float q-field--labeled full-width bg-red-1"
      for="f_0f2b1c56-251c-42ac-9d8d-f01255b7ef19"><!---->
      <div class="q-field__inner relative-position col self-stretch">
        <div class="q-field__control relative-position row no-wrap" tabindex="-1">
          <div class="q-field__control-container col relative-position row no-wrap q-anchor--skip"><input
              class="q-field__native q-placeholder text-negative text-bold" tabindex="0" :aria-label="Label"
              id="f_0f2b1c56-251c-42ac-9d8d-f01255b7ef19" maxlength="100" type="text" disabled
              :value="`ERRO: ${error}`">
            <div class="q-field__label no-pointer-events absolute ellipsis">{{ Label }}</div><!---->
          </div>
          <div class="q-field__append q-field__marginal row no-wrap items-center"><i
              class="q-icon text-negative fas fa-circle-exclamation" aria-hidden="true" role="presentation"> </i></div>
        </div><!---->
      </div><!---->
    </label>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, getCurrentInstance } from 'vue'

defineOptions({ name: 'ui-formparts-select2' })

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null
  },
  Options: {
    type: Array,
    default: () => []
  },
  OptionsURL: String,
  OptionMap: Object,

  BgColor: String,
  Label: String,
  Icon: String,
  Error: Boolean,

  readonly: Boolean,
  disable: Boolean,
  dense: Boolean,
  clearable: Boolean,

  Multiple: Boolean,
  UseChips: Boolean,
  StackLabel: Boolean,

  Default: [String, Object, Number],
})

const emit = defineEmits(['focus', 'update:model-value'])

// Submódulo acessa os serviços do app pelo $getService global (resolução por URI) — equivalente
// ao this.$getService do Options API.
const getService = getCurrentInstance().appContext.config.globalProperties.$getService

const filteredOptions = ref([])
const selected = ref(null)
const isOpen = ref(false)
let internalUpdate = false // Evita loop infinito entre: selected -> emitValue -> modelValue -> setValue -> selected
const error = ref(null)
const errorDict = {
  400: '400 - Requisição inválida.',
  401: '401 - Não autenticado.',
  403: '403 - Permissão negada.',
  404: '404 - Não Encontrado',
  500: '500 - Erro interno do servidor. Tente novamente mais tarde.',
  502: '502 - Bad Gateway.',
  503: '503 - Serviço temporariamente indisponível.',
  504: '504 - Gateway Timeout.'
}
const remoteOptions = ref([])
const loading = ref(true)

const options = computed(() => filteredOptions.value)

const definedOpts = computed(() =>
  props.Options.length ? props.Options : (remoteOptions.value ?? [])
)

watch(selected, (v) => {
  v = v ?? props.Default ?? null;
  emitValue(v)
})

watch(() => props.modelValue, (v) => {
  if (internalUpdate) {
    internalUpdate = false
    return
  }

  setValue(v);
}, { immediate: true })

watch(() => props.Options, (v) => {
  const opts = v.length ? [...v] : (remoteOptions.value ?? []);
  filteredOptions.value = opts.sort(
    (a, b) => String(a.label).localeCompare(String(b.label), 'pt-BR', { sensitivity: 'base' })
  );
  error.value = null; // Limpa erros anteriores ao atualizar opções
  setValue(props.modelValue)
})

watch(() => props.OptionsURL, () => {
  getRemoteOptions()
})

function setValue(v) {
  if (loading.value && props.Options.length === 0) {
    setTimeout(() => setValue(v), 300);
    return;
  }

  const source = definedOpts.value
  if (!source?.length) return

  if (!v) {
    selected.value = props.Multiple ? [] : null
    return
  }

  selected.value = props.Multiple
    ? source.filter(opt => (Array.isArray(v) ? v : []).includes(opt.value))
    : source.find(opt =>
      String(opt.value).toLowerCase() === String(v).toLowerCase()
    ) || null
}

function filterFn(val, update) {
  update(() => {
    const opts = definedOpts.value
      .sort(
        (a, b) => String(a.label).localeCompare(String(b.label), 'pt-BR', { sensitivity: 'base' })
      );
    if (!(val)) {
      filteredOptions.value = opts
      return
    }

    const needle = val.toLowerCase()
    filteredOptions.value = opts
      .filter(opt =>
        String(opt.label).toLowerCase().includes(needle)
      )
  })
}

function emitValue(v) {
  if (props.Multiple) {
    internalUpdate = true
    const values = Array.isArray(v)
      ? v.map(item => (item instanceof Object && 'value' in item) ? item.value : item)
      : []
    emit('update:model-value', values)
    return
  }

  if (v instanceof Object && "value" in v) v = v.value;

  const payload = v ? v : null
  if (payload === props.modelValue) return

  internalUpdate = true
  emit('update:model-value', payload)
}

async function getRemoteOptions() {
  loading.value = true
  try {
    if (props.OptionsURL && props.OptionMap) {
      const { data } = await getService('toolcase/http').get(props.OptionsURL)
      remoteOptions.value = data.map(item => ({
        label: item[props.OptionMap.label],
        value: item[props.OptionMap.value],
      }));
    } else {
      remoteOptions.value = []
    }

    filteredOptions.value = [...definedOpts.value].sort(
      (a, b) => String(a.label).localeCompare(String(b.label), 'pt-BR', { sensitivity: 'base' })
    );
    error.value = null; // Limpa erros anteriores ao atualizar opções
  } catch (e) {
    error.value = errorDict[e.status];
    console.error('Erro ao buscar opções remotas:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (props.OptionsURL && !props.OptionMap) {
    console.warn('Select2: OptionsURL fornecida sem OptionMap. As opções remotas não serão carregadas.')
  }

  await getRemoteOptions();
  if (props.Default) {
    selected.value = props.Default;
  }
})
</script>
