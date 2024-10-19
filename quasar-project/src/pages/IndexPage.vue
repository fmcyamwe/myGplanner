<template>
  <q-page class="flex flex-center">
    <img
      alt="Quasar logo"
      src="~assets/quasar-logo-vertical.svg"
      style="width: 200px; height: 200px"
    >

    <div class="text-white text-center">
     <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/mymangas"
        label="Go Manga"
        no-caps
      />
    </div>

    <div class="text-white text-center">
     <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/planner"
        label="planner"
        no-caps
      />
    </div>

    <div class="text-white text-center">
     <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/testy"
        label="Testy"
        no-caps
      />
    </div>

    <div class="text-white text-center">
     <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/dragga"
        label="Dragga"
        no-caps
      />
    </div>
    <!--<div class="text-white text-center">
     <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/pinia"
        label="Piniia"
        no-caps
      /> 
    </div>-->

  </q-page>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'IndexPage'
})
</script>
