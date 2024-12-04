<template>
    <div class="q-px-sm boxy">
      <!--
      :filter="filterString"
      :filter-method="myFilterMethod"-->
      <q-tree
      :nodes="treeGoals"
      node-key="label"
      v-model:expanded="expanded"
      no-connectors
      dense
      >
      <template v-slot:default-header="prop">
        <div :class="classyColor(prop.node)">
          <q-icon v-if="!prop.node.isChildren" :name="prop.expanded ? 'expand_less' : 'expand_more'" size="28px" right/>
          <div class="q-mr-sm text-weight-bold" size="28px">{{ prop.node.label }}</div>
          <q-icon :name="prop.node.icon" />
        </div>
      </template>
      
      <template v-slot:default-body="prop">
        <div v-if="prop.node.isChildren"
        :draggable="true"
        style="cursor: grab;"
        @touchstart="(e) => onTouchHStart(e,prop.node)"
        @touchmove="(e) => onTouchHEvt(e,prop.node)"
        @touchend="(e) => onTouchHEvt(e,prop.node)"
        >
          <span class="text-weight-bold">  >> {{ prop.node.details }} </span>
          <q-tooltip v-if="prop.node.moods.length > 0">{{ "Moods::> " +prop.node.moods.join(',') }}</q-tooltip>
        </div>
        <span v-else class="text-weight-light text-black" >{{ prop.node.details }}</span>
      </template>
    </q-tree>
 
    </div>
    <!-- 'default-expand-all' but too much 
      also set on first render so cant hack with below to expand after filtering >>
      :default-expand-all="filter.length > 0"-->
    <!--  expandAll>>no can do :(...-->
</template>
<script>
import { ref, defineComponent } from 'vue' //defineAsyncComponent
import { whenFrmtTime,hexColor } from '../../pages/util/utiFunc'

export default defineComponent ({  //this be Options Vue notation
  name: 'treeLegend', //for better built tree legend instead of in goalStorage...could also drag&drop subgoals better?
  props: {
    mainGoals:Array,
    subGoals:Array
  },
  data(){
    const errorMessageScore = ref('')
    const errorScore = ref(false)
    return{
      errorMessageScore,
      errorScore,
      tree:ref([]),
      selectedItem:ref(null),
      expanded:ref([]),//hopefully no need for setter/getter    
    }
  },
  beforeMount() {
    this.constructTree()
  },
  computed: {
    getTree:{
      get(){return this.tree},
      set(value){
        console.log(`tree getting set`,value, this.tree)
        this.tree = value
      }
    },
    selected:{
      get(){return this.selectedItem},
      set(value){
        console.log(`selectedItem getting set`,value, this.selectedItem)
        this.selectedItem = value
      }
    }
  },
  methods:{
    classyColor(proppy){//bg-{color} or text-{color} in class
      return `row items-center ${proppy.isChildren ? 'text-' : 'text-white bg-'}${proppy.color} `  //oldie >> bg-${proppy.color}
    },
    constructTree(){
      console.log(`constructing tree...`,this.mainGoals.length, this.subGoals.length)
        let sorty = (a, b) => { 
          if (a.id > b.id) return 1; 
          if (a.id == b.id) return 0; 
          if (a.id < b.id) return -1;
        }

        let findSubGoals = parentID => {
          let map = []
          //let allSubGoals = this.getSubGoals
          if(!this.subGoals) { //allSubGoals
              //console.log("No subgoals")
              return map
          }

          this.subGoals.forEach(event => {
            if (event.parentGoal == parentID) {
              map.push(event)
            }
          })

          //return map
          return map.sort(sorty)   //umm sort here instead as id not changed later
        }

      let tree = []

      if(!this.mainGoals){
        console.log("No mainGoals :(")
        return tree
      }

      this.mainGoals.forEach(goal => {
        /*let toAdd = {
          id: goal.id, //for sorting....
          label: `${goal.id}) ${goal?.title.trim()}`,
          details:`${goal.details} ==> Priority (${goal?.priority})`,
          color:`${goal?.bgcolor}`,
          prio: goal?.priority, //for now in label...
          icon:goal?.icon, //toReview if not redundant...
          children:[]
        }*/

        let parent = {
          id: goal.id, //for sorting....
          label: `${goal.id}) ${goal?.title.trim()}`,
          header: `${goal.id}) ${goal?.title.trim()}`, ////same as above
          details:`${goal.details} ==> Priority (${goal?.priority})`,
          body:`${goal.details} ==> Priority (${goal?.priority})`, //same as above
          color:`${goal?.bgcolor}`,
          //prio: goal?.priority, //redundant as in label...
          icon:goal?.icon,
          expandable:true, //or should calc children.length > 0 ?
          selectable:false, //prolly?
          children:[],
          //handler?: (node: QTreeNode<TExtra>) //for click?
        }

        let subG = findSubGoals(goal.id)
        for (let i = 0; i < subG.length; i++) {
          let def = subG[i].inDefaults ? 'Dft' : '#'
          let cM = subG[i].canMove ? 'Mv' : '#'
          let alt = subG[i].isAlternative ? 'Alt' : '#'
          let mess =  [`${whenFrmtTime(subG[i]?.time)} for ${subG[i]?.duration} mins`, //bon proper multiline? >>especially using .join(\n) >>nope! smh  >>> gotta use css class!!
                `:: ${def}~${cM}~${alt}`].join('\n')
          
          //console.log("findSubGoals",JSON.parse(JSON.stringify(mess))) //JSON.parse(JSON.stringify(mess.join('\n')))
          parent.children.push({
            id: `${goal.id}-${subG[i].id})`, //see if better for nodeKey  //oldy >> subG[i].id, 
            label: `${subG[i].id})- ${subG[i]?.title.trim()} (${subG[i]?.score})`,
            header: `${subG[i].id})- ${subG[i]?.title.trim()} (${subG[i]?.score})`, //toSee
            details: mess,
            body: mess, //toSee same as above
            color:`${goal?.bgcolor}`, //use hexColor? meh named color...
            isChildren:true,
            selectable:true, //see if easier for drag&drop 
            expandable:false, //redundant? what is effect of this?
            moods: subG[i].jeSuis || []
          })
        }
          
        console.log("Childy "+goal.id,JSON.stringify(parent.children))//JSON.parse(JSON.stringify(toAdd.children)))

        //no need for below as id modified here...sorting done in findSubGoals()
        //let tC = parent.children
        //tC.sort(sorty)
        //parent.children = tC

        //console.log("Childy-After"+goal.id,JSON.parse(JSON.stringify(tC)),JSON.parse(JSON.stringify(toAdd.children)))

        tree.push(parent) // children.sort(sorty) >> works? >>nope fucks up array...
      })

      console.log("Tree-Before",JSON.stringify(tree)) //JSON.parse(JSON.stringify(tree)))

      tree.sort(sorty) //umm should be ok for parents?!?

      console.log("Tree-AFTER",JSON.stringify(tree))//JSON.parse(JSON.stringify(tree)))
      
      this.getTree = tree //hopefully updates smh

      //return tree
    },
    onTouchHStart(e, item){
      console.log('onTouchHStart', e,item,e.target) 
      /*if(type == 'tree-item'){
        let it = this.daSchedule.getSubGoalByID(item.id)
        console.log('onTouchHStart::TreeItem '+type, JSON.stringify(item),JSON.stringify(it)) //this.doLog
        this.selectedItem = {evt:{...it,color:item.color}, type:type} //sheesh BEWARE** passing in color like this smh

        //below to show change...test for tree-item-
        //-should put in touchHold perhaps?!?
        e.target.classList.add("my-header-drag")
        this.touchedItem = e.target  //save to remove css class later

        e.preventDefault()
        return //normal return to allow rest of touch...//true 
      }*/

      //this.selectedItem = {evt:item, type:type} //no need
      

      e.target.classList.add("my-header-drag")
      //this.touchedItem = e.target  //save to remove css class later

      this.selected = {evt:item, touched:e.target}

      e.preventDefault()
      return //true
    },
    onTouchHEvt(e, item){
    //console.log('onTouchHEvt', e,item)
    if(e.type == "touchmove"){
      let target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
      
      let color = this.selected.evt.bgcolor ?? this.selected.evt.color
      console.log('onTouchHEvt::touchmove', color,JSON.stringify(item),JSON.stringify(target.classList))
      
      /*if(target.ariaLabel){ //in calendar...
        
        let s = this.getLabelTime(target.ariaLabel) //getTimey(target.ariaLabel)
        //console.log('onTouchHEvt::touchmove>>TARGET', target,s)
        if (this.targetDrop){ //skip when same...
          let changedBy = diffTimestamp(this.targetDrop,s) 
          let isSame = JSON.stringify(this.targetDrop) === JSON.stringify(s)
          if (isSame && changedBy == 0){
            //console.log('onTouchHEvt::touchmove>>TARGETSAME', target,s,isSame, changedBy)
            return //true
          }
          let color = this.selectedItem.evt.bgcolor ?? this.selectedItem.evt.color
          if(!this.lastTarget){
            this.lastTarget = target
            target.style.background = hexColor(color) //color.includes("-") ? 'grey' : color //this.selectedItem.evt.bgcolor.includes("-") ? 'grey' : this.selectedItem.evt.bgcolor  //or .color //using `bg-${this.selectedItem.bgcolor}` doesnt work as should be a css class  //oldie >>'pink'
          }else{
            this.lastTarget.style.background = '' //remove from old
            target.style.background = hexColor(color) //color.includes("-") ? 'grey' : color //this.selectedItem.evt.bgcolor.includes("-") ?'grey' : this.selectedItem.evt.bgcolor
            this.lastTarget = target 
          }
        }
        this.targetDrop = s

        e.preventDefault() //just in calendar to prevent scrolling >> meh no change
        return //true //umm better here to prevent scroll? >>nope 
        //bon leave above here to replicate touchEvt...
        //false for preventDefault instead of explicit invoking...
      }*/

      e.preventDefault()
      return

      //e.preventDefault()//umm get >> Ignored attempt to cancel a touchmove event with cancelable=false 
      //return //see if touchend happens or need true? //true //false >>better at stopping scroll BUT no touchend afterward?
    }
    
    if(e.type == "touchend"){
      //console.log('onTouchHEvt::Touchend',e.defaultPrevented)
      let target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)

      //remove css class
      this.selected.touched.classList.contains("my-header-drag") ? this.selected.touched.classList.remove("my-header-drag") : console.log('onTouchHEvt::touchend>>No Header?!?',this.selected.touched)//JSON.stringify
      
      /*
      this.selectedItem?.type == 'tree-item' ? this.morphClose() : console.log('onTouchHEvt::touchend>>No need to MorphClose?!?',JSON.stringify(this.selectedItem))

      if(target.ariaLabel){
        let s = this.getLabelTime(target.ariaLabel)
        //console.log('onTouchHEvt::touchend>>TARGET', target,s,this.lastTarget)
       
        this.targetDrop = s
        
        this.doDroppy(this.targetDrop, this.selectedItem)
      }else { //on top of other evt...
        //console.log('onTouchHEvt::touchend>>TARGETTOP?', target,this.targetDrop)
        if (this.targetDrop){//just drop on top to see--ToReview **
          this.doDroppy(this.targetDrop, this.selectedItem)   //should act as a drop in mobile
        }
      }*/
     
      console.log('onTouchHEvt::touchEnd',JSON.stringify(target.classList),JSON.stringify(this.selected))
      
      //prolly reset this.selected....
      e.preventDefault()
      e.stopPropagation()

      return
    }

    console.log("onTouchHEvt::UNKNOWN",e.type,JSON.stringify(e))

  },
  }
})
</script>
<style lang="sass" scoped>
.boxy
  display: block
  width: 100%
  height: 100%
  border: 1px solid #888
  border-radius: 10px
  box-sizing: border-box
  box-shadow: 0 0 8px 0 rgba(0,0,0,0.25)

.my-header-drag
  outline: 1px dashed #213
  opacity: 0.7
  z-index: 9
  transform: scale(1.5)
  transition: transform 100ms linear

</style>
