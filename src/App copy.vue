<script setup lang="ts">
import database from './assets/DataBaseHuellaCarbono.json';

import { ref, Ref, computed, reactive, watch, handleError } from 'vue';

const CarritoCookieName = 'CarritoMercadona';
const CookieSelector = 'CookieSelector';

const decimales = 5;
const decimals_separator = ',';
const units_separator = '.';

function setCookie(name: string, value: string, days: number = 30) {
  let expires = '';

  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${value || ''}${expires}; path=/`;
}

function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

function setJsonCookie(name: string, obj: object, days: number = 30) {
  setCookie(name, JSON.stringify(obj), days);
}

function getJsonCookie(name: string): {} | [] {
  let cookie = getCookie(name);
  if (typeof cookie == 'string' && cookie != '') {
    let obj = JSON.parse(cookie);
    if (typeof obj == typeof {} || typeof obj == typeof []) {
      return obj;
    }
  }
  return {};
}

function getCarritoCookie(): {} {
  let cookie = getJsonCookie(CarritoCookieName);
  if (typeof cookie == typeof {}) {
    return cookie;
  }
  return {};
}

function setCarritoCookie(obj: object) {
  setJsonCookie(CarritoCookieName, obj);
}

let data = database as Item[];

const titles: { [param: string]: string } = {
  scope: 'Scope',
  level1: 'Level 1',
  level2: 'Level 2',
  level3: 'Level 3',
  level4: 'Level 4',
  ColumnText: 'Descripción',
  UOM: 'UOM',
  year: 'Año',
};

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

let tmpSelector: object = getJsonCookie(CookieSelector) as object;

const reactiveData = reactive({
  ...{
    scope: '',
    level1: '',
    level2: '',
    level3: '',
    level4: '',
    ColumnText: '',
    UOM: '',
    year: '',
  },
  ...tmpSelector,
});

watch(reactiveData, (o, n) => {
  setJsonCookie(CookieSelector, n);
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

type itemCarrito = {
  id: string;
  year: string;
  ghg: string;
  value: number;
  description: string;
};

const carrito: { [id: string]: itemCarrito } = reactive(getCarritoCookie());

watch(carrito, (o, n) => {
  setCarritoCookie(n);
});

function anadir(item: Item | undefined, ghg: string) {
  if (typeof item != 'undefined') {
    let ic: itemCarrito = {
      id: item.id,
      value: value.value,
      year: reactiveData.year,
      ghg,
      description: description.value,
    };
    carrito[Date.now() + '-' + Math.random()] = ic;
    setCarritoCookie(carrito);
    console.log(ic);
  }
}

function get_item_by_id(id: string): Item | undefined {
  return data.find((i) => i.id == id);
}

function get_ghgs_by_id(id: string, year: string): string[] {
  let item = get_item_by_id(id);
  if (typeof item != 'undefined') {
    return Object.keys(item.GHG[year]);
  }
  return [];
}

function get_years_by_id(id: string): string[] {
  let item = get_item_by_id(id);
  if (typeof item != 'undefined') {
    return Object.keys(item.GHG);
  }
  return [];
}

function get_ghg_value(id: string, ghg: string, year: string): number {
  let itemValue = get_item_by_id(id);
  if (typeof itemValue != 'undefined') {
    return parseFloat(itemValue.GHG[year][ghg]);
  }
  return 0;
}

function EliminarCampo(id: string) {
  if (typeof carrito[id] != 'undefined') {
    delete carrito[id];
    setCarritoCookie(carrito);
  }
}

function dataFilter(filter: string): string[] {
  let filters: string[] = [];

  let hasEmptyValue = false;

  data.map((row) => {
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

const value: Ref<number> = ref(0);
const description: Ref<string> = ref('');

const currentItem = computed(() => {
  let datos = data.find((r) => {
    return conditionData.year(r);
  });
  return datos;
});

const valuesGhg = computed(() => {
  let ghgs: { [ghg: string]: string } = {};

  let datos = currentItem;

  if (typeof datos != 'undefined') {
    ghgs = datos.value?.GHG[reactiveData.year] || {};
  }

  return ghgs;
});

function fixDecimals(value: number): number {
  return Math.round(value * Math.pow(10, decimales)) / Math.pow(10, decimales);
}
function calculo(ghgValue: string | number, value: number): number {
  ghgValue = typeof ghgValue == 'string' ? parseFloat(ghgValue) : ghgValue;
  return fixDecimals(ghgValue * value);
}

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
    parts[1] = parts[1].padEnd(decimales, '0');
  }
  return parts.join(decimals_separator);
}

const carrito_scoped = computed(() => {
  let resultado: { [scope: string]: { [id: string]: itemCarrito } } = {};
  let orderedResultado: { [scope: string]: { [id: string]: itemCarrito } } = {};

  let idsCarrito = Object.keys(carrito);

  for (let i = 0; i < idsCarrito.length; i++) {
    let id_carrito = idsCarrito[i];
    let item_carrito = carrito[id_carrito];
    let item = get_item_by_id(item_carrito.id);
    if (item) {
      if (typeof resultado[item.scope] == 'undefined') {
        resultado[item.scope] = {};
      }
      resultado[item.scope][id_carrito] = item_carrito;
    }
  }

  let scopes = Object.keys(resultado).sort((a: string, b: string) => {
    if (
      !a.toLowerCase().startsWith('outside') ||
      !b.toLowerCase().startsWith('outside')
    ) {
      if (a.toLowerCase().startsWith('outside')) {
        return 1;
      } else if (b.toLowerCase().startsWith('outside')) {
        return -1;
      }
    }

    if (a < b) {
      return -1;
    }
    return 1;
  });

  for (let i = 0; i < scopes.length; i++) {
    let scope = scopes[i];
    orderedResultado[scope] = resultado[scope];
  }
  return orderedResultado;
});
</script>

<!-- HTML -->

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">Huella de carbono</a>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarColor01"
        aria-controls="navbarColor01"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarColor01">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a class="nav-link active" href=""
              >Calculadora
              <span class="visually-hidden">(current)</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link active" href="#"
              >Tablas
              <span class="visually-hidden">(current)</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link active" href="#"
              >Graficos
              <span class="visually-hidden">(current)</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <div>
    <ul>
      <li
        class="d-flex justify-content-between align-items-center"
        v-for="(ic, icid) in carrito"
        :key="icid"
      ></li>
    </ul>
  </div>

  <!-- <ul class="nav nav-tabs" role="tablist">
    <li class="nav-item" role="presentation">
      <a class="nav-link active" data-bs-toggle="tab" href="#home" aria-selected="true" role="tab">14064 [2022] (UK)</a>
    </li>
    <li class="nav-item" role="presentation">
      <a class="nav-link" data-bs-toggle="tab" href="#profile" aria-selected="false" tabindex="-1" role="tab">14064
        [2021] (UK)</a>
    </li>
    <li class="nav-item" role="presentation">
      <a class="nav-link disabled" href="#" aria-selected="false" tabindex="-1" role="tab">Disabled</a>
    </li>
    <li class="nav-item dropdown">
      <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-haspopup="true"
        aria-expanded="false">Dropdown</a>
      <div class="dropdown-menu">
        <a class="dropdown-item" href="#">Action</a>
        <a class="dropdown-item" href="#">Another action</a>
        <a class="dropdown-item" href="#">Something else here</a>
        <div class="dropdown-divider"></div>
        <a class="dropdown-item" href="#">Separated link</a>
      </div>
    </li>
  </ul>
  <div id="myTabContent" class="tab-content">
    <div class="tab-pane fade show active" id="home" role="tabpanel">
      <p>Raw denim you probably haven't heard of them jean shorts Austin. Nesciunt tofu stumptown aliqua, retro synth
        master cleanse. Mustache cliche tempor, williamsburg carles vegan helvetica. Reprehenderit butcher retro
        keffiyeh dreamcatcher synth. Cosby sweater eu banh mi, qui irure terry richardson ex squid. Aliquip placeat
        salvia cillum iphone. Seitan aliquip quis cardigan american apparel, butcher voluptate nisi qui.</p>
    </div>
    <div class="tab-pane fade" id="profile" role="tabpanel">
      <p>Food truck fixie locavore, accusamus mcsweeney's marfa nulla single-origin coffee squid. Exercitation +1 labore
        velit, blog sartorial PBR leggings next level wes anderson artisan four loko farm-to-table craft beer twee. Qui
        photo booth letterpress, commodo enim craft beer mlkshk aliquip jean shorts ullamco ad vinyl cillum PBR. Homo
        nostrud organic, assumenda labore aesthetic magna delectus mollit.</p>
    </div>
    <div class="tab-pane fade" id="dropdown1">
      <p>Etsy mixtape wayfarers, ethical wes anderson tofu before they sold out mcsweeney's organic lomo retro fanny
        pack lo-fi farm-to-table readymade. Messenger bag gentrify pitchfork tattooed craft beer, iphone skateboard
        locavore carles etsy salvia banksy hoodie helvetica. DIY synth PBR banksy irony. Leggings gentrify squid 8-bit
        cred pitchfork.</p>
    </div>
    <div class="tab-pane fade" id="dropdown2">
      <p>Trust fund seitan letterpress, keytar raw denim keffiyeh etsy art party before they sold out master cleanse
        gluten-free squid scenester freegan cosby sweater. Fanny pack portland seitan DIY, art party locavore wolf
        cliche high life echo park Austin. Cred vinyl keffiyeh DIY salvia PBR, banh mi before they sold out
        farm-to-table VHS viral locavore cosby sweater.</p>
    </div>
  </div> -->

  <!-- TABLA -->

  <div>
    <table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th>Valor introducido</th>
          <th>GHG</th>
          <th>Año</th>
          <th>Valor convertido</th>
          <th style="border-top: 0; border-right: 0"></th>
        </tr>
      </thead>
      <tbody v-for="(scope_carrito, scope) in carrito_scoped" :key="scope">
        <tr>
          <th colspan="6">{{ scope }}</th>
        </tr>
        <tr v-for="(ic, icid) in scope_carrito" :key="icid">
          <td><input type="text" v-model="ic.description" /></td>
          <td><input type="number" v-model="ic.value" /></td>
          <td>
            <select class="form-select" v-model="ic.ghg">
              <option v-for="val in get_ghgs_by_id(ic.id, ic.year)" :key="val">
                {{ val }}
              </option>
            </select>
          </td>
          <td>
            <select class="form-select" v-model="ic.year">
              <option v-for="val in get_years_by_id(ic.id)" :key="val">
                {{ val }}
              </option>
            </select>
          </td>
          <td>
            {{
              formatDecimals(
                calculo(get_ghg_value(ic.id, ic.ghg, ic.year), ic.value)
              )
            }}
          </td>
          <td>
            <button @click="EliminarCampo(icid as string)">BORRAR</button>
          </td>
        </tr>
        <tr>
          <th colspan="4">Total {{ scope }}</th>
          <td>
            {{
              formatDecimals(
                fixDecimals(
                  Object.values(scope_carrito)
                    .map((ic) =>
                      calculo(get_ghg_value(ic.id, ic.ghg, ic.year), ic.value)
                    )
                    .reduce((a, b) => a + b, 0)
                )
              )
            }}
          </td>
          <td></td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th colspan="4">Total</th>
          <td>
            {{
              formatDecimals(
                fixDecimals(
                  Object.values(carrito)
                    .map((ic) =>
                      calculo(get_ghg_value(ic.id, ic.ghg, ic.year), ic.value)
                    )
                    .reduce((a, b) => a + b, 0)
                )
              )
            }}
          </td>
          <td style="border-bottom: 0 !important; border-right: 0"></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- CALCULADORA -->

  <div class="d-flex">
    <div class="form-group" v-for="(reactiveVar, reactiveKey) in reactiveData">
      <label class="form-label mt-4">{{ titles[reactiveKey] }}</label>
      <select
        class="form-select"
        v-model="reactiveData[reactiveKey]"
        :key="reactiveKey"
      >
        <option v-for="val in dataFilter(reactiveKey)" :key="val" :value="val">
          {{ val || '(Vacio)' }}
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
          {{ formatDecimals(calculo(ghgValue, parseFloat(value.toString()))) }}
          <button
            type="button"
            class="btn btn-info"
            @click="anadir(currentItem, ghgKey.toString())"
          >
            Seleccionar
          </button>
        </li>
      </ul>
    </div>
    <div></div>
  </div>
</template>

<!-- CSS -->

<style scoped>
th,
td {
  border: 1px solid black;
}
</style>
