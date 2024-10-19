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
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ details }}</q-item-label> <!-- Single line item-->
          <q-item-label caption>{{priority}}</q-item-label>
        </q-item-section>
    </q-item>
    <div class="col row justify-center q-pa-md">  <!--toSee look-->
        <div class="text-subtitle1">
          Subgoals:
        </div>
        <div v-for="sg in subGoals" :key="sg">
          {{ sg }}
        </div>
    </div>
    
</div>

</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'aMainGoal',
  props: {
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
    details: {
      type: String,
      default: ''
    },
    subGoals: {
      type: Array,
      default: [] ////array of subGoals indexes(prolly)
    },
    priority: { ////default priority of importance
      type: Number,
      default: 0
    },
    bgColor: {
      type: String,
      default: 'orange'
    },
    icon: {
      type: String,
      default: 'fas fa-handshake'
    },
  }
})
/*
{ 
    id: 1,
    title: 'Learn Violin',
    details: 'Vi-violin',
    subGoals: [], //array of subGoals indexes(prolly)
    priority: 3, //default priority of importance
    bgcolor: 'red',
    icon: 'fas fa-handshake'
    
},
*/
</script>
