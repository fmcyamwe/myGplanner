<template>
    <q-page class="flex flex-center column q-gutter-y-md">
        <img alt="Quasar logo" src="../assets/quasar-logo-vertical.svg">
        <q-btn :label="alarmTestTime + 'sec: vibrate'" @click="setAlarm(alarmTestTime, false)"/>
        <q-btn :label="alarmTestTime + 'sec: sound'" @click="setAlarm(alarmTestTime, true)"/>
        <q-btn label="notify()" @click="notify()"/>
    
    <!--<div class="column justify-around q-px-md q-pt-md">
      //items-start row no-wrap 
  
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
    </div>-->
  
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
    </q-page>
</template>
  
<script>
import { ref, onMounted } from "vue";
  //import { Camera, CameraResultType } from '@capacitor/camera'
  //import { Capacitor, Plugin } from "@capacitor/core"; // Plugins deprecated....>>borks with error >> not provide an export named 'Plugin'
  //import { WebPlugin } from "@capacitor/core";
  
  //import { ... } from '@capacitor/local-notifications'  //local-notifications also found..added in src-capacitor/package.json as dependency..toSee?
  
import { Device } from "@capacitor/device";
import {
parseDate,
addToDate,
} from '@quasar/quasar-ui-qcalendar/src/index.js'

//import { Plugins } from '@capacitor/core' //deprecated
//const { CapacitorAlarmNotification, LocalNotifications } = Plugins

//import { CapacitorAlarmNotificationPlugin } from '../otherDefs' ; //LocNotifications

//import { LocNotifications } from '../boot/notifs' ; //huh suprised works....
import { LocalNotifications } from '@capacitor/local-notifications';  //trying straight up...was that the problem?!?

import {LocNotifications} from '../notifHelper'; //huh use of class is no prob!!

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
      const alarmTestTime = 3
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
          console.log("getInfo",JSON.stringify(info)); //JSON.parse(JSON.stringify(info))
          logDeviceInfo.value = info; //huh works
        });
  
        Device.getBatteryInfo().then((info) => {
          //model.value = info.model
          //manufacturer.value = info.manufacturer
          console.log("getBatteryInfo",JSON.stringify(info)); //JSON.parse(JSON.stringify(info))
  
          logBatteryInfo.value = info; //huh works!
        });
      });
      return {
        status1,
        status2,
        msg,
        logBatteryInfo,
        logDeviceInfo,
        alarmTestTime: alarmTestTime
        
      };
    },
    methods: {
        setAlarm: function (sec, soundMode) {
            LocalNotifications.setAlarm({ //dont work** //LocNotifications
                sec: sec,
                sound: soundMode,
                title: 'Boost',
                text: 'suuup'
            })
        // Alarm.setAndUpdate({ 'min': min })
            .then((res) => {
                console.log("setAlarm::good",JSON.stringify(res))
            // alert(resApp['min'])
            }).catch((err) => {
                console.log("setAlarm::ERROR",JSON.stringify(err))
            })
        },
        notify: function () { //wonder why not use LocalNotifications directly?!? smh yup works!!
            let at = new Date(Date.now() + 1000 * 100) //think add utc and seem in future smh
            let n = addToDate(parseDate(new Date()),{ minute: 4})
            
            //let compareTime = //new Date(parseDate(n)) >>complains smh
            console.log("notify::AT",JSON.stringify(at),JSON.stringify(n))//,JSON.stringify(compareTime))
            
            //LocNotifications dont seem to attach listeners?!?
            LocNotifications.schedule({ //LocalNotifications
                notifications: [
                {
                    title: 'Title',
                    body: 'Body',
                    id: 1,
                    schedule: { at: at }, //+ 1000 * 5  >>goes five hours in front?!?
                    sound: './public/assets/sounds/alarm.aiff',
                    attachments: null,
                    actionTypeId: '',
                    extra: null
                }
                ]
            })
            //.then((res) => {
            //    console.log("notify::good",JSON.stringify(res))
            //    console.log(res)
            //}).catch((err) => {
            //    console.log("notify::ERROR",JSON.stringify(err))
            //    console.log(err)
            //})
        }
  }
  };
  </script>
  