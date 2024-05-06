<template>
    <div class="q-pa-md row items-start">
        <q-card> <!--style="padding: 2px 2px;"-->
            <q-card-section>
                <div class="text-h3">Select event</div>
            </q-card-section>
            <q-separator />
            <div class="q-mx-md event-select">
            <!-- could start being too much goals...break down by parentGoal?!? tbd** maybe could change label='PgoalTitle' ? -->
              <q-select
              v-model="toAdd" 
              :options="allScheduled"
              class="q-gutter-md"
              option-value="id"
              option-label="title"
              popupContentClass="q-px-md scheduly"
              
              :label="labely()"
              :options-selected-class="goalyColor('c')"
              :label-color="goalyColor('l')"
              
              /><!--popupContentStyle="text-align: center;" >>for whole popup! bgColor="red" >>dropbox area(meh...toSee)  margin: 0 auto;
                optionsSelectedClass="bg-red"
                labelColor="green"
                scheduly class!? >dont seem to work... wanted hover to change background to proper color...oh well--toTry later
              -->
            </div>
            
            <q-card-actions align="center">
            <q-checkbox dense v-model="doForce" label="Force" color="teal" class="q-pa-sm" />
            <q-space/> 
            <q-checkbox v-if="canBalance" dense v-model="useBalance" label="Use Balance" color="brown" class="q-pa-sm" />
            </q-card-actions>
            <q-card-actions align="center">
                <q-btn flat label="Cancel" color="primary" @click="$emit('doCancel')"/>
                    
                <q-btn elevated color="primary" @click="onAddClicked"> 
                    <div class="q-mx-md" style="text-align: center;"> 
                        Add 
                    </div>  
                </q-btn>
            </q-card-actions>
 
            <!--<q-card-actions align="evenly">
            <q-btn flat align="center" label="Cancel" color="primary" @click="onCancelPickEvent"/>
            </q-card-actions>  -->
        </q-card>
    </div>
</template>
<script>
//import { defineComponent } from 'vue' --see about using this...
  export default {  //this be Options Vue notation
    name: 'selectEvent',
    props: {
      canBeScheduled: Array,
      toBalance:Number,
      //doCancel: Function, // can execute function BUT better to emit...
    },
    data(){
      return {//no need for ref..prolly
        doForce:false, //ref(false), //force schedule and skip asking confirmation from user...
        toAddE:null,  //ref(null),
        useBalance:false
      }
    },
    emits: [
      'onPickEvent',
      'doCancel'
    ],
    computed: {
      allScheduled:{ //try to add parentGoals somehow?!? toSee**
        get(){return this.canBeScheduled},
        //set?!? >>no need!
      },
      toAdd:{
        get(){return this.toAddE},
        set(value){
          this.toAddE = value
        }
      },
    },
    methods: {
      onAddClicked () {
        //console.log('huh picking event', this.toAdd,this.doForce)
        this.$emit('onPickEvent',this.toAdd,this.doForce,this.useBalance)
        
        //reset...needed prolly...
        this.doForce = false
        this.useBalance = false
        this.toAdd = null 
      },
      goalyColor(l){
        return this.toAdd == null ? '' : l == 'c' ? 'bg-'+this.toAdd?.color : this.toAdd?.color
      },
      labely(){
        return this.toAdd == null ? 'Sub Goal' : 'Of: '+this.toAdd?.pg
      },
      canBalance(){
        ////true when balance >toadd.duration || isAlt?
        let canBalance = this.toBalance + parseInt(this.toAdd?.duration) || this.toAdd?.isAlternative
        console.log(`canBalance`,canBalance)//canBalance...umm
        return this.toAdd == null ? false : (this.toBalance + parseInt(this.toAdd?.duration) || this.toAdd?.isAlternative)
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