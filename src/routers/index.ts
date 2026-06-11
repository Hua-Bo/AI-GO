import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/map',
  },
  {
    path: '/map',
    component: () => import('@/views/mapbox.vue'),
  },
  {
    path: '/map3d',
    component: () => import('@/views/map3d/cesium.vue'),
  },
  {
    path: '/computedColorArr',
    component: () => import('@/views/computedColorArr/index.vue'),
  },
  {
    path: '/test1',
    component: () => import('@/views/testDemo/test1.vue'),
  },
  {
    path: '/test2',
    component: () => import('@/views/testDemo/test2.vue'),
  },
  {
    path: '/test3',
    component: () => import('@/views/testDemo/test3.vue'),
  },
  {
    path: '/test4',
    component: () => import('@/views/testDemo/test4.vue'),
  },
  {
    path: '/test5',
    component: () => import('@/views/testDemo/test5.vue'),
  },
  {
    path: '/test6',
    component: () => import('@/views/testDemo/test6.vue'),
  },
  {
    path: '/test7',
    component: () => import('@/views/testDemo/test7.vue'),
  },
  {
    path: '/test8',
    component: () => import('@/views/testDemo/test8.vue'),
  },
  {
    path: '/test9',
    component: () => import('@/views/testDemo/test9.vue'),
  },
  {
    path: '/test10',
    component: () => import('@/views/testDemo/test10.vue'),
  },
  {
    path: '/test11',
    component: () => import('@/views/testDemo/test11.vue'),
  },
  {
    path: '/test12',
    component: () => import('@/views/testDemo/test12.vue'),
  },
  {
    path: '/test13',
    component: () => import('@/views/testDemo/test13.vue'),
  },
  {
    path: '/test14',
    component: () => import('@/views/testDemo/test14.vue'),
  },
  {
    path: '/test15',
    component: () => import('@/views/testDemo/test15.vue'),
  },
  {
    path: '/test16',
    component: () => import('@/views/testDemo/test16.vue'),
  },
  {
    path: '/test17',
    component: () => import('@/views/testDemo/test17.vue'),
  },
  {
    path: '/test18',
    component: () => import('@/views/testDemo/test18.vue'),
  },
  {
    path: '/test19',
    component: () => import('@/views/testDemo/test19.vue'),
  },
  {
    path: '/test20',
    component: () => import('@/views/testDemo/test20.vue'),
  },
  {
    path: '/test21',
    component: () => import('@/views/testDemo/test21.vue'),
  },
  {
    path: '/test22',
    component: () => import('@/views/testDemo/test22.vue'),
  },
  {
    path: '/test23',
    component: () => import('@/views/testDemo/test23.vue'),
  },
  {
    path: '/test24',
    component: () => import('@/views/testDemo/test24.vue'),
  },
  {
    path: '/test25',
    component: () => import('@/views/testDemo/test25.vue'),
  },
  {
    path: '/test26',
    component: () => import('@/views/testDemo/test26.vue'),
  },
  {
    path: '/ncwms',
    redirect: '/test26',
  },
  {
    path: '/test27',
    component: () => import('@/views/testDemo/test27.vue'),
  },
  {
    path: '/argo',
    redirect: '/test27',
  },
  {
    path: '/rain',
    component: () => import('@/views/rain/index.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from) => {
  if (to.path !== from.path) NProgress.start()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
