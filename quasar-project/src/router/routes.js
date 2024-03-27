
const routes = [
  /*{
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
      //{
      //  path: 'pinia',
      //  component: () => import('components/piniaGoal.vue'),
      //}
      //{
      // path: 'calendar',
      //  component: () => import('pages/calendarPage.vue'),
      //},
    ]
  },*/
  {
    path: '/', // oldie >> /planner
    component: () => import('layouts/PlannerLayout.vue'),
    children: [
      /*{
        path: '', 
        component: () => import('pages/planner/weekCalendar.vue') //oldie >>pages/planner/weekViewPlanner.vue
      },*/
      {
        path: '',
        component: () => import('pages/planner/homeWeekView.vue') //oldie >>pages/planner/weekViewPlanner.vue
      },
      {
        path: 'summary', 
        component: () => import('pages/planner/summaryView.vue')
      },
      {
        path: 'dayCalendar', 
        component: () => import('pages/planner/dayView.vue') //oldie>> daySchedule //scheduleDrag.vue in scratch
      },
      {
        path: 'viewGoals', 
        component: () => import('pages/planner/goalForm.vue')
      }
      /*{
        path: 'eventSummary',
        component: () => import('pages/planner/eventTask.vue')
      }*/    
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
