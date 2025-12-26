import { createApp } from 'vue';
import './styles/tailwind.css';
import './assets/icon/index.js'; // IconPark 图标库
import App from './App.vue';
import router from './router';
import pinia from './stores';
import vSizeOb from './directives/sizeObserver';
import vIntersectOb from './directives/intersectObserver';

const app = createApp(App);

app.use(pinia);
app.use(router);
app.directive('size-ob', vSizeOb);
app.directive('intersect-ob', vIntersectOb);
app.mount('#app');
