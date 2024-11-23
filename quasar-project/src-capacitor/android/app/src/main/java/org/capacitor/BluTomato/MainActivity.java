package org.capacitor.BluTomato;

import com.capacitorjs.plugins.localnotifications.TimedNotificationPublisher;
import com.getcapacitor.BridgeActivity;

import android.app.AlarmManager;
import android.content.Intent;
import android.os.Bundle;


import com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin; //huh shoulda used this one!!
import com.getcapacitor.Logger;

// my plugin
//import org.capacitor.BluTomato.LocalNotification;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
      //registerPlugin(LocalNotificationsPlugin.class);
      //// when removed >> yup plugin still runs with changes...

      //with below derived local class(would need to create lotsa derived classes tho...)
      ////and prolly override gradle build dependencies>>meh
      //registerPlugin(testyOne.class);

      registerPlugin(MyNotifActions.class);

      super.onCreate(savedInstanceState);

        // Initializes the Bridge >>complains..and deprecated
        /*this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
        // Additional plugins you've installed go here
        // Ex: add(TotallyAwesomePlugin.class);
            add(LocalNotificationsPlugin.class);
        }}); */
    }

    @Override
    public void onResume() {
      Logger.error("FLO-TAG","onResume?!?",null);
      super.onResume();
    }

    /*@Override
    public void onRestart() {
      Logger.error("FLO-TAG","onRestart?!?",null);
      super.onRestart();
    }*/

    @Override
    public void onDestroy() {
      Logger.error("FLO-TAG","onDestroy?!?",null);
      super.onDestroy();
    }

    @Override
    public void onStop() {
      long earliest = LocalNotificationsPlugin.getLocalNotificationsInstance().earliest();
      Logger.error("FLO-TAG","onStop?!? "+earliest,null);
      if (earliest > 0){
        //Intent notificationIntent = new Intent("org.capacitor.BluTomato.TIMEY");
        //getApplicationContext().sendBroadcast(notificationIntent); //just to wake him up? lol get warning below
        ///Background execution not allowed: receiving Intent { act=org.capacitor.BluTomato.TIMEY flg=0x10 } to org.capacitor.BluTomato/com.capacitorjs.plugins.localnotifications.TimedNotificationPublisher

        //could set trigger below? but prolly overkill as set in notificationManager...toReview tho...could do in onDestroy?
        //AlarmManager alarmManager = (AlarmManager) getActivity().getSystemService(Context.ALARM_SERVICE);
        //alarmManager.setAlarmClock(new AlarmManager.AlarmClockInfo(trigger, pendingIntent),pendingIntent);
      }
      //LocalNotificationsPlugin.listenez(); access issues..use >>LocalNotificationsPlugin.getLocalNotificationsInstance().
      //LocalNotificationsPlugin.getLocalNotificationsInstance().removeAllListeners(null);
      //LocalBroadcastManager.getInstance(this).unregisterReceiver(mMessageReceiver);

      //getApplicationContext().startService()

      super.onStop();
    }

  @Override
  public void onPause() {
    Logger.error("FLO-TAG","onPause?!?",null);
    MyNotifActions.getMyNotifActionsInstance();
    MyNotifActions notifPlugin = MyNotifActions.getMyNotifActionsInstance();
    if (notifPlugin != null) {
      //access issue smh
      //notifPlugin.notifyListeners("pauseReceived", notification, true);
      notifPlugin.listenez(); //this works
    }
    super.onPause();
  }
}
