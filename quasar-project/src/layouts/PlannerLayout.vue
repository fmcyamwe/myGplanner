<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated reveal :revealOffset="100">
      <q-toolbar><!--class="navbar"
        :class="{ 'navbar--hidden': !showNavbar }"
        @click.prevent="clicked"
        -->
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
      <br>
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
  },
  //{
  //  title: 'Testy',
  //  caption: 'Testy',
  //  icon: 'event_upcoming',
  //  link: '/testy',
  //}
]

export default defineComponent({
  name: 'PlannerLayout',

  components: {
    EssentialLink
  },

  setup () {
    return {
      essentialLinks: linksList,
      showNavbar: true,
      lastScrollPosition: 0
    }
  },
  //mounted(){
  //  console.log("onMounted")
    //window.addEventListener('scroll', this.onScroll)
  //},
  beforeUnmount(){
    //window.removeEventListener('scroll', this.onScroll)
  },
  methods:{
    clicked(){
      console.log("clicked")
    },
    onScroll () {
      // Get the current scroll position
      const currentScrollPosition = window.scrollY || document.documentElement.scrollTop
      // Because of momentum scrolling on mobiles, we shouldn't continue if it is less than zero
      if (currentScrollPosition < 0) {
        return
      }
      // Here we determine whether we need to show or hide the navbar
      this.showNavbar = currentScrollPosition < this.lastScrollPosition
      // Set the current scroll position as the last scroll position
      this.lastScrollPosition = currentScrollPosition
    }
  }
})
</script>
<style scoped lang="sass">
.g-planner
  padding: 0 1.5em 0 1.5em
.navbar
  height: 60px
  width: 100vw
  background: hsl(200, 50%, 50%)
  position: fixed
  box-shadow: 0 2px 15px rgba(71, 120, 120, 0.5)
  transform: translate3d(0, 0, 0)
  transition: 0.1s all ease-out

.navbar.navbar--hidden
  box-shadow: none
  transform: translate3d(0, -100%, 0)

.dummy-nav
  height: 60px
  width: 100vw

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
