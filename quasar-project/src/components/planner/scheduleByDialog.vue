<template>
    <q-dialog ref="dialogRef" transition-show="rotate" transition-hide="rotate" @hide="onDialogHidey">
    <!--<q-dialog  v-model="showy" @before-hide="gonHide"> -->
      <q-card class="my-dialog"> <!--bg-secondary ..Notey & Score :: -->
          <div class="q-ma-md title"> {{title}} </div>
          <q-separator dark />
          <div class="q-ma-md title"> {{mess}} </div>

          <q-card-section class="q-gutter-md">
            
            <div class="q-gutter-sm">
                <q-option-group
                v-model="oChoice"
                :options="daOptions"
                />
            </div>
            <!--hidden when filter is selected -->
            <q-toggle v-if="oChoice != 'filter'"
            v-model="oCheck"
            label="Skip Overlap Check?"
            left-label
            />
          </q-card-section>

          <q-separator dark />
  
          <q-card-actions align="center" class="q-mx-md"><!-- class="q-gutter-md q-mx-md inputBtn" icon="delete_forever" icon="check_circle"-->
            <q-btn
            label="Cancel"
            flat 
            color="primary"
            @click="onCancelyClick"
            />
            <q-separator :vertical="true"/>
            <q-btn
            label="Ok"
            flat 
            color="primary"
            @click="onOKyClick"
            /> 
          </q-card-actions>
      </q-card>
    </q-dialog>
</template>
<script>
import { defineComponent,ref } from 'vue'
import { useDialogPluginComponent } from 'quasar' //needed?>> emits dont seem to work without it so far....
export default defineComponent ({  //this be Options Vue notation
    name: 'scheduleBy',
    props: {
      title: String,
      message:String,
      options:Array,
      selectedO:String,
      //showDialog: Boolean, //default hide/show. //huh redundant
    },
    emits: [
        'onCancel',
        'onOk',
        //'euhHidin', //redundant..
        'ok','hide' //needed
    ],
    data(){
        //const errorMessageScore = ref('')
        //const skipOvCheck = ref(false)
        return{
            //showey:this.showDialog, //ref(true), // dialog show/hide //true by default...redundant prolly cause of dialogRef
            mess:this.message,
            daOptions:this.options,
            skipOvCheck: ref(false),
            optGroup: this.selectedO //ref('line'), //nothing selected
        }
    },
    setup(){
        const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
        return{
            dialogRef,
            onDialogHide,
            onDialogOK, //umm point of these?!?
            // other methods that we used in our vue html template;
            // these are part of our example (so not required)
            /*onDOK () { //onOKClick
                // on OK, it is REQUIRED to
                // call onDialogOK (with optional payload)
                console.log(`onOKClick`) 
                //this.onSave() //just to see >>nope
                onDialogOK()
                this.$emit('onOk', this.skipOvCheck)
                // or with payload: onDialogOK({ ... })
                // ...and it will also hide the dialog automatically
                
            },*/

            // we can passthrough onDialogCancel directly
            onCancelClick: onDialogCancel,

            //showey,//:this.showDialog, //ref(true), // default dialog show/hide//true by default...
            //mess,//:this.message,
            //daOptions,//:this.options,
            //skipOvCheck: ref(false),
            //optGroup: ref('line'), //nothing selected
        }
    },
    computed: {
        /*showy:{ //just to see if updates..
          get(){return this.showey},
          set(value){
            //console.log(`showy getting set`,value, this.id)
            this.showey = value
          }
        },*/
        oCheck:{
          get(){return this.skipOvCheck},
          set(value){
            //console.log(`setting aNote from: ${this.notes} to ${value}`) 
            this.skipOvCheck = value
          }
        },
        oChoice:{
          get(){return this.optGroup},
          set(value){
            //console.log(`setting oChoice from: ${this.optGroup} to ${value}`) 
            this.optGroup = value
          }
        },
    },
    methods: {
        // following method is REQUIRED
        // (don't change its name --> "show")
        show () {
            this.$refs.dialogRef.show()
        },

        // following method is REQUIRED
        // (don't change its name --> "hide")
        hide () {
            this.$refs.dialogRef.hide()

            //this.showy = false  //huh suprised it's not needed!!--toReview**
        },
        /*doCancel () {
            //console.log('huh delete?',this.id)
            this.$emit('onCancel')
            this.showy = false // gotta hide dialog...huh works
        },
        gonHide(){ 
          //console.log(`gonHide...about to hide...`, this.showy,this.oChoice)

          this.$emit('euhHidin')
        },
        onSave () { 
            console.log('huh onSave?',this.oChoice, this.oCheck)
           
            this.$emit('onOk', this.oChoice, this.oCheck)

            this.showy = false // gotta hide dialog...huh works
            
        },*/
        onDialogHidey () {
            // required to be emitted
            // when QDialog emits "hide" event

            this.$emit('hide') //'euhHidin'
            this.onDialogHide()//invoke onDialogHide..no complains..not needed as for onDialogOK below ?!?
            //this.showy = false 
        },

        onOKyClick () {
            // on OK, it is REQUIRED to
            // emit "ok" event (with optional payload)
            // before hiding the QDialog
            //console.log('huh onOKyClick?',this.oChoice, this.oCheck)
           
            this.$emit('ok',{choice:this.oChoice, skipOCheck:this.oCheck})
            // or with payload: this.$emit('ok', { ... })

            // this.onDialogOK(this.oChoice, this.oCheck) //not needed? or for closing dialog?
            // then hiding dialog
            this.hide()
        },

        onCancelyClick () {
        // we just need to hide the dialog
            this.$emit('onCancel')
            
            this.hide()
            this.showy = false // gotta hide dialog...huh works
        }
        /*aScorey(val){
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
        },*/
    }
})
</script>
<style lang="sass" scoped>
.inputBtn
  text-align: center
.title
  position: relative
  display: flex
  justify-content: center
  align-items: center
  height: 100%

.my-dialog
  width: 75%
  background-color: gainsboro

.poppy
  width: 100%

@media (max-width: 500px)
  .poppy
    display: none

</style>