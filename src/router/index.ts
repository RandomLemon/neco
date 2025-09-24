import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'neco',
      redirect: '/lobby',
      component: () => import('../views/HomeView.vue'),
      children: [
        {
          path: '/lobby',
          name: 'lobby',
          component: () => import('../views/Lobby/LobbyView.vue'),
          meta: { title: 'NMO' },
        },
        {
          path: '/list',
          name: 'list',
          component: () => import('../views/List/ListView.vue'),
          meta: { title: 'NMO | 服务器列表' },
        },
        {
          path: '/activity',
          name: 'activity',
          component: () => import('../views/Activity/ActivityView.vue'),
          meta: { title: 'NMO | 活动列表' },
        },
        {
          path: '/news',
          name: 'news',
          component: () => import('../views/News/NewsView.vue'),
          meta: { title: 'NMO | 新闻' },
        },
        {
          path: '/news/detail/:id',
          name: 'news detail',
          component: () => import('../views/News/NewsDetail.vue'),
          meta: { title: 'NMO | 新闻详情' },
        },
        {
          path: '/about',
          name: 'about',
          component: () => import('../views/About/AboutView.vue'),
          meta: { title: 'NMO | 关于' },
        },
        {
          path: '/documents',
          name: 'documents',
          component: () => import('../views/Documents/DocumentsView.vue'),
          meta: { title: 'NMO | 文档' },
        },
      ],
    },
    {
      path: '/management',
      name: 'management',
      component: () => import('../views/Management/ManagementView.vue'),
      meta: { title: 'Neco管理' },
      children: [
        {
          path: '/management/user',
          name: 'user management',
          component: () => import('../views/Management/Components/UserManagementView.vue'),
          meta: { title: 'NMO | 用户管理' },
        },
        {
          path: '/management/club',
          name: 'club management',
          component: () => import('../views/Management/Components/ClubManagementView.vue'),
          meta: { title: 'NMO | 社团管理' },
        },
        {
          path: '/management/server',
          name: 'server management',
          component: () => import('../views/Management/Components/ServerManagementView.vue'),
          meta: { title: 'NMO | 服务器管理' },
        },
        {
          path: '/management/news',
          name: 'news management',
          component: () => import('../views/Management/Components/NewsManagementView.vue'),
          meta: { title: 'NMO | 文章管理' },
        },
      ],
    },
    {
      path: '/auth/login',
      name: 'Login',
      component: () => import('../views/Auth/LoginView.vue'),
      meta: { title: 'NMO | 登录' },
    },
    {
      path: '/404',
      name: 'NotFound',
      component: () => import('../views/NotFound.vue'),
      meta: { title: 'NMO | 404' },
    },
    {
      path: '/:catchAll(.*)*',
      redirect: '/404',
    },
  ],
})

router.beforeEach((to, _, next) => {
  if (to.meta.title) {
    document.title = String(to.meta.title)
  }

  next()
})

export { router }
