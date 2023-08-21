
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
        path: 'dayCalendar', 
        component: () => import('pages/planner/dayCalendar.vue') //oldie>> daySchedule //scheduleDrag.vue in scratch
      },
      {
        path: 'viewGoals', 
        component: () => import('pages/planner/viewAllGoals.vue')
      },
      {
        path: 'eventSummary',  //this should prolly be the 'weekViewPlanner' instead **todo
        component: () => import('pages/planner/eventTask.vue')
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
