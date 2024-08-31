<template>
    <div class="q-pa-md">
        <q-card> <!-- row items-start... style="padding: 2px 2px;"-->
            <q-card-section>
                <div class="text-h3">Select event</div>
            </q-card-section>
            <q-separator />
            
            <div class="q-mx-md event-select">
              <q-select
              v-model="toAdd" 
              :options="allScheduled"
              class="q-gutter-md q-px-md"
              option-value="id"
              option-label="title"
              popupContentClass="q-px-sm"
              :label="labely()"
              :options-selected-class="goalyColor('c')"
              :label-color="goalyColor('l')"
              @filter="filterFn"
              @input-value="setModel"
              use-input
              hide-selected
              fill-input
              input-debounce="0"
              behavior="menu"><!--behavior?: "default" | "menu" | "dialog" | undefined; >> menu on desktop and dialog on mobiles 
                have to force it as menu so that options dont jump on top of page...smh toMonitor-->
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No results
                    </q-item-section>
                  </q-item>
                </template>
                <!--behavior?: "default" | "menu" | "dialog" | undefined; >> menu on desktop and dialog on mobiles
                  <template v-if="toAdd" v-slot:prepend>
                  <q-icon name="cancel" @click.stop.prevent="toAdd = null" class="cursor-pointer" />
                </template> bon too ugly and append goes way too far...-->
              </q-select>
              <!-- using the filterFn >> lose the background color of selected smh....@remove handler?!>>nope dont work either---setModel is better
                
                popupContentStyle="text-align: center;" >>for whole popup! bgColor="red" >>dropbox area(meh...toSee)  margin: 0 auto;
                optionsSelectedClass="bg-red"
                labelColor="green"
                scheduly class!? >dont seem to work... wanted hover to change background to proper color...oh well--toTry later...maybe
                
                could start being too much goals?...break down by parentGoal?!? tbd**
                  >>see if filterFn is good and the change of label='PgoalTitle' ?
                -->
            </div>
            
            <q-card-actions align="center" class="q-px-xl">
              <q-checkbox dense v-model="doForce" label="Force" color="teal"/> <!--class="q-pa-sm"-->
              <q-space/> 
              <q-checkbox v-if="canBalance()" dense v-model="useBalance" label="Use Balance" color="brown" /> <!--class="q-pa-sm"-->
            </q-card-actions>
            <q-card-actions align="center">
              <q-btn flat label="Cancel" color="primary" @click="$emit('doCancel')" />
              <q-btn elevated color="primary" @click="onAddClicked">
                <div class="q-mx-md" style="text-align:center;">
                  Add 
                </div>
              </q-btn>
            </q-card-actions>
        </q-card>
    </div>
</template>
<script>
//import { defineComponent } from 'vue' --see about using this...
//import { ref, onBeforeMount } from 'vue'

  export default {  //this be Options Vue notation
    name: 'selectEvent',
    props: {
      canBeScheduled: Array,
      toBalance:Number,
      //doCancel: Function, // can execute function BUT better to emit...
    },
    data(){
      //const allEvts = ref(null)  //toSee when here? >>nope gotta be in return 

      return {//no need for ref..prolly
        doForce:false, //ref(false), //force schedule and skip asking confirmation from user...
        toAddE:null,  //ref(null),
        useBalance:false,
        allEvts: this.canBeScheduled,//bon start with this....//null //ref(null)
        //empty:0 //smh >>no need as was hackish way to reset toAddE when not filtering!
      }
    },
    emits: [
      'onPickEvent',
      'doCancel'
    ],
    computed: {
      allScheduled:{
        get(){return this.allEvts}, //return this.canBeScheduled
        //set?!? >>no need! >> 'twas before filtering...
        set(value){
          //this.canBeScheduled = value  //umm ?? > nope error of mutating props....
          this.allEvts = value
        }
      },
      toAdd:{
        get(){return this.toAddE},
        set(value){
          this.toAddE = value
        }
      },
    },
    //onBeforeMount(){ //doesnt seem like it's needed....
    //  console.log('onBeforeMount')
    //  this.allScheduled = this.canBeScheduled
    //},
    methods: {
      onAddClicked () {
        //console.log('huh picking event', this.toAdd,this.doForce)
        this.$emit('onPickEvent',this.toAdd,this.doForce,this.useBalance)

        this.doForce = false
        this.useBalance = false
        this.toAdd = null 
      },
      filterFn (val, update, abort) {
        update(() => {
          //if(val == ''){ //huh needed to reset toAdd >> but problem as start empty when there is already a selected toAdd smh >>fixed by using setModel()
            //console.log('empty'+val,this.toAdd)
            //this.empty++
            //this.allScheduled = this.canBeScheduled
            //this.toAdd = null 
            //return
          //}
          const needle = val.toLowerCase()
          this.allScheduled = this.canBeScheduled.filter(v => v?.title.toLowerCase().indexOf(needle) > -1)
        })
        //abort(() =>{ //bof dont seem like it can run...
        //  console.log('huh...abort?'+val,this.toAdd)
        //})
      },
      setModel(val){
        //console.log('huh...setModel?',this.toAdd, val)
        this.toAdd = val 
      },
      //removeFn(details) { //doesnt run smh--toRemove***
      //  console.log('huh...removeFn?',details)
      //},
      goalyColor(l){
        //console.log(`goalyColor `+l,this.toAdd?.color, this.allScheduled.length)
        return this.toAdd == null ? '' : l == 'c' ? 'bg-'+this.toAdd?.color : this.toAdd?.color
      },
      labely(){ //sheesh gotta check '' too due setModel() above smh
        return (this.toAdd == null  || this.toAdd == undefined || this.toAdd == '') ? ' Sub Goal' : ' Of: '+this.toAdd?.pg
      },
      canBalance(){
        let canBalance = this.toBalance + parseInt(this.toAdd?.duration) || this.toAdd?.isAlternative
        //console.log(`canBalance`,canBalance,this.toBalance) //undefined, null 
        return this.toAdd == null ? false : canBalance //(this.toBalance + parseInt(this.toAdd?.duration) || this.toAdd?.isAlternative)
      }
    }
}
</script>
<style lang="sass" scoped>
.radio-select
  margin: 0 auto
  padding: 20px
  width: 100%
.event-select
  display: flex
  flex-direction: column
  justify-content: center
  text-align: center
  width: 100%

.scheduly:hover
  width: 10%

</style>


    <!-- original...
      <q-dialog v-model="showSelectDialog" transition-show="rotate" transition-hide="rotate" no-esc-dismiss @before-hide="gonHide">
        <q-card> //style="padding: 2px 2px;"//
          <q-card-section>
            <div class="text-h3">Select event</div>
          </q-card-section>
          <q-separator />
          <div class="q-ma-md event-select">
            <q-select
            v-model="toAddE" 
            :options="allScheduled"
            option-value="id"
            option-label="title"
            label="Sub Goal"
            item-aligned
            borderless
            popupContentClass="q-gutter-md"
            />
          </div>
          <q-card-actions align="center">
            <q-checkbox dense v-model="doForce" label="Force" color="teal" class="q-pa-sm" />
          </q-card-actions>
          <q-card-actions align="center">
            <q-btn flat label="Cancel" color="primary" @click="onCancelBtn"/>
            
            <q-btn elevated color="primary" @click="onAddClicked"> Add </q-btn>
          </q-card-actions>
          //<q-card-actions align="evenly">
          //  <q-btn flat align="center" label="Cancel" color="primary" @click="onCancelPickEvent"/>
          //</q-card-actions> 
        </q-card>
       </q-dialog> -->