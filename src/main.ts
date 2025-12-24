import { createApp } from 'vue';
import './styles/tailwind.css';
import App from './App.vue';
import router from './router';
import pinia from './stores';
import vSizeOb from './directives/sizeObserver';

const app = createApp(App);

app.use(pinia);
app.use(router);
app.directive('size-ob', vSizeOb);
app.mount('#app');
