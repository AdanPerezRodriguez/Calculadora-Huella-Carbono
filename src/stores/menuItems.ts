// @ts-check
import { defineStore, acceptHMRUpdate } from 'pinia';
import esLang from '../assets/es.lang.json';
import enLang from '../assets/en.lang.json';

const langs = {
  ES: esLang as { [key: string]: string },
  UK: enLang as { [key: string]: string },
};

export const menuStore = defineStore({
  id: '',
  state: () => ({
    data_year: '',
    lang: 'UK',
    isos: '27001',
  }),
  actions: {
    translate(key: string) {
      if (typeof this.lang !== 'undefined') {
        if (
          typeof langs[this.lang as keyof typeof langs][key] !== 'undefined'
        ) {
          return langs[this.lang as keyof typeof langs][key];
        }
      }

      return {};
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(menuStore, import.meta.hot));
}
