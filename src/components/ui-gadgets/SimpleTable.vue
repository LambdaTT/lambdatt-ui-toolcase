<template>
  <div class="q-pa-xs q-pa-md-none">
    <!-- Options and Controls -->
    <div class="row q-pb-sm">
      <div class="col-12 col-md-8">
        <!-- Custom Resources -->
        <q-btn
          v-for="(r, i) in CustomResources"
          :key="i"
          flat
          round
          color="primary"
          size="sm"
          :icon="r.icon ?? 'fas fa-gear'"
          @click="r.fn"
        >
          <q-tooltip>{{ r.label ?? "Recurso personalizado" }}</q-tooltip>
        </q-btn>

        <!--Visible Columns control-->
        <q-btn flat round color="primary" size="sm" icon="fas fa-columns">
          <q-tooltip>Colunas visíveis</q-tooltip>
          <q-menu class="q-pa-sm">
            <q-option-group
              v-model="visibleColumns"
              type="checkbox"
              :options="columnOptions"
            ></q-option-group>
          </q-menu>
        </q-btn>
        <!--Export options control-->
        <q-btn
          v-if="!!Export"
          flat
          round
          color="primary"
          size="sm"
          icon="fas fa-file-download"
        >
          <q-tooltip>Opções de Exportação</q-tooltip>
          <q-menu class="q-pa-sm">
            <q-list class="text-primary">
              <q-item
                v-close-popup
                dense
                v-for="(opt, idx) in exportOptions"
                :key="idx"
                clickable
                @click="exportFile(opt.filetype, opt.filename)"
              >
                <q-item-section avatar>
                  <q-icon :name="opt.icon" size="xs"></q-icon>
                </q-item-section>
                <q-item-section>
                  {{ opt.label }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <!--Print control-->
        <q-btn
          v-if="!!Printable"
          flat
          round
          color="primary"
          size="sm"
          icon="fas fa-print"
          @click="printData()"
        >
          <q-tooltip>Imprimir</q-tooltip>
        </q-btn>
      </div>

      <!-- Search Field -->
      <div class="col-12 col-md-4">
        <q-input
          v-if="searchableColumns.length > 0"
          dense
          square
          filled
          clearable
          label="Pesquisar na lista"
          v-model="searchTerm"
        >
          <template v-slot:append>
            <q-icon size="xs" name="fas fa-search" color="grey-8" /> </template
        ></q-input>
      </div>
    </div>

    <q-separator></q-separator>

    <!-- Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th
              v-show="
                visibleColumns.includes(column.field) ||
                column.name == 'actions'
              "
              :class="`${dense ? 'q-pa-xs' : 'q-pa-sm'}`"
              v-for="column in columns"
              :key="column.field"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>

        <!-- Ready State -->
        <tbody v-if="state == 'ready'">
          <template v-for="(row, idx) in data" :key="idx">
            <tr v-if="row != 'interval'">
              <td
                v-show="
                  visibleColumns.includes(column.field) ||
                  column.name == 'actions'
                "
                :class="`${dense ? 'q-pa-xs' : 'q-pa-sm'} ${
                  !!column.align ? `text-${column.align}` : ''
                }`"
                v-for="column in columns"
                :key="column.field"
              >
                <!-- td for commoncontent: -->
                <div v-if="column.name != 'actions'">
                  <!-- In case no template is set for the td-->
                  <div v-if="!(`cell-${column.name}` in $slots)">
                    {{ column.format ? column.format(row) : row[column.field] }}
                  </div>

                  <!-- In case a template is set for the td-->
                  <div v-if="`cell-${column.name}` in $slots">
                    <slot :name="`cell-${column.name}`" :data="row"></slot>
                  </div>
                </div>

                <!-- Especial td of actions -->
                <div
                  class="text-center"
                  v-if="column.name == 'actions' && showActions"
                >
                  <q-btn
                    v-if="showActionsBtnInRow(row)"
                    flat
                    dense
                    color="primary"
                    icon="fas fa-ellipsis-v"
                  >
                    <q-tooltip>Ações do registro</q-tooltip>
                    <q-menu>
                      <q-list>
                        <q-item
                          class="text-primary"
                          v-show="
                            typeof a.hide == 'function' ? !a.hide(row) : !a.hide
                          "
                          v-for="(a, idx) in RowActions"
                          :key="idx"
                          clickable
                          v-close-popup
                          @click="a.fn(row)"
                        >
                          <q-item-section v-if="a.icon" side>
                            <q-icon
                              color="primary"
                              size="sm"
                              :name="a.icon"
                            ></q-icon>
                          </q-item-section>
                          <q-item-section>
                            {{ a.label }}
                          </q-item-section>
                          <q-tooltip v-if="a.tooltip">{{
                            a.tooltip
                          }}</q-tooltip>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </td>
            </tr>
            <tr v-else>
              <td
                :colspan="columns.length"
                :class="`${dense ? 'q-pa-xs' : 'q-pa-sm'}`"
              >
                <slot
                  name="interval-row"
                  :data="{
                    previous: data[idx - 1],
                    current: row,
                    next: data[idx + 1],
                  }"
                >
                </slot>
              </td>
            </tr>
          </template>
        </tbody>

        <!-- Error State -->
        <tbody v-if="state == 'error'">
          <tr>
            <td
              class="q-pa-lg text-center text-red-3"
              :colspan="columns.length"
            >
              <div>
                <div>
                  <q-icon size="lg" name="fas fa-bomb"></q-icon>
                </div>
                <div class="text-h6">ERRO!</div>
                <div class="text-caption">
                  <b>{{ error.response.status }}</b>
                  {{ error.response.statusText }}
                </div>
                <small
                  >Favor entrar em contato com o administrador do
                  sistema.</small
                >
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Empty State -->
        <tbody v-if="state == 'empty'">
          <tr>
            <td
              class="q-pa-lg text-center text-grey-8"
              :colspan="columns.length"
            >
              <div>
                <div>
                  <q-icon size="lg" name="far fa-folder-open"></q-icon> *
                </div>
                <div class="text-h6">Lista Vazia.</div>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Loading State -->
        <tbody v-if="state == 'loading'">
          <tr>
            <td
              class="q-pa-lg text-center text-grey-8"
              :colspan="columns.length"
            >
              <div>
                <q-spinner-gears size="lg" />
              </div>
              <div class="text-caption">Carregando...</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";

defineOptions({ name: "ui-gadgets-simpletable" });

const props = defineProps({
  Name: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Object,
    required: true,
  },
  Data: {
    type: Array,
    required: true,
  },
  Columns: {
    type: Object,
    required: true,
  },
  RowActions: Object,
  Export: Object,
  Printable: Boolean,
  dense: Boolean,
  IntervalRule: Function,
  CustomResources: Array,
});

const emit = defineEmits(["update:state", "update:model-value"]);

// Filters related vars:
const searchTerm = ref(null);

// Columns settings:
const visibleColumns = ref([]);
const columns = ref([]);

// Data:
const error = ref(null);

// State:
const loading = ref(false);
const showLoader = ref(false);
const errorState = ref(false);

const data = computed(() => {
  var result = [...props.Data];
  let offset = 0;

  if (searchTerm.value) {
    result = result.filter((row) => {
      for (let i = 0; i < searchableColumns.value.length; i++) {
        let column = searchableColumns.value[i];
        if (
          String(row[column.field])
            .toLowerCase()
            .includes(searchTerm.value.toLowerCase())
        ) {
          return true;
        }
      }
      return false;
    });
  }

  if (!!props.IntervalRule && typeof props.IntervalRule == "function") {
    for (let i = -1; i < result.length; i++) {
      let previous = result[i - 1];
      let current = result[i];
      let next = result[i + 1];

      if (props.IntervalRule(previous, current, next) === true) {
        result.splice(i + 1 + offset, 0, "interval");
        offset++;
      }
    }
  }

  return result;
});

const showActions = computed(() => {
  for (let i = 0; i < props.RowActions.length; i++) {
    let a = props.RowActions[i];
    if (a.hide) {
      if (typeof a.hide == "function") {
        for (let j = 0; j < data.value.length; j++) {
          let row = data.value[j];
          if (!a.hide(row)) return true;
        }
      } else return !a.hide;
    } else return true;
  }

  return false;
});

const columnOptions = computed(() =>
  columns.value
    .map((clm) => {
      return clm.name != "actions"
        ? {
            label: clm.label,
            value: clm.field,
          }
        : null;
    })
    .filter((item) => item != null),
);

const exportOptions = computed(() => {
  var typeIcons = {
    xls: "fas fa-file-excel",
    csv: "fas fa-file-csv",
  };
  var typeLabels = {
    xls: "Exportar XLS",
    csv: "Exportar CSV",
  };

  if (!(props.Export instanceof Array))
    return [
      {
        ...props.Export,
        icon: typeIcons[props.Export.filetype],
        label: typeLabels[props.Export.filetype],
      },
    ];

  return props.Export.map((opt) => ({
    ...opt,
    icon: typeIcons[opt.filetype],
    label: typeLabels[opt.filetype],
  }));
});

const state = computed(() => {
  if (showLoader.value) return "loading";
  if (errorState.value) return "error";
  if (data.value.length > 0) return "ready";
  if (data.value.length == 0) return "empty";
  return null;
});

const searchableColumns = computed(() => {
  var cols = [];
  for (let i = 0; i < columns.value.length; i++) {
    let column = columns.value[i];
    if (!column.field || column.field == "" || column.searchable === false)
      continue;

    cols.push(column);
  }

  return cols;
});

watch(visibleColumns, (newVal) => {
  if (newVal.length < 1) {
    visibleColumns.value = [props.Columns[0].field];
  }

  localStorage.setItem(
    `SimpleTable.${props.Name}.visibleColumns`,
    JSON.stringify(newVal),
  );

  exposeFactory();
});

watch(loading, (isLoading) => {
  showLoader.value = isLoading;
});

watch(state, (v) => {
  emit("update:state", v);
});

// searchTerm(term) {
//   if (!!searchDebounceTimeout) {
//     clearTimeout(searchDebounceTimeout)
//     searchDebounceTimeout = null;
//   }

//   searchDebounceTimeout = setTimeout(() => {
//     var result = {};

//     if (term) {

//     }

//     emit('search', result);
//   }, 200)
// }

function showActionsBtnInRow(row) {
  var show = false;
  for (let i = 0; i < props.RowActions.length; i++) {
    let a = props.RowActions[i];
    if ("hide" in a) {
      if (typeof a.hide == "function") {
        if (!a.hide(row)) {
          show = true;
        }
      } else {
        if (!a.hide) {
          show = true;
        }
      }
    } else show = true;
  }
  return show;
}

function exportFile(filetype, filename) {
  filename = filename.indexOf(`.${filetype}`)
    ? filename
    : `${filename}.${filetype}`;

  var blobType;
  var content;
  switch (filetype) {
    case "xls":
      blobType = "application/vnd.ms-excel;charset=utf-8;";
      content = buildContentTable(data.value);
      break;
    case "csv":
      blobType = "text/csv;charset=utf-8;";
      content = buildCsvContent(data.value);
      break;
  }

  // Encode the content to UTF-8
  const encoder = new TextEncoder();
  const utf8Content = encoder.encode(content);

  // Create a blob with the UTF-8 encoded content
  const blob = new Blob([utf8Content], { type: blobType });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);

  link.style.visibility = "hidden";

  // Adiciona o link ao DOM e dispara o clique
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printData() {
  const content = `${buildContentTable(data.value)}`;

  // Open a new window or tab for printing
  const newWindow = window.open();
  newWindow.document.open();
  newWindow.document.write(content);
  newWindow.document.close();
  newWindow.print();
}

function exposeFactory() {
  emit("update:model-value", {
    loadState: (flag) => (loading.value = flag),
    setError: (err) => {
      error.value = err;
      errorState.value = true;
    },
    visibleColumns: visibleColumns.value,
  });
}

function escapeXml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildContentTable(tableData) {
  // Início do XML
  let content = `
      <?xml version="1.0" encoding="UTF-8"?>
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="this.$getService("toolcase/http")://www.w3.org/TR/REC-html40">
    <head>
      <style>
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid #000;
          padding: 5px;
          text-align: left;
        }
        th {
          background-color: #f4f4f4;
          text-align: center;
        }
      </style>
      <meta this.$getService("toolcase/http")-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>
  <table>
    <thead>
      <tr>
        ${props.Columns.filter((column) =>
          visibleColumns.value.includes(column.field),
        )
          .map((column) => `<th>${escapeXml(column.label)}</th>`)
          .join("")}
      </tr>
    </thead>
    <tbody>
  `;

  // Adiciona as linhas
  for (let j = 0; j < tableData.length; j++) {
    content += "<tr>";
    let row = tableData[j];

    for (let i = 0; i < props.Columns.length; i++) {
      let clm = props.Columns[i];
      if (!visibleColumns.value.includes(clm.field)) continue;
      content += `<td>${
        clm.format
          ? clm.format(row)
          : row[clm.field]
          ? row[clm.field]
          : ""
      }</td>`;
    }
    content += "</tr>";
  }
  // Fecha o XML
  content += `
    </tbody>
  </table>
  `;

  return content;
}

function buildCsvContent(rawdata) {
  // Ensure the data is an array of objects
  if (
    !Array.isArray(rawdata) ||
    !rawdata.length ||
    typeof rawdata[0] !== "object"
  ) {
    console.error("The provided data could not be converted to CSV.");
    return;
  }

  // Extract headers (keys of the first object in the array)
  const headers = props.Columns.filter((column) =>
    visibleColumns.value.includes(column.field),
  ).map((column) => column.label);

  const rows = [];
  for (let j = 0; j < rawdata.length; j++) {
    let row = rawdata[j];
    let rowValues = [];

    for (let i = 0; i < props.Columns.length; i++) {
      let clm = props.Columns[i];
      if (!visibleColumns.value.includes(clm.field)) continue;

      rowValues.push(row[clm.field]);
    }
    rows.push(rowValues);
  }

  // Generate CSV content
  const csvContent = [
    headers.join(";"), // Join headers with commas
    ...rows.map((row) => row.join(";")), // Map each row to CSV string
  ].join("\r\n"); // Separate rows with a newline

  return csvContent;
}

onMounted(() => {
  // Set columns:
  columns.value = [...props.Columns];
  visibleColumns.value =
    JSON.parse(
      localStorage.getItem(`SimpleTable.${props.Name}.visibleColumns`),
    ) ?? props.Columns.map((clm) => clm.field);
  if (props.RowActions && props.RowActions?.length > 0)
    columns.value.push({
      name: "actions",
      label: "Ações",
      align: "center",
      sortable: false,
      filterable: false,
    });

  // Set persisted search term:
  searchTerm.value =
    localStorage.getItem(`SimpleTable.${props.Name}.searchTerm`) ?? null;
});
</script>

<style scoped>
.table-container {
  position: relative;
  overflow-x: scroll;
  width: 100%;
  max-height: 500px;
}

table {
  width: 100%;
  border-collapse: collapse;
  overflow-y: scroll;
}

thead {
  top: 0px;
  position: sticky;
  z-index: 2;
  background-color: white;
}

th {
  white-space: nowrap;
  /* Prevents text from wrapping */
  width: fit-content;
  /* Adjusts width to fit the content */
}

td {
  min-width: 125px;
}

tbody > tr:nth-child(even) {
  background-color: #e2e2e2;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
