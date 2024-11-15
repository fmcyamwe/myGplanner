<template>                            
    <div v-if="doShow" class="q-pa-sm bg-grey-12"> <!-- style="max-width: 400px"-->
        <div class="q-pa-sm row justify-center items-center q-mx-auto">
        {{scheduleLabel.sched}} 
        </div>
        
        <div v-if="scheduleLabel.noTime" class="q-pa-sm row justify-center q-mx-auto labely">
          {{scheduleLabel.noTime}} Evts Need manual addition!
          <q-separator dark/>
        </div>
        <div v-if="hasUnsaved" class="q-pa-sm row justify-center q-mx-auto labely">
          <em>Unsaved Changes!</em>
        </div>
        <div class="row justify-center"> 
        <q-badge color="secondary" multi-line>
            {{balanceLabel}} mins
        </q-badge>
        </div>
        <q-separator dark/>
        <!--<br>-->
    </div>
</template>

<script>
import { defineComponent } from 'vue'
export default defineComponent ({ 
    name: 'scheduleDayLabel',
    props: {
      scheduleLabel: Object,
      balanceLabel: String,
      doShow:Boolean,
      hasUnsaved:Boolean
    }
})
</script>
<style lang="sass" scoped>
.labely
  overflow-wrap: break-word
  text-emphasis: sesame #f32937
  text-decoration: underline dotted #f32937
</style>

<!--orig 
                            <div v-if="treeGoals.length > 0" class="q-pa-sm bg-grey-12"> //style="max-width: 400px"
                            <div class="q-pa-sm row justify-center items-center q-mx-auto">
                                {{labelScheduled().sched}} 
                              </div>
                              <div v-if="labelScheduled().noTime" class="q-pa-sm row justify-center q-mx-auto labely">
                                {{labelScheduled().noTime}} Evts Need manual addition!
                              </div>
                              <div class="row justify-center"> 
                                <q-badge color="secondary" multi-line>
                                  {{labelBalance()}} mins
                                </q-badge>
                              </div>
                              <q-separator />
                          </div>
-->