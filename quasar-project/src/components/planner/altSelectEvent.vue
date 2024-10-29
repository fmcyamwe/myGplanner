<template><!--replaces selectEvent-->
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
              label="Parent Goal"
              behavior="menu">
                <template v-slot:default><!--umm default seems better-->
                  <q-icon v-if="toFilterBy" name="clear" size="14px" @click="clear"/>
                </template>
              </q-select>
            </div>
            <div v-if="selectedParent" class="q-mx-md event-select">
                <q-select
                v-model="toAdd" 
                :options="filteredUnScheduled"
                :class="classy()"
                option-value="id"
                option-label="title"
                popupContentClass="q-px-sm"
                :label="labely()"
                :options-selected-class="goalyColor('c')"
                :label-color="goalyColor('l')"
                input-debounce="0"
                behavior="menu"><!--oldie params >> use-input,hide-selected,fill-input used for filtering when too many goals and no filter by parentGoal-->
                <template v-slot:before><!--append better?-->
                  <q-icon v-if="toAdd" :name="selectedParent.ic" size="14px" class="q-mx-md q-pr-sm" />
                </template>
              </q-select>
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
import { whenFrmtTime,doLog} from '../../pages/util/utiFunc'

export default {  //this be Options Vue notation
    name: 'altSelectEvent',
    props: {
        allUnscheduled: Array, //toRename** --unscheduled
        unscheduledParents: Object, //Array, //harder to iterate over Object
        toBalance:Number,
        at:String,
        //doCancel: Function, // can execute function BUT better to emit...
    },
    data(){
      //const allEvts = ref(null)  //toSee when here? >>nope gotta be in return 

      return {
        doForce:false, //ref(false), //force schedule and skip asking confirmation from user...
        selectedE:null,  //ref(null),
        dura:null, 
        useBalance:false,
        allEvts: this.allUnscheduled,
        selectedParent:null, //filter by parent...
        atTime:whenFrmtTime(this.at)
      }
    },
    emits: [
      'onPickEvent',
      'doCancel'
    ],
    computed: {
        unscheduledP:{
            get(){
                //console.log(`unscheduledPGoals`,JSON.parse(JSON.stringify(this.unscheduledP)))
                let ret = []
                for (let key in this.unscheduledParents){
                    ret.push(this.unscheduledParents[key])
                }
                //console.log(`unscheduledPGoals`,JSON.parse(JSON.stringify(this.unscheduledP)),JSON.parse(JSON.stringify(ret)))
                //doLog(`altSelectEvent::unscheduledPGoals`,this.unscheduledParents,ret) //JSON.parse(JSON.stringify(this.unscheduledP)),JSON.parse(JSON.stringify(ret))
                return ret
            },
            //set(value){ //no need..
            //  
            //}
        },
        toFilterBy:{
            get(){return this.selectedParent},
            set(value){
                this.selectedParent = value
            
                this.toAdd ? this.toAdd = null : '' //clear for new parent! //console.log('toAdd...NO stuff')
                //this.allunScheduled = this.unscheduled.filter(v => v.parentGoal == value.id) >>no work >> have to filter subgoals in get of filteredUnScheduled() as doesnt update here!!
            }
        },
        filteredUnScheduled:{
            get(){
                if(this.selectedParent){
                    return this.allUnscheduled.filter(v => v.parentGoal == this.selectedParent.id) 
                }
                return this.allEvts
            },
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
      goalyColor(l){
        //console.log(`goalyColor `+l,this.toAdd?.color, this.allScheduled.length)
        return this.toAdd == null ? '' : l == 'c' ? 'bg-'+this.toFilterBy?.color + " "+ this.toFilterBy?.ic : this.toFilterBy?.color  //huh works showing icon--toTry showing in list**
      },
      labely(){ //sheesh gotta check '' too due setModel() above smh
        return (this.toAdd == null  || this.toAdd == undefined || this.toAdd == '') ? ' Sub Goal' : ` Of: ${this.toFilterBy?.title || ""}` //<i v-html="${this.toAdd?.ic}"></i>` || <i class="fab fa-accusoft"></i> 
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

.scheduly--NoWork:hover
  width: 10%
.do-center
  text-align: center
.title
  white-space: nowrap
  padding: 20px
@media (max-width: 500px)
  .title
    white-space: break-spaces
    text-align: center
    transform: scale(.7)
    padding: 2px
</style>
