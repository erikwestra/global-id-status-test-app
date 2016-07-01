/* app.js
 *
 * This module defines the top-level application for our system.  We define the
 * various top-level dependencies and initilisation code for the StatusAPITest
 * app here.
 */

angular.module('app', ['ionic',
                       'ngCordova',

                       //'uiRouterDebugger',

                       'app.lib.config',
                       'app.lib.storage',
                       'app.lib.utils',

                       'app.services.statusAPI',
                       'app.services.polling',
                       'app.services.connectivityMonitor',
                       'app.services.geolocation',

                       'app.states.enterGlobalID',
                       'app.states.tabs',
                       'app.states.contacts',
                       'app.states.map'
]);

angular.module('app').run([
    "$ionicPlatform", function($ionicPlatform) {

      $ionicPlatform.ready(function() {
        if(window.cordova && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);
        }
        if(window.StatusBar) {
          StatusBar.styleDefault();
        }
      });
}])

angular.module('app').config(
    ['$urlRouterProvider',
     function($urlRouterProvider) {
        $urlRouterProvider.when("", ['storage', 'Polling', 'Geolocation',
            function(storage, Polling, Geolocation) {
                if (storage.has("access_id") & storage.has("access_secret")) {
                    Polling.start();
                    Geolocation.start();
                    return "/tabs/contacts";
                } else {
                    return "/enterGlobalID";
                }
            }]);
}]);

