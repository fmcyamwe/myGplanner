import PlannerLayout from 'layouts/PlannerLayout.vue'
import weekCalendar from 'pages/planner/homeWeekView.vue'
import summaryCalendar from 'pages/planner/summaryView.vue'
import dayCalendar from 'pages/planner/dayView.vue'
import addGoalForm from 'pages/planner/goalForm.vue'
//import aDragga from 'components/aDragga.vue'

const routes = [
  {
    path : '/',
    component: PlannerLayout,
    children: [
      { path: '', component: weekCalendar },
      { path: 'summary', component: summaryCalendar },
      { path: 'dayCalendar', component: dayCalendar },
      { path: 'viewGoals', component: addGoalForm }
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


//const routes = [
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
  }, 
  //the below is the lazy-loading which might be adding overhead---trying immediatefile load above as in >> 
  //https://quasar.dev/layout/routing-with-layouts-and-pages
  {
    path: '/', // oldie >> /planner
    component: () => import('layouts/PlannerLayout.vue'),
    children: [
      //{
       // path: '', 
        //component: () => import('pages/planner/weekCalendar.vue') //oldie >>pages/planner/weekViewPlanner.vue
      //},
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
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes */
