<template><!--umm dropdown in dropdown!! huh possible!!-->
      <q-btn-dropdown
        text-color="teal"
        no-caps
        :label="daLabel"
        dropdown-icon="change_history"
        :onBeforeHide="reset"
      >
      <!--<div class="text-h6 q-mx-md">{{ daLabel }}</div>-->
        <div class="row">
          <div class="col-xs-12 col-sm-6 col-md-12">
            <div class="row q-ma-md">
                <div class="text-h6 q-mx-xs">Sign: </div>
                <q-btn-dropdown color="primary" :label="chosen" no-caps align="evenly"><!--class="q-mx-md"-->
                    <q-list>
                        <q-item v-for="e in compareOptions" :key="e.name" clickable @click="onCompareSelect(e)" v-close-popup>
                            <q-item-section style="text-align: center;">
                            <q-item-label>{{ e.label }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
            </div>
          </div>  
          <div class="col-xs-12 col-sm-6 col-md-12">
            <q-select
                filled
                v-model="selected"
                :options="daOptions"
                popupContentStyle="text-align: center;"
                class="q-mx-md"
                label="Select"
                style="margin: 0 1em 0 1em;"
            /><!--style="width: 25%;" class="q-mx-md" literally impossible to center selected smh-->
          </div>
        </div>
          <!--<q-separator vertical inset class="q-mx-lg"/> -->
  
        <div class="column items-center" v-if="comp">
            <!--<q-avatar size="72px">
              <img src="https://cdn.quasar.dev/img/boy-avatar.png">
            </q-avatar>-->
            <div class="text-subtitle1 q-ma-sm">{{ summaryLabel }}</div>
  
            <q-btn
              color="teal"
              label="GO"
              push
              size="sm"
              class="q-mb-sm"
              style="width: 90%;"
              @click="onClicked"
              v-close-popup
            />
        </div>
      </q-btn-dropdown>
</template>

<script>
import { defineComponent,ref } from 'vue'   //needed to have the intelliSense?!?
export default defineComponent ({  //this be Options Vue notation
  name: 'altMultiDropBtn',
  props: {
    daLabel:String,
    daOptions: Array
  },
  data() {
    //const label = ref('')
    //const comp = ref(null)
    //const summaryLabel = ref('')
    const wording={'lesserThan':'Less or Equal','greaterThan':'Greater or Equal','equalTo':'Equal'} //proper wording
    return {
        compareOptions:[{name:'lesserThan',label:'<='},{name:'equalTo',label:'=='},{name:'greaterThan',label:'>='}],
        label:ref(''),
        comp:ref(null),
        choice:ref(null),
        wording //gotta return smh
    }
  },
  emits: [
    'doReload',
    //'chooseOption'
  ],
  computed: {
    summaryLabel:{
        get(){
            let hasOldy = this.daLabel.indexOf("<=") || this.daLabel.indexOf("==") || this.daLabel.indexOf(">=") //sheesh just to not show old label smh --toReview**
            //console.log('huh summaryLabel',hasOldy,this.daLabel)
            return this.comp ? `Reload ${hasOldy > -1 ? "By "+this.daLabel.slice(0,hasOldy) : this.daLabel} ${this.wording[this.comp.name]} to ${this.choice ? this.choice : "none?"}` : ''
        },
    },
    chosen:{
        get(){return this.label == '' ? 'Choose' : this.label}, //should have default?!?toReveiew** as would have to pass it in...
    },
    selected:{
        get(){return this.choice},
        set(e){
            this.choice = e

            //this.summaryLabel = `Reload by ${this.daLabel} ${this.comp.name} ${this.choice}`
            //better updates as computed prop
        }
    },
  },
  methods: {
    onCompareSelect(e){
        //console.log('huh onItemClick',e,this.comp)
        this.label = e.label
        //reset summaryLabel when this.comp changed for update....
        //also reset this.choice? toSee but prolly no need...
        //meh no need when using computed!
        /*if (this.comp && this.comp.name != e.name){
            //this.summaryLabel = ''
            this.comp = e
            return
        }*/
        this.comp = e
    },
    onClicked () {
      //console.log('huh onClicked',this.comp,this.selected)
      this.$emit('doReload',this.comp,this.selected)
    },
    reset(){ //doesnt close popup after onClicked above so have to invoke in hide function smh
        this.label=''
        this.comp=null
        this.choice=null
    }
  }
})
</script>
<style lang="sass" scoped>
.radio-select
  display: flex
  justify-content: center
  margin:0 auto
  width: 100%
  padding-inline:30px

@media (max-width: 500px)
  .myHeading
    font-size: 0.5em

  .key
    display: none
</style>