<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="q-gutter-md"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          My G. Planner
        </q-toolbar-title>

        <!--  class="q-mt-xl"-->
      <div class="text-white">
        <q-btn
            class="q-mt-sm"
            text-color="gold"
            unelevated
            to="/"
            label="Go Back"
            no-caps
        />
      </div>
      </q-toolbar>
    </q-header>

   <q-drawer
      v-model="leftDrawerOpen"
      bordered
    ><!--show-if-above >> default open on render...-->
      <q-list>
        <q-item-label
          header
        >
          
        </q-item-label> 

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
          @reset="clicky"
        />
      </q-list>
    </q-drawer> 

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
//import { useQuasar } from 'quasar'
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Summary',
    caption: 'Summary',
    icon: 'summarize', //self_improvement ?
    link: '/summary', //'https://quasar.dev'
    //clicky: 
  },
  {
    title: 'Day View',
    caption: 'Schedule',
    icon: 'self_improvement', //event_upcoming || //today
    link: '/dayCalendar', //'https://quasar.dev'
    //clicky: clicky
  },
  {
    title: 'Goals',
    caption: 'All Goals',
    icon: 'edit_note',
    link: '/goalsPage', //'https://quasar.dev'
    //clicky: clicky
  }
]

export default defineComponent({
  name: 'PlannerLayout',

  components: {
    EssentialLink
  },

  setup () {
    const leftDrawerOpen = ref(false)
    
    function clicky() { //to close drawer on navigation, otherwise it stays open on the new page!
      //const $q = useQuasar()
      //$q.localStorage.set('first', "i be first!")
      //$q.sessionStorage.set('second', "umm second?")
      
      //let e = JSON.parse($q.localStorage.getItem("allGoals"))
      
      leftDrawerOpen.value = !leftDrawerOpen.value
    }

    return {
      essentialLinks: linksList,
      clicky,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      }
    }
  }
})
</script>
