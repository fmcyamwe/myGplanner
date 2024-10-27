<template>
    <div class="q-pa-sm">
        <q-card> <!-- row items-start... style="padding: 2px 2px;"-->
            <div>
                <div class="text-h3 title">Select event</div>
                <div class="q-mx-md do-center"> @ <em>{{ atTime }}</em></div>
            </div>
            <q-separator />
            
            <div class="q-mx-md event-select">
              <q-select
              v-model="toFilterBy" 
              :options="unscheduledP"
              class="q-mx-md"
              option-value="id"
              option-label="title"
              popupContentClass="q-px-sm"
              input-debounce="0"
              label="Filter by Parent Goal"
              behavior="menu">
                <template v-slot:default><!--umm default seems better-->
                  <q-icon v-if="toFilterBy" name="clear" size="14px" @click="clear"/>
                </template>
              </q-select>
            </div>
            <div v-if="this.selectedP" class="q-mx-md event-select">
              <q-select
              v-model="toAdd" 
              :options="allunScheduled"
              :class="classy()"
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
                have to force it as menu so that options dont jump on top of page...smh toMonitor
                class="q-px-md"-->
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No results
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:before><!--append better?-->
                  <q-icon v-if="toAdd" :name="toAdd.ic" size="14px" class="q-mx-md q-pr-sm" />
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
            <div v-if="toAdd" class="q-mx-auto">
              Duration (min)
              <q-knob
                  :min="5"
                  :max="120"
                  :thickness="0.22"
                  :step="5"
                  v-model="dura"
                  show-value
                  size="75px"
                  color="teal"
                  track-color="grey-3"
                  class="q-ma-md"
              />
            </div>
            <br>
            <q-card-actions align="center" class="q-mx-auto">
              <q-checkbox dense v-model="doForce" label="Force In" color="teal" class="q-mx-sm"/>
              <q-space/> 
              <q-checkbox v-if="canBalance()" dense v-model="useBalance" label="Use Balance" color="brown" /> <!--class="q-pa-sm"-->
            </q-card-actions>
            
            <q-card-actions align="center">
              <q-btn flat label="Cancel" color="primary" @click="$emit('doCancel')" />
              <q-btn elevated color="primary" align="between" @click="onAddClicked">
                <div class="q-mx-md"><!-- style="text-align:center;"-->
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
import { whenFrmtTime} from '../../pages/util/utiFunc'

  export default {  //this be Options Vue notation
    name: 'selectEvent',
    props: {
      unscheduled: Array,
      unscheduledParents: Array, //Object, //harder to iterate over Object?--toTry**
      toBalance:Number,
      at:String,
      //doCancel: Function, // can execute function BUT better to emit...
    },
    data(){
      //const allEvts = ref(null)  //toSee when here? >>nope gotta be in return 

      return {
        doForce:false, //ref(false), //force schedule and skip asking confirmation from user...
        selectedE:null,  //ref(null),
        dura:null,  //toTest** changing duration
        useBalance:false,
        allEvts: this.unscheduled,
        unscheduledP:this.unscheduledParents,
        selectedP:null, //filter by parent...
        atTime:whenFrmtTime(this.at)
      }
    },
    emits: [
      'onPickEvent',
      'doCancel'
    ],
    computed: {
      toFilterBy:{
        get(){return this.selectedP},
        set(value){
          this.selectedP = value
          
          this.toAdd ? this.toAdd = null : '' //clear for new parent! //console.log('toAdd...NO stuff')
          //this.allunScheduled = this.unscheduled.filter(v => v.parentGoal == value.id)  //or filter in get of allunScheduled() ? >>prolly subgoals as doesnt update here!!
        }
      },
      allunScheduled:{
        get(){
          if(this.selectedP){
            return this.unscheduled.filter(v => v.parentGoal == this.selectedP.id) 
          }
          return this.allEvts
        },
        //set?!? >>no need! >> 'twas before filtering...
        set(value){
          //this.unscheduled = value  //umm ?? > nope error of mutating props....
          this.allEvts = value
        }
      },
      toAdd:{
        get(){return this.selectedE},
        set(value){
          //console.log('toAdd...setting',value)
          this.selectedE = value
          this.dura = value?.duration || 0 //default 0 needed or complain and shows NA when user doing filtering
        }
      },
    },
    //onBeforeMount(){ //doesnt seem like it's needed....
    //  console.log('onBeforeMount')
    //  this.allScheduled = this.unscheduled
    //},
    methods: {
      clear(){
        this.toFilterBy = null
        this.toAdd = null //to hide others...
      },
      onAddClicked () {
        //console.log('huh picking event', this.toAdd,this.doForce,this.useBalance,this.dura)
        this.$emit('onPickEvent',this.toAdd,this.doForce,this.useBalance,this.dura)

        this.doForce = false
        this.useBalance = false
        this.toAdd = null //huh complains for dura in set() 
      },
      filterFn (val, update, abort) {
        update(() => {
          //if(val == ''){ //huh needed to reset toAdd >> but problem as start empty when there is already a selected toAdd smh >>fixed by using setModel()
            //console.log('empty'+val,this.toAdd)
            //this.empty++
            //this.allScheduled = this.unscheduled
            //this.toAdd = null 
            //return
          //}
          const needle = val.toLowerCase()
          this.allunScheduled = this.unscheduled.filter(v => v?.title.toLowerCase().indexOf(needle) > -1)
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
        return this.toAdd == null ? '' : l == 'c' ? 'bg-'+this.toAdd?.color + " "+ this.toAdd?.ic : this.toAdd?.color  //huh works showing icon--toTry showing in list**
      },
      labely(){ //sheesh gotta check '' too due setModel() above smh
        return (this.toAdd == null  || this.toAdd == undefined || this.toAdd == '') ? ' Sub Goal' : ` Of: ${this.toAdd?.pg || ""}` //<i v-html="${this.toAdd?.ic}"></i>` || <i class="fab fa-accusoft"></i> 
      },
      classy(){  //hannoying gutter class that messes up look when an option is selected
        return (this.toAdd == null  || this.toAdd == undefined || this.toAdd == '') ? 'q-gutter-md q-px-md' : "q-px-md"
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
.event-select
  display: flex
  flex-direction: column
  justify-content: center
  text-align: center
  width: 100%

.scheduly:hover
  width: 10%
.do-center
  text-align: center
.title
  white-space: nowrap
  text-align:center
@media (max-width: 500px)
  .title
    white-space: break-spaces
    text-align: center
    transform: scale(.7)
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
            v-model="selectedE" 
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