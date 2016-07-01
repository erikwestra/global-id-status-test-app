/* app.services.connectivityMonitor
 *
 * This AngularJS service keeps track of whether we are currently online or
 * offline.
 */

angular.module('app.services.connectivityMonitor', []);

angular.module('app.services.connectivityMonitor').factory(
    'ConnectivityMonitor',
    ['$cordovaNetwork', function($cordovaNetwork) {

        // ==================================================================
        //
        // is_online
        //
        //     Return True if and only if we are currently online.

        var is_online = function() {
            if (ionic.Platform.isWebView()) {
                return $cordovaNetwork.isOnline();
            } else {
                return navigator.onLine;
            }
        }

        // ==================================================================
        //
        // is_offline
        //
        //     Return True if and only if we are currently offline.

        var is_offline = function() {
            if (ionic.Platform.isWebView()) {
                return !$cordovaNetwork.isOnline();
            } else {
                return !navigator.onLine;
            }
        }

        // ==================================================================
        //
        // Our public interface:

        return {
            is_online  : is_online,
            is_offline : is_offline
        }
     }
]);

