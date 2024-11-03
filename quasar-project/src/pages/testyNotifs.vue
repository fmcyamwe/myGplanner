<template>
  <div class="column justify-around q-px-md q-pt-md">
    <!--items-start row no-wrap -->

    <div class="row justify-center q-pa-md">
      <div class="text-subtitle1">DeviceInfo Info</div>
      <div v-for="status in logDeviceInfo" :key="status">
        {{ status }}
      </div>
    </div>

    <div class="row justify-center q-pa-md">
      <div class="text-subtitle1">BatteryInfo Info</div>
      <div v-for="status in logBatteryInfo" :key="status">
        {{ status }}
      </div>
    </div>
  </div>

  <div>
    <q-btn
      class="q-mt-xl"
      color="white"
      text-color="blue"
      unelevated
      to="/"
      label="Go Back"
      no-caps
    />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
//import { Camera, CameraResultType } from '@capacitor/camera'
//import { Capacitor, Plugin } from "@capacitor/core"; // Plugins deprecated....>>borks with error >> not provide an export named 'Plugin'
//import { WebPlugin } from "@capacitor/core";

//import { ... } from '@capacitor/local-notifications'  //local-notifications also found..added in src-capacitor/package.json as dependency..toSee?

import { Device } from "@capacitor/device";
//COULD use "capacitor-persistent-notification" tho?!?

//const { PersistentNotification, App, BackgroundTask } = Plugins;

//import { PersistentNotificationPlugin } from './definitions';

//import Echo from '../path/to/echo-plugin'; //when using plugin...toTry**

//const { value } = await Echo.echo({ value: 'Hello World!' });
//console.log('Response from native:', value);

export default {
  setup() {
    const status1 = ref([]);
    const status2 = ref([]);
    const msg = ref("suup");
    const logBatteryInfo = ref({}); //null
    const logDeviceInfo = ref({});
    //const { PersistentNotification } = Plugin; // :(
    /*below dont work... have to declare and assign in onMounted
    const logDeviceInfo = async () => {
      const info = await Device.getInfo();

      console.log(info);
    };
    const logBatteryInfo = async () => {
      const info = await Device.getBatteryInfo();

      console.log(info);
    };*/
    onMounted(() => {
      Device.getInfo().then((info) => {
        //model.value = info.model
        //manufacturer.value = info.manufacturer
        console.log("getInfo", info); //WORKS!!!
        logDeviceInfo.value = info; //huh works
      });

      Device.getBatteryInfo().then((info) => {
        //model.value = info.model
        //manufacturer.value = info.manufacturer
        console.log("getBatteryInfo", info);

        logBatteryInfo.value = info; //huh works!
      });
    });
    return {
      status1,
      status2,
      msg,
      logBatteryInfo,
      logDeviceInfo,
      /*handler1 (mutationRecords) {
          status1.value = []
          for (const index in mutationRecords) {
            const record = mutationRecords[ index ]
            const info = `type: ${record.type}, nodes added: ${record.addedNodes.length > 0 ? 'true' : 'false'}, nodes removed: ${record.removedNodes.length > 0 ? 'true' : 'false'}, oldValue: ${record.oldValue}`
            status1.value.push(info)
          }
        },
        handler2 (mutationRecords) {
          status2.value = []
          for (const index in mutationRecords) {
            const record = mutationRecords[ index ]
            const info = `type: ${record.type}, nodes added: ${record.addedNodes.length > 0 ? 'true' : 'false'}, nodes removed: ${record.removedNodes.length > 0 ? 'true' : 'false'}, oldValue: ${record.oldValue}`
            status2.value.push(info)
          }
        },
        // store the id of the draggable element
        onDragStart (e) {
          e.dataTransfer.setData('text', e.target.id)
          e.dataTransfer.dropEffect = 'move'
        },
        onDragEnter (e) {
          // don't drop on other draggables
          if (e.target.draggable !== true) {
            e.target.classList.add('drag-enter')
          }
        },
        onDragLeave (e) {
          e.target.classList.remove('drag-enter')
        },
        onDragOver (e) {
          e.preventDefault()
        },
        onDrop (e) {
          e.preventDefault()
          console.log("ooh dropping")
          // don't drop on other draggables
          if (e.target.draggable === true) {
            return
          }
          const draggedId = e.dataTransfer.getData('text')
          const draggedEl = document.getElementById(draggedId)
          // check if original parent node
          if (draggedEl.parentNode === e.target) {
            e.target.classList.remove('drag-enter')
            return
          }
          // make the exchange
          draggedEl.parentNode.removeChild(draggedEl)
          e.target.appendChild(draggedEl)
          e.target.classList.remove('drag-enter')
        }*/
    };
  },
};
</script>
<style scoped lang="sass">
.drop-target
  height: 400px
  width: 200px
  min-width: 200px
  background-color: gainsboro
.drag-enter
  outline-style: dashed
.box
  width: 100px
  height: 100px
  float: left
  cursor: pointer
@media only screen and (max-width: 500px)
  .drop-target
    height: 200px
    width: 100px
    min-width: 100px
    background-color: gainsboro
  .box
    width: 50px
    height: 50px
  .box:nth-child(3)
    clear: both
  .navy
    background-color: navy
  .red
    background-color: firebrick
  .green
    background-color: darkgreen
  .orange
    background-color: orange
</style>
