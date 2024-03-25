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
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Planner App
        </q-toolbar-title>

        <!--<div>Quasar v{{ $q.version }}</div> -->
        <!--<q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        label="Retrieve..."
        no-caps
        @click="checkStored"
        />-->
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

   <!-- <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Essential Links
        </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>  style="background-color:black"-->

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useQuasar } from 'quasar'
//import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Docs',
    caption: 'quasar.dev',
    icon: 'school',
    link: 'https://quasar.dev'
  }
]

export default defineComponent({
  name: 'PlannerLayout',

  //components: {
  //  EssentialLink
  //},

  setup () {
    const leftDrawerOpen = ref(false)
    
    const $q = useQuasar()
    function checkStored() {
      //$q.localStorage.set('first', "i be first!")
      //$q.sessionStorage.set('second', "umm second?")
      
      let e = JSON.parse($q.localStorage.getItem("allGoals"))
      console.log(e)
    }

    return {
      essentialLinks: linksList,
      checkStored,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      }
    }
  }
})
</script>
