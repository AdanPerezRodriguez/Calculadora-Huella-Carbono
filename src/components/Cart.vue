<script setup lang="ts">
import { Cookiestorage } from '../lib/CookiesStorage';
import { ref, Ref, computed, reactive, watch } from 'vue';
import { cartItemsStore } from '../stores/cartItems';
import { menuStore } from '../stores/menuItems';

const storage = new Cookiestorage();
const cartDataCookie = 'carritoData';
const cookieFormData = storage.getJson(cartDataCookie);
const reactiveCarritoCookie = 'calculadoraReactiveData';
const cookieReactiveData: {} = storage.getJson(reactiveCarritoCookie);

const cartItems = cartItemsStore();
const menuItem = menuStore();

//* Maybe this is not needed
let id_carrito = menuItem.data_year + menuItem.lang + menuItem.isos;
id_carrito = id_carrito.split('').reverse().join('') + 'EBV';
//* Maybe this is not needed


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

type itemCarrito = {
  id: string;
  year: string;
  ghg: string;
  value: number;
  description: string;
};

const carrito: { [id: string]: itemCarrito } = reactive({});

watch(carrito, (o, n) => {});

function addItem(item: Item | undefined, ghg: string) {
  if (typeof item != 'undefined') {
    let ic: itemCarrito = {
      id: item.id,
      value: 0,
      year: '1234',
      ghg,
      description: '',
    };
    carrito[Date.now() + '-' + Math.random()] = ic;
  }
}

function removeIem(id: string) {
  delete carrito[id];
}

function updateItem(id: string, value: number) {
  carrito[id].value = value;
}

function deleteC(id: string) {
  if (typeof carrito[id] != 'undefined') {
    delete carrito[id];
  }
}

function get_item_by_id(id: string): Item | undefined {
  return undefined;
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
<template></template>
<style scoped></style>
