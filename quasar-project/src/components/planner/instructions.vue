<template>
    <!-- <div v-if="showInstructions"> class="q-pa-md" style="max-width: 550px"-->
        <div v-if="showRemInstru" class="q-ma-sm column items-center"><!--class="column justify-center items-center"-->
            <q-card>
                Double click upcoming evt to remove item it
            </q-card><q-separator />
            <q-card>
                For mobile, Long press & hold Evt to remove or start drag
            </q-card><q-separator />
            <q-card>
                Can also add note to a finished evt or remove it
            </q-card><q-separator />
            <q-card>
                Click on time intervals to add events to schedule
            </q-card><q-separator />
            <q-card>
                Use Tree to filter goals by mood keywords and Add them to schedule
            </q-card>
        </div>
        <div v-if="showSchedInstru" class="q-ma-sm column items-center">
            <q-card>
                Use above Scheduling buttons to add events to schedule
            </q-card><q-separator />
            <q-card>
                Can also Tree to filter by mood keywords and add them to schedule.
            </q-card><q-separator />
            <q-card>
                Click on time intervals to add events to schedule
            </q-card>
            <q-card>
                Use mouse to select a timeRange for new AdHoc Evt goal.
            </q-card>
        </div>
    <!--</div> -->
    
</template>
<script>
    import { defineComponent } from 'vue'

    export default defineComponent({
      name: 'daInstructions',
      props: {
        showInstructions: { //not needed--toRemove**
          type: Boolean,
          //required: true, 
          default: true,
        },
        showRemInstru: {
          type: Boolean,
          required: true
          //default? or would complain on render? >>no complaint even with requiered huh
        },
        showSchedInstru: {
          type: Boolean,
          required: true
          //default?
        },
        /*title: {
          type: String,
          required: true,
          default: '',
          validator: (value) => {
            return value != ''
          }
        },
        subGoals: {
          type: Array,
          default: [] ////array of subGoals indexes(prolly)
        },
        priority: { ////default priority of importance
          type: Number,
          default: 0
        },
        bgColor: {
          type: String,
          default: 'orange'
        },*/
      }
    })
    /*
    { 
        id: 1,
        title: 'Learn Violin',
        details: 'Vi-violin',
        subGoals: [], //array of subGoals indexes(prolly)
        priority: 3, //default priority of importance
        bgcolor: 'red',
        icon: 'fas fa-handshake'
        
    },
    */
    </script>
    