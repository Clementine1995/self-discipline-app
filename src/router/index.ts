import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/today',
  },
  {
    path: '/today',
    name: 'today',
    component: () => import('@/pages/TodayPage.vue'),
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('@/pages/TasksPage.vue'),
  },
  {
    path: '/tasks/new',
    name: 'task-new',
    component: () => import('@/pages/HabitEditorPage.vue'),
  },
  {
    path: '/tasks/ai-plan',
    name: 'task-ai-plan',
    component: () => import('@/pages/AiHabitPlanPage.vue'),
  },
  {
    path: '/tasks/:id',
    name: 'task-detail',
    component: () => import('@/pages/HabitDetailPage.vue'),
  },
  {
    path: '/tasks/:id/edit',
    name: 'task-edit',
    component: () => import('@/pages/HabitEditorPage.vue'),
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('@/pages/StatsPage.vue'),
  },
  {
    path: '/review',
    name: 'review',
    component: () => import('@/pages/ReviewPage.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/SettingsPage.vue'),
  },
];

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
