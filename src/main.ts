import type {App as AppType} from 'vue'
import {createApp} from 'vue'
import App from './App.vue'
import router from './routers'
import './rem.ts'
import './config/env.ts'
import 'mapbox-gl/dist/mapbox-gl.css'
import './style.css'


const app = createApp(App)

Object.values(
  import.meta.glob<{ install: (ctx: AppType<Element>) => void }>('./modules/*.ts', {eager: true}),
).forEach((i) => i.install(app))

app.use(router)

app.mount('#app')
