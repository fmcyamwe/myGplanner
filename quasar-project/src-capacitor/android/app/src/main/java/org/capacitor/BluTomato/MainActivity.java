package org.capacitor.BluTomato;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;


import com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin; //huh shoulda used this one!!
import com.getcapacitor.Logger;

// my plugin
//import org.capacitor.BluTomato.LocalNotification;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
      registerPlugin(LocalNotificationsPlugin.class);
      //registerPlugin(PersistentNotification.class);

      super.onCreate(savedInstanceState);

        // Initializes the Bridge >>complains..and deprecated
        /*this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
        // Additional plugins you've installed go here
        // Ex: add(TotallyAwesomePlugin.class);
            add(LocalNotificationsPlugin.class);
        }}); */
    }
  @Override
  public void onDestroy() {
    Logger.error("FLO-TAG","onDestroy?!?",null);
    super.onDestroy();
  }
  @Override
  public void onStop() {
    Logger.error("FLO-TAG","onStop?!?",null);
    //LocalNotificationsPlugin.havePending(); //meh access issues..
    super.onStop();
  }
}
