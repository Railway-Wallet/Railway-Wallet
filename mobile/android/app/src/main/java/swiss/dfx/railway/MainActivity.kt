package swiss.dfx.railway

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle
import org.devio.rn.splashscreen.SplashScreen
import com.google.android.gms.common.GooglePlayServicesNotAvailableException
import com.google.android.gms.common.GooglePlayServicesRepairableException
import com.google.android.gms.security.ProviderInstaller
import android.view.WindowManager

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreen.show(this)
    super.onCreate(null)

    try {
      ProviderInstaller.installIfNeeded(getApplicationContext())
    } catch (e: GooglePlayServicesRepairableException) {
      e.printStackTrace()
    } catch (e: GooglePlayServicesNotAvailableException) {
      e.printStackTrace()
    }
  }

  override fun onResume() {
    super.onResume()
    // Disabled FLAG_SECURE when coming back to foreground so user can take screenshots
    getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }

  override fun onPause() {
    // Hide UI when going into background for security (displays dark screen to user and prevents other apps from recording)
    getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
    super.onPause()
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */

  override fun getMainComponentName(): String = "Railway"

   /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
 override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
