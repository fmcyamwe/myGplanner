
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '', 
        component: () => import('pages/IndexPage.vue')
      },
      {
        path: 'mymangas', //no need for /slash
        component: () => import('pages/MangaPage.vue'), //using lazy-loading 
      },
      {
        path: 'testy',
        component: () => import('pages/testyPlanner.vue'),
      },
      {
        path: 'dragga',
        component: () => import('components/aDragga.vue'), ////testGoal
      }
      /*{
        path: 'pinia',
        component: () => import('components/piniaGoal.vue'),
      }
      {
        path: 'calendar',
        component: () => import('pages/calendarPage.vue'),
      },
      */
    ]
  },
  {
    path: '/planner',
    component: () => import('layouts/PlannerLayout.vue'),
    children: [
      {
        path: '', 
        component: () => import('pages/planner/weekViewPlanner.vue')
      },
      {
        path: 'scheduleDrag', 
        component: () => import('pages/planner/scheduleDrag.vue')
      },
      /*{
        path: 'schedule', //'testAgenda'
        component: () => import('pages/planner/daySlot.vue') //planner/agendaTest.vue and scheduleTest.vue in scratch now
      },*/
      {
        path: 'addGoal', 
        component: () => import('components/planner/addGoalDialog.vue') //pages/planner
      },
      {
        path: 'viewGoals', 
        component: () => import('pages/planner/viewAllGoals.vue')
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
