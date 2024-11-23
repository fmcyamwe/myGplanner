<template>
  <div class="q-pa-sm">
    <q-card>
      <q-card-section>
        <div class="text-h4 title">New Ad hoc Event</div>
        <div v-if="useTimeRange" class="q-mx-md do-center">
          <!--@ <em>{{ showRange.start -- showRange.end }}</em> huh cant eval two things at once-->
          @ <em>{{ startRange()}} >> {{ endRange()}}</em>
        </div>
        <div v-else class="q-mx-md do-center">
          @ <em>{{ atTime }}</em>
        </div>
      </q-card-section>
      <q-separator />

      <div class="q-mx-md event-select">
        <q-input
          v-model="evName"
          filled
          label="Title"
          lazy-rules
          item-aligned
          :rules="[(val) => (val && val.length > 1) || 'Please type a goal']"
        />
        <div class="radio-select">
          <q-radio class="q-mx-xs" v-model="own" val="misc" label="Misc" />
          <q-radio class="q-mx-md" v-model="own" val="self" label="By Self" />
        </div>

        <div v-if="pGoals">
          <!--style="width: 100%;"  label="Select Parent Goal"-->
          <q-select
            :class="classy()"
            v-model="daP"
            :options="pGoals"
            option-value="id"
            option-label="title"
            :disable="own != 'misc'"
            :label="labely"
            popupContentClass="q-px-sm"
            :options-selected-class="goalyColor('c')"
            :label-color="goalyColor('l')"
          >
            <template v-slot:before>
              <q-icon
                v-if="daP"
                :name="daP.icon"
                size="14px"
                class="q-mx-md q-pr-sm"
              />
            </template>
          </q-select>
        </div>

        <div v-if="useTimeRange" class="q-ma-md">
          TimeRange: @ <em>{{ startRange()}} >> {{ endRange()}}</em>
          <br>
          <q-toggle
          v-model="manualDura"
          label="Set Duration?"
          left-label
          /><!--:label="manualDura ? 'Use TimeRange' :'Set Duration?'"-->
        </div>

        <div class="row"><!--v-if="!useTimeRange && manualDura"-->
            Duration (min)
          <q-knob
            :min="15"
            :max="120"
            :thickness="0.5"
            :disable="!manualDura"
            :step="5"
            v-model="duration"
            show-value
            size="75px"
            color="teal"
            track-color="grey-3"
            class="q-ma-md"
            style="margin: 0 auto;"
            />
        </div>
      </div>
      <q-card-actions class="q-px-xl q-ma-sm">
        <!--<q-checkbox dense v-model="doForce" label="Force" color="teal"/> -->
        <q-checkbox
          dense
          v-model="useBalance"
          label="Use Balance"
          color="brown"
        />
        <!--class="q-pa-sm"-->
      </q-card-actions>

      <div class="q-ma-md" style="text-align: center">
        <q-btn
          flat
          align="center"
          label="Cancel"
          color="primary"
          @click="$emit('doCancel')"
        />
        <q-btn elevated color="primary" align="between" @click="onClicked">
          <div class="q-mx-xs" style="text-align: center">Add</div>
        </q-btn>
      </div>
      <br />
    </q-card>
  </div>
</template>
<script>
//import { defineComponent } from 'vue' --see about using this...
import { whenFrmtTime } from "../../pages/util/utiFunc";
//import {onMounted } from 'vue'

export default {
  //this be Options Vue notation
  name: "adHocEvent",
  props: {
    mainGoals: Array,
    toBalance: Number,
    at: String,
    timeRange:Object
  },
  data() {
    //onMounted(()=>{ //huh gotta place it here for Options notation--with import
    //  console.log("onMounted")
    //})
    return {
      aTitle: "",
      daP: null, //huh seems to work! an m surprised it show the correct stuff even!
      own: "misc",
      duration: 5,
      useBalance: false,
      atTime: whenFrmtTime(this.at),
      doManual:false
      //timeyRange:showRange
      //doForce:false, //redundant as implicitely force
    };
  },
  emits: [
    "saveEvent",
    "doCancel",
  ],
  mounted() { //umm no need for onMounted import ...also better visibility imo
    //console.log(`mounted`,this.useTimeRange)
    if (!this.useTimeRange){
      //this.doManual = true
      this.manualDura = true //huh both work
    }else{
      this.currentDura = this.timeRange.duration
    }
  },
  computed: {
    pGoals: {
      get() {
        return this.mainGoals;
      }, //no massaging?~? guess not
    },
    currentDura:{
      get() {
        return this.duration;
      },
      set(value) {
        this.duration = value
      }
    },
    manualDura:{
      get() {
        return this.doManual
      },
      set(value) {
        this.doManual = value;
      },
    },
    evName: {
      get() {
        return this.aTitle;
      },
      set(value) {
        //console.log("setting title", value)
        this.aTitle = value;
      },
    },
    labely: {
      get() {
        return this.own == "misc"
          ? this.daP == null
            ? "Defaut Misc. Parent"
            : "Of Parent Goal"
          : "Select Parent Goal"; //umm sheesh
      },
    },
    useTimeRange:{
      get() {
        //console.log(`adHocEvent`,this.at,JSON.stringify(this.timeRange))
        return !this.timeRange.isSame 
      },
    }
  },
  methods: {
    aTimeyRange() {
      if(!this.timeRange){return {}}//atTime
      //this.useTimeRange  //huh works
      let start = this.timeRange.start.split(" ")
      let end = this.timeRange.end.split(" ")
      //console.log(`aTimeyRange::showRange`,start[1],end[1])
      if(!this.timeRange.isSame){ 
        //this.duration = this.timeRange.duration // complain in computed >>ok here
        //this.currentDura = this.timeRange.duration //also works..
        //Have to put in mounted as currentDura gets reset on every re-render
      }//else{ //wouldnt get here
       // console.log(`aTimeyRange::isSaaaame`,start[1],end[1])
       // this.doManual = true //umm set prop instead of using setter..bof not here
      //}
      return {start:whenFrmtTime(start[1]), end:whenFrmtTime(end[1])}
    },
    endRange(){
      let e = this.aTimeyRange()
      //console.log(`aTimeyRange:endRange`,JSON.stringify(e))
      return e.end
    },
    startRange(){
      let e = this.aTimeyRange()
      //console.log(`aTimeyRange:startRange`,JSON.stringify(e))
      return e.start
    },
    goalyColor(l) {
      return this.daP == null
        ? ""
        : l == "c"
        ? "bg-" + this.daP.bgcolor + " " + this.daP?.icon
        : this.daP.bgcolor;
    },
    classy() {
      //hannoying gutter class that messes up look when an option is selected
      return this.daP == null ? "q-gutter-md q-px-md" : "q-px-md";
    },
    onClicked() {
      //console.log(`adHocEvent::onClicked`,this.currentDura,this.timeRange.duration)
      this.$emit(
        "saveEvent",
        this.aTitle,
        this.daP,
        this.own,
        this.currentDura,//duration,
        this.useBalance,
        this.currentDura != this.timeRange.duration //this?  currentDura
        //this.manualDura ////ummm this.manualDura more concise than this.useTimeRange ? >>nope as for view
      );

      //reset
      this.own = "misc";
      this.daP = null;
      this.duration = 5;

      this.useBalance = false;
    },
  },
};
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
  width: 100%
.do-center
  text-align: center
.title
  white-space: nowrap
  text-align:center
@media (max-width: 500px)
  .title
    white-space: break-spaces
    text-align: center
  .radio-select
    display: flex
    flex-direction: row
    justify-content: center
    margin: 0 auto
</style>
