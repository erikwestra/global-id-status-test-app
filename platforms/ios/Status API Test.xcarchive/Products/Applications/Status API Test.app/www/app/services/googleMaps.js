/* app.services.googleMaps
 *
 * This AngularJS service encapsulates the Google Maps API.
 */

angular.module('app.services.googleMaps',
               ['app.lib.config',
                'app.lib.storage',
                'app.lib.utils',
                'app.services.connectivityMonitor',
                'app.services.locationHistory',
                'app.services.contactList',
                'app.services.globalIDView']);

// ##########################################################################

angular.module('app.services.googleMaps').factory('GoogleMaps',
    ['$rootScope', '$q', 'config', 'storage', 'utils',
     'ConnectivityMonitor', 'LocationHistory', 'ContactList', 'GlobalIDView',
     function($rootScope, $q, config, storage, utils,
              ConnectivityMonitor, LocationHistory, ContactList, GlobalIDView) {

        var $scope = null;          // Copy of map's $scope.
        var map    = null;          // Our Google map object.
        var views  = new HashMap(); // Maps global ID to GlobalIDView object.
        var zoomed = false;         // Have we zoomed in yet?

        // ==================================================================
        // =                                                               ==
        // =                I N T E R N A L   F U N C T I O N S            ==
        // =                                                               ==
        // ==================================================================
        //
        // has_google_maps()
        //
        //     Return true if and only if the Google Maps API is loaded.

        var has_google_maps = function() {

            if (typeof google == "undefined") {
               return false;
            } else if (typeof google.maps == "undefined") {
                return false;
            } else {
                return true;
            }
        }

        // ==================================================================
        //
        // zoom_in_to(latitude, longitude)
        //
        //     Zoom the map into the given location.

        var zoom_in_to = function(latitude, longitude) {

            var position = new google.maps.LatLng(latitude, longitude);
            map.panTo(position);
            map.setZoom(16);
        }

        // ==================================================================
        //
        // requestLocationHistory()
        //
        //     Ask the Status API to download a list of locations for each of
        //     our contacts.
        //
        //     We return a Promise object which gets resolved once the location
        //     details have been downloaded and passed to our LocationHistory
        //     module.

        var requestLocationHistory = function() {

            var deferred = $q.defer();

            global_ids = [];
            global_ids.push(storage.get("global_id"));
            var contacts = ContactList.get();
            for (var i=0; i < contacts.length; i++) {
                var contact = contacts[i];
                if (contact.pending) {
                    continue
                }

                global_ids.push(contact.global_id);
            }

            var promises = [];
            for (var i=0; i < global_ids.length; i++) {
                var global_id = global_ids[i];
                promises.push(LocationHistory.download(global_id));
            }

            $q.all(promises).then(
                function() { // Success.
                    deferred.resolve();
                },
                function(err_msg) { // Failed.
                    deferred.reject(err_msg);
                }
            );

            return deferred.promise;
        }

        // ==================================================================
        //
        // loadLocationHistory()
        //
        //     Load the history of locations from the location history service
        //     and add the results to our map.
        //
        //     We create a GlobalIDView object for each global ID in the
        //     location history, so the user can see the history of received
        //     locations.

        var loadLocationHistory = function() {

            var global_ids = LocationHistory.global_ids();
            for (var i=0; i < global_ids.length; i++) {
                var global_id = global_ids[i];
                var locations = LocationHistory.get(global_id);

                if ((locations != null) && (locations.count() > 0)) {
                    var view;
                    if (views.has(global_id)) {
                        view = views.get(global_id);
                    } else {
                        view = new GlobalIDView(global_id,
                                                global_id); // Fix label
                        view.add_to_map(map);
                        views.set(global_id, view);
                    }

                    view.add_locations(locations);
                }
            }

            if (!zoomed) {
                // Zoom in on either the current user's most recent location,
                // or the most recent location for some other user.

                var our_global_id = storage.get("global_id");
                var zoom_to_global_id;
                if (our_global_id in global_ids) {
                    zoom_to_global_id = our_global_id;
                } else {
                    zoom_to_global_id = global_ids[global_ids.length-1];
                }

                var locations = LocationHistory.get(zoom_to_global_id);
                if ((locations != null) && (locations.count() > 0)) {
                    var latest = null;
                    locations.forEach(function(value, key) {
                        if ((latest == null) || (latest.isBefore(key))) {
                            latest = key;
                        }
                    });

                    var latitude  = locations.get(latest).latitude;
                    var longitude = locations.get(latest).longitude;

                    zoom_in_to(latitude, longitude);
                    zoomed = true;
                }
            }
        }

        // ==================================================================
        //
        // initMap()
        //
        //     Initialise our map.

        var initMap = function() {

            var latLng = new google.maps.LatLng(0, 0);
         
            var mapOptions = {
                    center    : latLng,
                    zoom      : 1,
                    mapTypeId : google.maps.MapTypeId.TERRAIN
            };

            map = new google.maps.Map(document.getElementById("map"),
                                      mapOptions);

            // Wait until the map is loaded.

            google.maps.event.addListenerOnce(map, 'idle', function() {
                requestLocationHistory().then(
                    function() {
                        loadLocationHistory();
                        enableMap();
                    },
                    function(err_msg) { // Failed.
                        utils.show_error("Downloading history: " +
                                         JSON.stringify(err_msg));
                    }
                );
            });
        }
 
        // ==================================================================
        //
        // enableMap()
        //
        //     Enable our map in the UI.
        //
        //     We hide the "loading" message.

        var enableMap = function() {
            $scope.message = null;
        }
 
        // ==================================================================
        //
        // disableMap()
        //
        //     Disable our map in the UI.
        //
        //     We show a "no connection" message.

        var disableMap = function() {
            $scope.message = "You must be connected to the internet to "
                           + "view this map.";
        }

        // ==================================================================
        //
        // loadGoogleMaps()
        //
        //     Load Google Maps into our app.
        //
        //     We show the "loading" message and load the Google Maps API.

        var loadGoogleMaps = function() {
            $scope.message = "Loading map...";

            // This function will be called once the SDK has been loaded.

            window.mapInit = function() {
                initMap();
            };  

            // Create a script element to insert into the page.

            var script = document.createElement("script");
            script.type = "text/javascript";
            script.id = "googleMaps";

            var apiKey = config.GOOGLE_MAPS_API_KEY;
            script.src = "http://maps.google.com/maps/api/js"
                       + "?key=" + apiKey
                       + '&callback=mapInit';
            document.body.appendChild(script);
        }
 
        // ==================================================================
        //
        // checkLoaded()
        //
        //     Make sure the Google Maps API is loaded.  If it isn't load it.
        //     Otherwise, enable the map.

        var checkLoaded = function() {

            if (typeof google == "undefined" ||
                typeof google.maps == "undefined") {
                loadGoogleMaps();
            } else {
                enableMap();
            }
        }
 
        // ==================================================================
        //
        // addConnectivityListeners()
        //
        //     Add listener functions to automatically enable or disable the
        //     maps when the user comes online or goes offline.

        var addConnectivityListeners = function() {
 
            if (ionic.Platform.isWebView()) {
                // Check if the map is already loaded when the user comes
                // online.  If not, load it.

                $rootScope.$on('$cordovaNetwork:online',
                               function(event, networkState) {
                                  checkLoaded();
                               });
 
                // Disable the map when the user goes offline/

                $rootScope.$on('$cordovaNetwork:offline',
                               function(event, networkState) {
                                  disableMap();
                               });
            } else {
 
                // The following code does the same thing, when we're not
                // running on a device.

                window.addEventListener("online",
                                        function(e) {
                                            checkLoaded();
                                        }, false);    
 
                window.addEventListener("offline",
                                        function(e) {
                                            disableMap();
                                        }, false);  
            }
 
        }
 
        // ==================================================================
        // =                                                               ==
        // =                  P U B L I C   F U N C T I O N S              ==
        // =                                                               ==
        // ==================================================================
        //
        // init(scope)
        //
        //     Initialise the Google Maps API.
        //
        //     'scope' is the scope to use for accessing our map.

        var init = function(scope) {
 
            $scope = scope;
            $scope.message = null;

            if (!has_google_maps()) {
                disableMap();

                if (ConnectivityMonitor.is_online()) {
                    loadGoogleMaps();
                }
            } else {
                if (ConnectivityMonitor.is_online()) {
                    initMap();
                    enableMap();
                } else {
                    disableMap();
                }
            }
     
            addConnectivityListeners();
        }
     
        // ==================================================================
        //
        // add_location(global_id, timestamp, latitude, longitude)
        //
        //     Add a new location to the map.
        //
        //     This is called whenever a new location is received, either from
        //     the currently signed-in user or from another user via the Status
        //     API.  We add the new location to the map so that the user's
        //     location is visible.  The 'timestamp' parameter will be a
        //     moment() object.
        //
        //     Note that this function returns a Promise which gets resolved
        //     (with no value) once the user's location has been added to the
        //     map, or rejected (with a suitable error message) if something
        //     goes wrong.

        var add_location = function(global_id, timestamp,
                                    latitude, longitude) {

            var deferred = $q.defer()

            if (has_google_maps()) {

                // Update the view, creating one if we don't already have it.

                var view;
                if (views.has(global_id)) {
                    view = views.get(global_id);
                } else {
                    view = new GlobalIDView(global_id, global_id); // Fix label
                    views.set(global_id, view);
                    view.add_to_map(map);
                }

                view.add_location(timestamp, latitude, longitude);

                // Finally, zoom in if we haven't already done so.

                if (!zoomed) {
                    // Zoom in on this location.
                    zoom_in_to(latitude, longitude);
                    zoomed = true;
                }
            }

            deferred.resolve(); // We're working synchronously for now.

            return deferred.promise;
        }

        // ==================================================================
        //
        // Our public interface:

        return {
            init         : init,
            add_location : add_location
        }
}]);

