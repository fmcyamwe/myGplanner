<!--for showing end-Now button and updating the goal score when ending-->
<template>
    <div class="title q-calendar__ellipsis"><!-- :class="ClassNStyle"  q-mr-xs q-mb-xs q-px-sm -->
      <!--<div style="display: flex; align-items: center; justify-content: start; flex-wrap: nowrap;">
        <div style="max-width: 25px; min-width: 25px;">
      -->
      <div class="q-pl-sm">
        {{ ` ${title} (${score})`}}
        <q-icon :name="daIcon" />
      </div>
      <q-tooltip>{{ "("+id+") "+ details }}</q-tooltip>

      <div :style="showBtnStyle"><!--class="col-xs-12 col-sm-6 col-md-4"-->
        <q-btn
        no-caps
        label="Add5"
        align="between"
        @click="wannaAdd(5)"
        /> 
        
        <q-btn
        no-caps
        label="Add10"
        align="between"
        class="q-mx-md poppy"
        @click="wannaAdd(10)"
        /><!--hide this when in mobile due to screen space-->
        <q-separator :vertical="true"/>

        <q-btn
        no-caps
        label="End-Now"
        align="between"
        @click="wannaEnd"
        /> 
      </div>
        
        <q-popup-edit v-model="aScore" :disable="disabledScore" v-slot="scope" auto-save touch-position>
           <!--disabledScoreEvts[event.id] for disable && onSaveScore(e,id). 
          rmv this to see >> @save="(e)=>$emit('saveScore', e, id)" 
          
          touch-position make dialog smaller...class="poppy" not needed prolly

          v-model="aScore"
          :validate="scoreValidation" 
          @hide="scoreValidation">> validate function doesnt work...validate on set()
          
           //counter and keyup.enter has to be scope.set or doesnt do anything nor trigger the saveScore() smh...
           
          auto-save >>needed to save when user clicks outside...mais bon.. better to have them click green btn for obviousness?!?tbd
        -->

        <!--class='my-card' -->
          <q-card class="bg-secondary text-white">
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
        </q-popup-edit>

    </div>
</template>
  
<script>
import { defineComponent,ref } from 'vue'

  export default defineComponent ({  //this be Options Vue notation
    name: 'GoalyEnd',
    props: {  //too much? should use a data object?
      disabledScore: Boolean, //score popup-edit enabled or not--toRename**
      title: String,
      id: Number,
      startTime: String, //prolly redundant but just in case
      details: String,
      notes:String, //notes
      score: String, //score to update
      happeningNow: Boolean, //to show the endNow button
      icon: String, //toTest** if can show
      //showMobileDialog: Boolean, //related to disabledScore but for mobile 
    },
    data(){
      const errorMessageScore = ref('')
      const errorScore = ref(false)
      //let note = ref('')
      return {
        note:this.notes,
        daScore:this.score,
        daIcon:this.icon,
        errorMessageScore,
        errorScore
        //showDialog:this.showMobileDialog   // !this.disabledScore
        //umm inverse in mobile...except it shows immediately!
        //--or maybe should do so programmatically in parent when in mobile?
        // but inversing could still cause problem when evt not finished smh
        //

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
      /*showy:{ //just to see if updates...smh >>nope! doesnt get redrawn methink
        get(){return this.showDialog},
        set(value){
          console.log(`showy getting set`,value, this.id)
          this.showDialog = value
        }
      },*/
      aScore:{
        get(){return this.daScore},
        set(value){
          //console.log(`aScore getting set`,value, this.id) 
          //this.$emit('saveScore', value, this.id) //auto-save does update it? >>does!
          //let e = this.aScoreValidation >>dont work..some side-effect error..cause it's in computed section...
          //def roundabout way to validate instead of using :validate smh..toReview **
          
          //let e = //no need to check return?
          this.aScorey(value) ? this.daScore = value : console.log(`setting invalid aScore?`, value, this.daScore) //todo** try to bring attention to errors before clicking saveBtn
          //console.log(`aScore valid?`,e,this.daScore, this.aNote)
          
          //this.daScore = value
          
         
        },
        cancel(){ //doesnt do anything...prolly cause of auto-save?--would prolly trigger when it's absent? //for when user clicks outside popup.--toSee if needed and use @cancel="" 
          console.log(`aScore remove?`, this.id) 
        }
      },
      aNote:{
        get(){return this.note},
        set(value){
          //console.log(`setting aNote from: ${this.notes} to ${value}`) 
          this.note = value
        }
      },
      userIconStyle () { //redudant--toREmove**
        return {
          color: this.disabledScore === true ? 'red' : 'blue',
          cursor: 'pointer'
        }
      },
      //labelBtnStyle () { //for edit or end --not needed since using popup-edit?..or actually need it?~? FML....toTest***
      //  return (this.disabledScore === false && this.happeningNow === true) ? 'Edit' : 'EndNow'
      //},
      ClassNStyle () { //doesnt update per row smh
        let s = "title q-calendar__ellipsis"

        //console.log('titleValue:', s,(this.disabledScore === false && this.happeningNow === true))
        return (this.disabledScore === false && this.happeningNow === true) ? s+' mooh' : s
      },
      showBtnStyle () {  //for displaying the button and hide it when otherwise...not complicated?toReview
        return {
          display: (this.disabledScore === true && this.happeningNow === true) ? 'flex' : 'none', //oldie>>this.happeningNow === true ? 'block' : 'none'
          'text-align': 'center',
          'margin-left': '1em', //was 32em
          'height':'auto',   // auto //'margin': '0 auto',
          //'border':'3px solid red'
        }
      }
    },
    watch: {
      title (val) {//(newValue, oldValue) ...could trigger emit to store/update storage--toTest**
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
        if(this.errorMessageScore != '' || this.errorScore){//check that no errors with this.aScore....
          console.log('ERROR saveScore',this.aScore,this.errorMessageScore)
          //this.reset()
          return  //bon should let parent handle it...but wahala to coordinate esti
        }

        this.$emit('saveScore', this.id,this.aScore,this.aNote)
        //this.showDialog = false //to reset and hide dialog

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
        var regx = /^\don\d$/g   //g flag return all match(to prevent '1on2on3on4')
        var match = val.match(regx) || []  //force return as array of get null access error
        //return match && val === match[0] //first match should be same and match.length should equal 1
        //console.log(`scoreValidation got`,val, match,val === match[0])

        if (match && val !== match[0]){ //oldie>> (val.length < 4 || !(val.includes("on"))) {
          this.errorScore = true
          this.errorMessageScore = `Error: ${val} Unsaved.Must format as: #on#`  // doesnt clear unless user makes change...meh
          return false
        }
        this.errorScore = false
        this.errorMessageScore = ''

        return true
      },
      reset(){
        this.errorScore = false
        this.errorMessageScore = ''
      }
    }
  })
</script>
<style lang="sass" scoped>
.inputBtn
  text-align: center

.goal-item--REDUNDANT
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

.poppy
  width: 100%

@media (max-width: 500px)
  .poppy
    display: none
  .title__TOOSMALL
    transform: scale(.75, .75)

</style>