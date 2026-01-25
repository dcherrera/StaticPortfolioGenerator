import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/IndexPage.vue')
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('pages/ProjectsPage.vue')
      },
      {
        path: 'projects/:slug',
        name: 'project',
        component: () => import('pages/ProjectPage.vue')
      },
      {
        path: 'projects/:slug/:post',
        name: 'project-post',
        component: () => import('pages/ProjectPostPage.vue')
      },
      {
        path: 'blog',
        name: 'blog',
        component: () => import('pages/BlogPage.vue')
      },
      {
        path: 'blog/:slug',
        name: 'blog-post',
        component: () => import('pages/BlogPostPage.vue')
      },
      {
        path: ':slug',
        name: 'page',
        component: () => import('pages/StaticPage.vue')
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
