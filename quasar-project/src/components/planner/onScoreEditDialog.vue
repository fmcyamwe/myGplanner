<template>
    <q-dialog v-model="show" class="mobile-only" transition-show="rotate" transition-hide="rotate" @before-hide="gonHide"> 
      <q-card class="my-card-mobile"> <!--bg-secondary -->
          <div class="q-ma-md title">:: Notey & Score ::</div>
          <div class="q-gutter-md q-ma-md evtTitle text-weight-bold">{{title}}</div>
          
          <q-card-section class="q-gutter-md">
            <q-input 
            v-model="aScore"
            dense 
            hint="format: #on#" 
            label-slot
            :error="errorScore" 
            :error-message="errorMessageScore">
              <template v-slot:label>
                <div class="evtTitle q-mb-lg q-mx-md"> Score </div>
              </template>
            </q-input>
          </q-card-section>
  
          <q-card-section class="q-gutter-md">
            <!--braaa label="Note"-->
            <q-input
            filled
            v-model="aNote"
            label-slot
            autogrow
            lazy-rules
            item-aligned
            :rules="[ val => val && val.length > 0 || 'Add a note...']"
            >
              <template v-slot:label>
                <div class="q-mb-lg q-mx-md"> Note </div>
              </template>
            </q-input>
          </q-card-section>
  
          <q-separator dark />
  
          <q-card-actions class="q-gutter-md q-mx-md inputBtn">
            <q-btn
            label="Save"
            flat dense color="positive" icon="check_circle"
            @click="onSave"
            /> <!--
               @click.stop.prevent="aScore.set" in mobile borks!
            -->

            <q-separator :vertical="true"/>
            
            <q-btn
            label="Del"
            flat dense color="negative" icon="delete_forever"
            @click="onDelete"
            />
          </q-card-actions>
      </q-card>
    </q-dialog>
</template>
<script>
import { defineComponent,ref } from 'vue'

  export default defineComponent ({  //this be Options Vue notation
    name: 'mobileNoteScoreUpdate',
    props: {
      title: String,
      id: Number,
      startTime: String, //prolly redundant
      details: String,
      notes:String, //notes
      score: String, //score to update
      //happeningNow: Boolean, //to show the endNow button
      showDialog: Boolean, //default hide/show...hopefully updates ESTIII***
    },
    data(){
        const errorMessageScore = ref('')
        const errorScore = ref(false)
        return{
            show:this.showDialog, //ref(true), // default dialog show/hide//true by default...
            errorMessageScore,
            errorScore,
            note:this.notes,
            daScore:this.score,
        }
    },
    emits: [
        'saveScore',
        'deleteNow',
        'euhHidin'
    ],
    computed: {
        showy:{ //just to see if updates..
          get(){return this.show},
          set(value){
            //console.log(`showy getting set`,value, this.id)
            this.show = value
          }
        },
        aScore:{
          get(){return this.daScore},
          set(value){
            //console.log(`aScore getting set`,value, this.id) 
            //this.$emit('saveScore', value, this.id) //auto-save does update it? >>does!
            //let e = this.aScoreValidation >>dont work..some side-effect error..cause it's in computed section...
            //def roundabout way to validate instead of using :validate smh..toReview **
            //let e = 
            this.aScorey(value)

            this.daScore = value //to allow correction!!!
          },
        },
        aNote:{
          get(){return this.note},
          set(value){
            //console.log(`setting aNote from: ${this.notes} to ${value}`) 
            this.note = value
          }
        },
    },
    methods: {
        onDelete () { //no need for @click="(e) => onDelete(e)"...phew!
            //console.log('huh delete?',this.id)
            this.$emit('deleteNow')
            this.showy = false // gotta hide dialog...huh works
        },
        gonHide(){ 
          //console.log(`gonHide...about to hide...showPicky: showAdHoc`, this.showPickyDialog,this.showAddyDialog)

          this.$emit('euhHidin') //needed to reset parent's  
        },
        onSave () { 
            //console.log('huh saveScore?',this.aScore, this.id,this.aNote)
            if(this.errorMessageScore != '' || this.errorScore){//check that no errors with this.aScore....
                console.log('ERROR saveScore',this.aScore,this.errorMessageScore)
                
                return  //bon should let parent handle it...but wahala to coordinate esti
            }

            this.$emit('saveScore',this.id,this.aScore,this.aNote)

           this.showy = false // gotta hide dialog...huh works
            
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
    }
})
</script>
<style lang="sass" scoped>
.evtTitle
  text-align: center

.title
  position: relative
  display: flex
  justify-content: center
  align-items: center
  height: 100%

.my-card-mobile
  width: 100%
  background-color: gainsboro

.poppy
  width: 100%

@media (max-width: 500px)
  .poppy
    display: none

</style>