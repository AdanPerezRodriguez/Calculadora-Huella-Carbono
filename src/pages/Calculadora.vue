<script setup lang="ts">
import { Cookiestorage } from '../lib/CookiesStorage';
import { ref, Ref, computed, reactive, watch } from 'vue';
import database from '../assets/DataBaseHuellaCarbono.json';
import { menuStore } from '../stores/menuItems';
import enLang from '../assets/en.lang.json';
import esLang from '../assets/es.lang.json';

const year_store = menuStore();

const langs = {
  ES: esLang as { [key: string]: string },
  UK: enLang as { [key: string]: string },
};

const storage = new Cookiestorage();
const formDataCookie = 'calculadoraFormData';
const reactiveDataCookie = 'tablita';
const cookieFormData = storage.getJson(formDataCookie);
const cookieReactiveData: {} = storage.getJson(reactiveDataCookie);
const recursive_year = true;

const data = database as Item[];

const this_year = new Date().getFullYear();
const this_language = ['UK', 'ES'];
const this_iso = ['Clea', '27001'];

const formData = reactive({
  ...{
    year: this_year,
    yearFilter: '',
    language: this_language[0],
    languageFilter: '',
    iso: this_iso[0],
    isoFilter: '',
  },
  ...cookieFormData,
});

year_store.data_year = formData.year.toString();

const currentLang = computed(() => {
  return langs[formData.language as keyof typeof langs] as {
    [key: string]: string;
  };
});

function _t(key: string) {
  if (typeof currentLang.value[key] !== 'undefined') {
    return currentLang.value[key];
  }
  return key;
}

type Item = {
  id: string;
  scope: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  ColumnText: string;
  UOM: string;
  GHG: {
    [year: string]: {
      [ghg: string]: string;
    };
  };
};

//* Calculadora
const titles: { [param: string]: string } = {
  scope: 'Scope',
  level1: 'Level 1',
  level2: 'Level 2',
  level3: 'Level 3',
  level4: 'Level 4',
  ColumnText: 'Descripción',
  UOM: 'UOM',
};

const valuesGhg = computed(() => {
  let ghgs: { [ghg: string]: string } = {};

  let datos = currentItem;

  if (typeof datos != 'undefined') {
    ghgs = datos.value?.GHG[formData.year] || {};
  }

  return ghgs;
});

const decimals = 5;
const decimals_separator = ',';
const units_separator = '.';

function fixDecimals(value: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
function calculo(ghgValue: string | number, value: number): number {
  ghgValue = typeof ghgValue == 'string' ? parseFloat(ghgValue) : ghgValue;
  return fixDecimals(ghgValue * value);
}

const data_base_filtered = computed(() => {
  let filt_data = data;
  if (recursive_year) {
    filt_data = JSON.parse(JSON.stringify(filt_data));
    filt_data = filt_data.map((r) => {
      let y = formData.year;
      let ys = Object.keys(r.GHG)
        .map((y) => parseInt(y))
        .sort();
      if (!ys.includes(y) && ys.length > 0 && ys[0] < y) {
        let ty = 0;
        let typ = 0;
        while (ys[typ] < y) {
          ty = ys[typ];
          typ++;
        }
        r.GHG[y.toString()] = r.GHG[ty.toString()];
      }
      return r;
    });
  }

  filt_data = filt_data.filter((r) => {
    let y = formData.year.toString();
    let ys = Object.keys(r.GHG);
    return ys.includes(y);
  });

  return filt_data;
});

function formatDecimals(value: number): string {
  let parts = value.toString().split('.');
  parts[0] =
    parts[0]
      .split('')
      .reverse()
      .join('')
      .match(/.{1,3}/g)
      ?.join(units_separator)
      .split('')
      .reverse()
      .join('') ?? '0';
  //parts[0] = parts[0].match(/.{1,3}/g)?.join('.') ?? "0";

  if (parts[1]) {
    parts[1] = parts[1].padEnd(decimals, '0');
  }
  return parts.join(decimals_separator);
}

const value: Ref<number> = ref(0);
const description: Ref<string> = ref('');

const currentItem = computed(() => {
  let datos = data_base_filtered.value.find((r) => {
    return conditionData.year(r);
  });
  return datos;
});

const reactiveData = reactive({
  ...{
    scope: '',
    level1: '',
    level2: '',
    level3: '',
    level4: '',
    ColumnText: '',
    UOM: '',
  },
  ...cookieReactiveData,
});

const conditionData = {
  scope: (row: Item) => {
    return true;
  },
  level1: (row: Item) => {
    return reactiveData.scope == row.scope;
  },
  level2: (row: Item) => {
    return conditionData.generic(row, 'level1');
  },
  level3: (row: Item) => {
    return conditionData.generic(row, 'level2');
  },
  level4: (row: Item) => {
    return conditionData.generic(row, 'level3');
  },
  ColumnText: (row: Item) => {
    return conditionData.generic(row, 'level4');
  },
  UOM: (row: Item) => {
    return conditionData.generic(row, 'ColumnText');
  },
  year: (row: Item) => {
    return conditionData.generic(row, 'UOM');
  },
  generic: (row: Item, condition: string = 'scope') => {
    let conditionCB = conditionData[condition as keyof typeof conditionData];
    let reactiveValue = reactiveData[condition as keyof typeof reactiveData];
    let rowValue = row[condition as keyof Item];
    if (conditionCB(row) && reactiveValue == rowValue) {
      return true;
    }
    return false;
  },
};

function dataFilter(filter: string): string[] {
  let filters: string[] = [];

  let hasEmptyValue = false;

  data_base_filtered.value.map((row) => {
    let cb: CallableFunction =
      conditionData[filter as keyof typeof conditionData];
    let filterValues: string[] = [];
    if (filter == 'year') {
      filterValues = Object.keys(row.GHG);
    } else {
      filterValues = [row[filter as keyof Item] as string];
    }
    for (let i = 0; i < filterValues.length; i++) {
      let filterValue = filterValues[i];
      if (cb(row) && !filters.includes(filterValue)) {
        if (filterValue === '') {
          hasEmptyValue = true;
        }

        filters.push(filterValue);
      }
    }
  });

  if (!filters.includes(reactiveData[filter as keyof typeof reactiveData])) {
    reactiveData[filter as keyof typeof reactiveData] = '';
  }
  return filters;
}

//? Finish Calculadora

const years = computed(() => {
  let years: number[] = [];
  for (let i = this_year; i > 2015; i--) {
    years.push(i);
  }
  years = years.filter((y) => y.toString().includes(formData.yearFilter));
  return years;
});

const languages = computed(() => {
  let languages: string[] = [];
  for (let i = 0; i < this_language.length; i++) {
    languages.push(this_language[i]);
  }
  languages = languages.filter((l) =>
    l.toString().includes(formData.languageFilter.toUpperCase())
  );
  return languages;
});

const isos = computed(() => {
  let isos: string[] = [];
  for (let i = 0; i < this_iso.length; i++) {
    isos.push(this_iso[i]);
  }
  isos = isos.filter((is) =>
    is.toString().includes(formData.isoFilter.toUpperCase())
  );
  return isos;
});

watch(formData, (n, o) => {
  storage.setJson(formDataCookie, n);
  year_store.data_year = n.year.toString();
});

watch(reactiveData, (n, o) => {
  storage.setJson(reactiveDataCookie, n);
});
</script>

<template>
  <div class="container p-2">
    <div
      class="btn-group"
      role="group"
      aria-label="Button group with nested dropdown"
    >
      <!-- Year Button -->
      <div class="btn-group" role="group">
        <button
          id="btnGroupDrop1"
          type="button"
          class="btn btn-primary dropdown-toggle"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          {{ formData.year }}
        </button>

        <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
          <div class="dropdown-item">
            <input type="search" v-model="formData.yearFilter" />
          </div>
          <div
            class="dropdown-item"
            v-for="y of years"
            @click="formData.year = y"
            :key="y"
          >
            {{ y }}
          </div>
        </div>
      </div>

      <!-- Language Button -->
      <div
        class="btn-group language-button"
        :class="formData.language.toLowerCase()"
        role="group"
      >
        <button
          id="btnGroupDrop1"
          type="button"
          class="btn btn-primary dropdown-toggle"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <img
            :src="
              '../assets/imgs/flags/' +
              formData.language.toLowerCase().trim() +
              '.png'
            "
            class="flag"
            alt=""
          />

          {{ formData.language }}
        </button>

        <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
          <div class="dropdown-item">
            <input type="search" v-model="formData.languageFilter" />
          </div>
          <div
            class="dropdown-item"
            v-for="l of languages"
            :key="l"
            :class="[l.toLowerCase(), 'd-flex', 'align-items-center']"
            @click="formData.language = l"
          >
            <img
              :src="'../assets/imgs/flags/' + l.toLowerCase() + '.png'"
              class="flag"
              alt=""
            />

            {{ l }}
          </div>
        </div>
      </div>

      <!-- ISO Button -->
      <div class="btn-group" role="group">
        <button
          id="btnGroupDrop1"
          type="button"
          class="btn btn-primary dropdown-toggle"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          {{ formData.iso }}
        </button>

        <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
          <div class="dropdown-item">
            <input type="search" v-model="formData.isoFilter" />
          </div>
          <div
            class="dropdown-item"
            v-for="i of isos"
            @click="formData.iso = i"
            :key="i"
          >
            {{ i }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="container p-2">
    <div class="row">
      <div class="col-12">
        <h1>Calculadora de Huella de Carbono</h1>
      </div>
    </div>
  </div>

  <!-- Calculadora -->
  <div class="container p-3">
    <div class="d-flex">
      <div
        class="form-group"
        v-for="(reactiveVar, reactiveKey) in reactiveData"
      >
        <label class="form-label mt-4">{{ titles[reactiveKey] }}</label>
        <select
          class="form-select"
          v-model="reactiveData[reactiveKey]"
          :key="reactiveKey"
        >
          <option
            v-for="val in dataFilter(reactiveKey)"
            :key="val"
            :value="val"
          >
            {{ _t(val) || '(Vacio)' }}
          </option>
        </select>
      </div>
    </div>
    <div>
      <div>
        <input
          class="form-control"
          type="number"
          v-model="value"
          placeholder="Introduce un valor"
        />

        <input
          class="form-control"
          type="text"
          v-model="description"
          placeholder="Introduce una descripción"
        />

        <ul class="list-group">
          <li
            class="list-group-item d-flex justify-content-between align-items-center"
            v-for="(ghgValue, ghgKey) in valuesGhg"
            :key="ghgKey"
          >
            <b>{{ ghgKey }}</b
            >:
            {{
              formatDecimals(calculo(ghgValue, parseFloat(value.toString())))
            }}
            <button type="button" class="btn btn-info">Seleccionar</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
img.flag {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}

.dropdown-item {
  cursor: pointer;
}
</style>
