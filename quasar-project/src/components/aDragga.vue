<template>
  <main>
    <div class="mt-5 container">
      <div class="row justify-content-center border py-5">
        <div class="col-5">
          <h4 class="mb-3">Draggable 1</h4>
          <draggable class="draggable-list" :list="list1" group="my-group" item-key="name">
           <template #item="{ element }"> 
            <div class="list-item">
              {{ element.name }}
            </div>
           </template>
          </draggable>
        </div>

        <div class="col-5">
          <h4 class="mb-3">Draggable 2</h4>
          <draggable class="draggable-list" v-model="list2" group="my-group" item-key="name">
            <template #item="{element}">
            <div class="list-item">
              {{ element.name }}
            </div>
           </template>
          </draggable>
        </div>

    <!--<div class="text-white text-center">
    <template #item="{ element }"> 
    div class="list-item" v-for="element in list2" :key="element.name"
    v-model="list2" is mutually exclusive with :list="list1"
    <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/"
        label="Go Back"
        no-caps
     />
    </div> -->
      </div>
    </div>
    <div class="bg-white mt-3 p-2 shadow border rounded">
              <!--<p>{{otherValue}}</p> -->
    </div>
  </main>
</template>

<script>
import draggable from 'vuedraggable'  ///vuedraggable/src/vuedraggable
import { useQuasar } from 'quasar'

export default {
  name:'aDragga',
  components: {
    draggable
  },
  data() {
    return {
      list1: [{ name: "Drag Me!" }],
      list2: [{ name: "Drag Me Too!" }]
      //otherValue
    };
  },
  mounted() {
    const $q = useQuasar()
        //$q.localStorage.set('first', "i be first!")

    //keeps data longest as user need to manually clears the browser cache or cleared by app
    //up 10MB for both(or just 5MB each for a total of 10?)
    //can only store strings--but get around this using JSON
    //const aValue = $q.localStorage.getItem("first") 

        //$q.sessionStorage.set('second', "umm second?")
    //persisted only until the window or tab is closed.
    //const otherValue = $q.sessionStorage.getItem("second")

    //console.log(JSON.stringify(aValue, null,1))
    console.log("and then")
    //console.log(JSON.stringify(otherValue, null,1))
  }
  //mounted() {
  //  console.log(JSON.stringify(otherValue, null,1))   //works?
  //}
};
</script>
<style scoped>
.draggable-list {
  background: #3f51b5;
  color: #fff;
  border: 1px solid;
  height: 50vh;
}
.list-item {
  margin: 10px;
  padding: 40px;
  cursor: pointer;
  font-size: 18px;
  border-radius: 5px;
  background: #f44336;
  display: inline-block;
}
</style>