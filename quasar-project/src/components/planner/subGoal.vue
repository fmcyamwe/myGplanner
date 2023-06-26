<template>
<div class="q-pa-md" style="max-width: 550px">
    <!--<q-list bordered padding> -->
    <q-separator spaced></q-separator>

    <q-item-label header>{{ title }}</q-item-label>  <!--List Header -->

    <q-item clickable v-ripple>
        <q-item-section top thumbnail class="q-ml-none">
          <!--<img src="https://cdn.quasar.dev/img/mountains.jpg"> -->
          <!--<img :src="MImg" style="height: 140px; max-width: 150px" /> -->
          <!--<q-img
          :src="mangaImage"
          spinner-color="white">
          </q-img>-->
           <q-item-label>{{ score }}</q-item-label> 
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ time }}</q-item-label> <!-- Single line item-->
          <q-item-label caption>{{duration}}</q-item-label>
        </q-item-section>

      </q-item>
</div>

</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'aSubGoal',
  props: {
    parentGoal: {
      type: Number,
      default: 0, //doesnt need to have a parentGoal as could be upgraded to mainGoal maybe?)
    },
    id: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      default: '',
      validator: (value) => {
        return value != ''
      }
    },
    score: {
      type: String,
      required: true,
      default: '1on3', //toReview as will need parsing
      //validator: (value) => {
      //  return value != ''  //should be an reg. expression of format: #on#
      //}
    },
    duration: {
      type: Number,
      default: 15 //default duration(minutes)
    },
    time: {  // default time to be scheduled 
      type: String,
      required: true,
      default: '13:00',  //prolly shouldnt set default?
    },
    canMove: { //if can be moved around once scheduled or other stuff have to move
      type: Boolean, //beware of casting behavior**
      default: 'true'
    }
  }
})
/*
{ 
    parentGoal: 1,
    id:3,
    title: 'Learn Violin',
    score: '3on5',
    duration: 30, //default duration
    time: '', // default time to be scheduled
    canMove: true, //if can be moved around once scheduled or other stuff have to move
},
*/
</script>