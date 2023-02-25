// @ts-check
import { defineStore, acceptHMRUpdate } from 'pinia';

export const cartItemsStore = defineStore({
  id: '',
  state: () => ({
    items: {
      item: {
        id: 1,
        year: '2023',
        ghg: 'GHG',
        value: 0,
        description: 'Description',
      },
    } as { [key: number]: { id: number; name: string } },
  }),
  actions: {
    addItem(item = { id: 1, name: 'Item 1' }) {
      this.items[item.id] = item;
    },
    removeItem(item = { id: 1, name: 'Item 1' }) {
      delete this.items[item.id];
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(cartItemsStore, import.meta.hot));
}
