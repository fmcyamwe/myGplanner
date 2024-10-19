///QExpansionItem/HandlingEvents.vue
<template>
  <div class="q-pa-md" style="max-width: 350px">
    <div class="text-white text-center">
    <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/"
        label="Go Back"
        no-caps
     />

     <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        label="Do Check..."
        no-caps
        @click="doApiHit"
      />
    </div>
  </div>

<div class="q-pa-md row items-start q-gutter-md">
  <q-card
      class="my-card text-white"
      style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%)">
    <!--<q-card-section class="q-pt-none">
        {{ essentialLinks }}
    </q-card-section> -->
  </q-card>
</div>

<div class="q-pa-md row items-start q-gutter-md">
    <q-list bordered padding>
     <ChapterLink
        v-for="link in essentialLinks"
        :key="link.title"
        v-bind="link"
    /> 
    </q-list>
</div>

<!--</q-list>--> 
</template>

<script>

// we import one of the named exports from src/boot/axios.js
import { api } from 'boot/axios'
import { ref } from 'vue'
import { useQuasar } from 'quasar'

import ChapterLink from 'components/ChapterLink.vue'

export default {
    //name needed? doesnt seem like it
    components: {
        ChapterLink
    },

    setup(){
       // const linksList = ref(null)  //was data
       const $q = useQuasar()
        function doApiHit () {
            api.get('/doCheck')
            .then((response) => {
                linksList.value = response.data
                })
            .catch(() => {
                $q.notify({
                    color: 'negative',
                    position: 'top',
                    message: 'Loading failed',
                    icon: 'report_problem'
                    })
                })
        }
        
        return {
            //essentialLinks:linksList,
            doApiHit
        }
    }
}
</script>
