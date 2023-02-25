import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "bootstrap";
import "bootswatch/dist/pulse/bootstrap.min.css";
import "./style.css";

createApp(App).use(createPinia()).mount("#app");
