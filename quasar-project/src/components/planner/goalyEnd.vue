<!--for showing end-Now button and updating the goal score when ending-->
<template>
    <div class="title q-calendar__ellipsis"><!--q-mr-xs q-mb-xs q-px-sm -->
      <!--<div style="display: flex; align-items: center; justify-content: start; flex-wrap: nowrap;">
        <div style="max-width: 25px; min-width: 25px;"></div> $emit('endNow', id)
      -->
      <div class="q-pl-md">
        {{ ` ${title} (${score})`}}
      </div>
      <q-tooltip>{{ "("+id+") "+ details }}</q-tooltip>

      <div :style="endNowBtnStyle">
        <q-btn
        no-caps
        label="Add5"
        @click="wannaAdd(5)"
        /> 
        
        <q-btn
        no-caps
        label="Add10"
        class="q-mx-md"
        @click="wannaAdd(10)"
        />
        <q-separator :vertical="true"/>

        <q-btn
        no-caps
        label="End-Now"
        @click="wannaEnd"
        /> <!--:style="endNowBtnStyle" class="button"-->

      </div>
        <!--
        :label="EndNow"
        <div class="ellipsis">  :style="userStyle"  class="inputBtn"
          {{ title }}
          <q-tooltip>{{ details + ' at: '+ startTime }}</q-tooltip>
        </div>-->

        <q-popup-edit v-model="aScore" :disable="disabledScore" v-slot="scope" auto-save>
           <!--disabledScoreEvts[event.id] for disable && onSaveScore(e,id). 
          rmv this to see >> @save="(e)=>$emit('saveScore', e, id)" 
          autofocus 
          
          v-model="aScore"
          :validate="scoreValidation" 
          @hide="scoreValidation">>TOADD if adding validate function
          
           //counter and keyup.enter has to be scope.set or doesnt do anything nor trigger the saveScore() smh...
           
          auto-save >>needed to save when user clicks outside...mais bon.. better to have them click green btn for obviousness?!?tbd
        -->
        <q-card class="my-card bg-secondary text-white">
          <div class="title"> NoteyOnScore :: {{title}}</div>
          <q-card-section class="q-gutter-md">
            <q-input v-model="scope.value" dense hint="format: #on#" :error="errorScore" :error-message="errorMessageScore">
              <!--
                <template #after>
                <q-btn
                flat dense color="positive" icon="check_circle"
                @click.stop.prevent="scope.set"
                />
                <q-separator :vertical="true"/>
                    <q-btn
                    label="Del"
                    flat dense color="negative" icon="delete_forever"
                    @click="onDelete"
                    />
              </template> -->
            </q-input>
          </q-card-section>
    
          <q-card-section class="q-gutter-md">
            <!--braaa class="q-ml-md" max-width: 250px q-gutter-md -->
            <q-input
            filled
            v-model="aNote"
            label="Note"
            autogrow
            lazy-rules
            item-aligned
            :rules="[ val => val && val.length > 0 || 'Add a note...']"
            />
          </q-card-section>
    
          <q-separator dark />
    
          <q-card-actions class="q-gutter-md q-mx-md inputBtn">
            <!--<q-btn flat>Action 1</q-btn> -->
            <!--<q-btn flat>Action 2</q-btn> -->
            <q-btn
            label="Save"
            flat dense color="positive" icon="check_circle"
            @click.stop.prevent="scope.set"
            @click="onSave"
            /> <!--umm onSave is redundant?!? -->

            <q-separator :vertical="true"/>
            
            <q-btn
            label="Del"
            flat dense color="negative" icon="delete_forever"
            @click="onDelete"
            />
          </q-card-actions>
        </q-card>
       
          <!-- oldie but moved in card above!
            <q-input v-model="scope.value" dense hint="format: #on#" :error="errorScore" :error-message="errorMessageScore">
            <template #after>
              <q-btn
              flat dense color="positive" icon="check_circle"
              @click.stop.prevent="scope.set"
              />
              <q-separator :vertical="true"/>
                  <q-btn
                  label="Del"
                  flat dense color="negative" icon="delete_forever"
                  @click="onDelete"
                  />
            </template>
          </q-input>-->

            <!-- >>oldie >>counter and keyup.enter has to be scope.set or doesnt do anything nor trigger the saveScore() smh...
            now though no need for @keyup.enter="scope.set" toSee how it works!-->

            <!--<template> --doesnt like the v-slot it seems---have to be in input as above!!===also having >> v-slot="after" seems to bork it(have to use #after)...see why later!!
              <q-btn
              flat dense color="negative" icon="cancel"
              @click.stop.prevent="scope.cancel"
               :disable="scope.validate(scope.value) === false || scope.initialValue === scope.value"
            />
            </template> -->
        </q-popup-edit>
    </div>
</template>
  
<script>
import { defineComponent,ref } from 'vue'

  export default defineComponent ({  //this be Options Vue notation
    name: 'GoalyEnd',
    props: {
      disabledScore: Boolean,
      title: String, //g.Title
      id: Number, //
      startTime: String, //prolly redundant
      details: String, 
      score: String, //score to update
      happeningNow: Boolean, //to show the endNow button
    },
    data(){
      const errorMessageScore = ref('')
      const errorScore = ref(false)
      let note = ref('')
      return {
        errorMessageScore,
        errorScore,
        note,
        daScore:this.score

        /*bof dont work! >>see below...
        scoreValidation(val){ //8on9
          //console.log(`scoreValidation got`,val, id) //this.id
          if (val.length < 4 ) {  //|| !(val.includes("on"))  //also should check that second var is higher than first mais bon....toSee**
            errorScore.value = true
            errorMessageScore.value = 'Must format as: #on#'
            return false
          }
          errorScore.value = false
          errorMessageScore.value = ''
          //console.log(`aScore getting set`,val, this.id) 
          //this.$emit('saveScore', val, this.id) //check if auto-save does update it..

          return true 
          //return this.aScoreValidation(val)
        },*/
      }
    },
    emits: [
      //'update:model-value', //redundant since not writing back to parent?--or should have this still for binding via v-model? >>no need
      'saveScore',
      'endNow',
      'deleteNow',
      'addMins'
    ],
    computed: { //bon use other methods as these are not useful...
      aScore:{
        get(){return this.daScore},
        set(value){
          //console.log(`aScore getting set`,value, this.id) 
          //this.$emit('saveScore', value, this.id) //auto-save does update it? >>does!
          //let e = this.aScoreValidation >>dont work..some side-effect error..cause it's in computed section...
          //def roundabout way to validate instead of using :validate smh..toReview **
          let e = this.aScorey(value)
          //console.log(`aScore valid?`,e,this.daScore, this.aNote)
          if (e){
            this.daScore = value
          // this.$emit('saveScore', value, this.id,this.aNote) //bon no need to emit yet...
          }
         
        },
        cancel(){ //doesnt do anything...prolly cause of auto-save?--would prolly trigger when it's absent? //for when user clicks outside popup.--toSee if needed and use @cancel="" 
          console.log(`aScore remove?`, this.id) 
        }
      },
      aNote:{
        get(){return this.note},
        set(value){
          this.note = value
        }
      },
       /*neither the below smh
       aScoreValidation(val){ //8on9
        console.log(`scoreValidation got`,val, this.id)
        if (val.length < 4 ) {  //|| !(val.includes("on"))
          errorScore = true
          errorMessageScore = `Error: ${val} Unsaved.Must format as: #on#`
          return false
        }
        errorScore = false
        errorMessageScore = ''
        //console.log(`aScore getting set`,val, this.id) 
        //this.$emit('saveScore', val, this.id) //check if auto-save does update it..

        return true

      },*/
      userIconStyle () {
        return {
          color: this.disabledScore === true ? 'red' : 'blue',
          cursor: 'pointer'
        }
      },
      //labelBtnStyle () { //for edit or end --not needed since using popup-edit?..or actually need it?~? FML....toTest***
      //  return (this.disabledScore === false && this.happeningNow === true) ? 'Edit' : 'EndNow'
      //},
      endNowBtnStyle () {  //for displaying the button and hide it when otherwise...not complicated?toReview
        return {
          display: (this.disabledScore === true && this.happeningNow === true) ? 'flex' : 'none', //oldie>>this.happeningNow === true ? 'block' : 'none'
          'text-align': 'center',
          'margin-left': '32em',
          'height':'auto',   // auto //'margin': '0 auto',
          //'border':'3px solid red'
        }
      }
    },
    watch: {
      title (val) {
         console.log('titleValue:', val)
      }
    },
    methods: {
      onDelete () { //no need for @click="(e) => onDelete(e)"...phew!
        //console.log('huh delete?',this.id)
        this.$emit('deleteNow') //, this.id) //no need for this.id either!!--toReview**
      },
      onSave () {
        //console.log('huh saveScore?',this.aScore, this.id,this.aNote)
        this.$emit('saveScore', this.aScore, this.id,this.aNote)
      },
      wannaEnd(){
        //console.log("eeeuh wish to end for", this.id, this.disabledScore ,this.happeningNow )
        this.$emit('endNow', this.id)
      },
      wannaAdd(num){
       // console.log("oooh adding "+num, "for:"+ this.id)
        this.$emit('addMins', this.id,num)
      },
      aScorey(val){
        //console.log(`scoreValidation got`,val, this.id)
        if (val.length < 4 || !(val.includes("on"))) {
          this.errorScore = true
          this.errorMessageScore = `Error: ${val} Unsaved.Must format as: #on#`  // doesnt clear unless user makes change...meh
          return false
        }
        this.errorScore = false
        this.errorMessageScore = ''

        return true
      },
    }
  })
</script>
<style lang="sass" scoped>
.inputBtn
  text-align: center
.goal-item
  border: 1px solid transparent
  box-shadow: 0 1px 5px rgb(0 0 0 / 20%), 0 2px 2px rgb(0 0 0 / 14%), 0 3px 1px -2px rgb(0 0 0 / 12%)
  border-radius: 4px
  vertical-align: top
  padding: 2px
  margin: 2px
  margin-bottom: 4px
  font-size: 12px
  &:hover
    border: 1px solid rgba(0,140,200,.8)
.title
  position: relative
  display: flex
  justify-content: center
  align-items: center
  height: 100%

.c-section
  max-width: 250px
.my-card
  width: 100%
</style>