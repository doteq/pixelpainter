import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import panZoom from 'panzoom';
import VuePanZoom from 'vue-panzoom/src/components/pan-zoom/component.vue';

Vue.prototype.$panZoom = panZoom; //this is very important
Vue.component('VuePanZoom', VuePanZoom);

Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
