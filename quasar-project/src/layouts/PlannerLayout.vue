<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <!--<q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="q-gutter-md"
          @click="toggleLeftDrawer"
        /> -->

        <q-toolbar-title class="g-planner">
          My G. Planner
        </q-toolbar-title>

        <!--  class="q-mt-xl"-->
      <div class="text-white">
        <q-btn
            class="q-mt-sm home-view"
            text-color="gold"
            unelevated
            to="/"
            label="<- Week"
            no-caps
            no-wrap
        />
      </div>

      <div class="row justify-center">
        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        /><!--@reset="clicky"-->
      </div>
      </q-toolbar>
    </q-header>

 

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'  //ref
//import { useQuasar } from 'quasar'
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Goals',
    caption: 'All Goals',
    icon: 'edit_note',
    link: '/goalsPage', 
  },
  {
    title: 'Day View',
    caption: 'Schedule',
    icon: 'self_improvement', //event_upcoming || //today
    link: '/dayCalendar',
  },
  {
    title: 'Summary',
    caption: 'Summary',
    icon: 'summarize', //self_improvement ?
    link: '/summary', //'https://quasar.dev'
    //clicky: 
  }
  //{
  //  title: 'Alt',
  //  caption: 'Alty',
  //  icon: 'event_upcoming',
  //  link: '/testAlt', //'https://quasar.dev'
  //}
]

export default defineComponent({
  name: 'PlannerLayout',

  components: {
    EssentialLink
  },

  setup () {
    //const leftDrawerOpen = ref(false)
    
    //function clicky() { //to close drawer on navigation, otherwise it stays open on the new page!
     
    //  leftDrawerOpen.value = !leftDrawerOpen.value
    //}

    return {
      essentialLinks: linksList,
      //clicky,
      //leftDrawerOpen,
      //toggleLeftDrawer () {
      //  leftDrawerOpen.value = !leftDrawerOpen.value
      //}
    }
  }
})
</script>
<style scoped lang="sass">
.g-planner
  padding: 0 1.5em 0 1.5em

.home-view
  &:active,
  &:visited,
  &.q-btn--active
    &:before
      box-shadow: $button-shadow-active

@media (max-width: 500px)
  .g-planner 
    display: none
  .home-view
    padding: 0 2.5em 0 2.5em
</style>
