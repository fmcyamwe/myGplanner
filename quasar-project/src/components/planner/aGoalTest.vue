<template>
  <div class="q-pa-md q-gutter-sm"> <!-- class="q-mt-xl" ? -->
    
    <!--<q-btn label="Show dialog" color="primary" @click="showDialog = true" /> -->
    
    <!--hide the above button to see if possible to trigger via a parent component
    showDialog
    -->
    <q-dialog v-model="showDialog" transition-show="rotate" transition-hide="rotate"> -->
      <q-card>
        <q-card-section>
          <div class="text-h6">ad hoc goal</div>
        </q-card-section>

         <q-separator />

        <q-card-section style="max-height: 50vh" class="scroll"> <!-- class="q-pt-none"-->
            <div>
                <q-form
                    @submit="onSubmit"
                    class="page page--table"
                    >
                    <div class="q-gutter-sm"> <!-- v-model="goalType"-->
                        <q-radio v-model="doShow" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="main" label="Main goal" />
                        <q-radio v-model="doShow" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="sub" label="Sub goal" />
                    </div>
                        <!--instead of v-model=... >> gotta use :value -->
                        <q-input
                            filled
                            :modelValue="goalTitle"
                            label="A Goal"
                            lazy-rules
                            :rules="[ val => val && val.length > 0 || 'Please type a goal']"
                        />

                        <div v-if="showSubG" class="q-gutter-md">
                            <q-select 
                            :modelValue="pGoal" 
                            :options="mainGoals"
                            option-value="id"
                            option-label="title"
                            label="Parent Goal" />
                        </div> 

                        <q-input v-else
                            filled
                            :modelValue="details"
                            label="Description/Details"
                        />
                        <div v-if="!showSubG" class="q-gutter-sm">
                            <q-input
                                filled
                                :modelValue="bgcolor"
                                label="Color code"
                                hint="Color"
                            />
                            
                            <q-input
                                filled
                                :modelValue="priority"
                                type="number"
                                label="Priority"
                                hint="0 to 10"
                            />
                        </div>

                        <div v-if="showSubG" class="q-gutter-sm">
                            <q-input :modelValue="time" filled type="time" hint="Default time" />
                            <q-input
                                filled
                                :modelValue="score"
                                label="Score"
                                hint="format: #on#"
                            />
                            Duration
                            <q-knob
                                :min="15"
                                :max="120"
                                :modelValue="duration"
                                show-value
                                size="50px"
                                :thickness="0.22"
                                color="teal"
                                track-color="grey-3"
                                class="q-ma-md"
                            />
                            <br>
                            <q-toggle
                                :modelValue="canMove"
                                label="Can be Moved?"
                                left-label
                                color="green"
                            />
                        </div>

                        <div>
                        <q-btn label="Submit" type="submit" color="primary"/>
                        <!--<q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" /> -->
                        </div>
                    </q-form>
                </div>
        </q-card-section>

        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Print" color="primary" @click="doPrint"/> <!--"Decline" with v-close-popup -->
          <q-btn flat label="Reset" color="primary" @click="doReset"/>  <!--"Accept" with v-close-popup-->
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<!--try to pass all props and satisfy dialog props/emit requirements-->

<script>
export default {
  name: 'aGoalTest',
  props: ['goalTitle','goalType','pGoal','mainGoals',
  'details','priority','bgcolor','showSubG','time','score','duration','canMove'],
  emits: ['update:modelValue'],

  setup() {
    return {
        showDialog:true,
        doShow () {
            //get() {
                return this.goalType ==='main' ? false : true //props.showDialog
            //},
            //set(value) {
            //    emit('update:showDialog', value)
            //}
        },
        onSubmit() {
            console.log("onSubmit")
        },
        doPrint () {
            console.log("doPrint")
        },
        doReset (){
            console.log("doReset")
        }
    }
  }
}
</script>