import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router'
import routes from './routes'

const createHistory = import.meta.env.SSR ? createMemoryHistory : createWebHistory

const Router = createRouter({
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes,
  history: createHistory(import.meta.env.VUE_ROUTER_BASE)
})

export default Router
