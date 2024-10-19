//original file moved in scratch files for reference...

const routes = [
    { //..loaded-on demand below for faster loading!
      path: '/',
      component: () => import('layouts/PlannerLayout.vue'),
      children: [
        { path: '', component: () => import('pages/planner/homeWeekView.vue') }, //weekCalendar
        { path: 'summary', component: () => import('pages/planner/summaryView.vue') }, //summaryCalendar
        //{ path: 'dayCalendar', component: () => import('pages/planner/dayView.vue') }, //dayCalendar
        { path: 'goalsPage', component: () => import('pages/planner/goalsView.vue') }, //goalsPage
        { path: 'dayCalendar', component: () => import('pages/planner/altDayView.vue') } //refactor of dayCalendar >>testAlt
        //{ path: 'draggy', component: aDragga }
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
  