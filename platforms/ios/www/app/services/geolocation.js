/* app.services.geolocation
 *
 * This AngularJS service implements the ability to geolocate this device using
 * the built-in GPS receiver.
 */

angular.module('app.services.geolocation',
               ['app.lib.storage',
                'app.lib.utils',
                'app.lib.greatCircle',
                'app.services.statusAPI',
                'app.services.googleMaps',
                'app.services.locationHistory']);

angular.module('app.services.geolocation').factory('Geolocation',
    ['$q', 'config', 'storage', 'utils', 'greatCircle',
     'StatusAPI', 'GoogleMaps', 'LocationHistory',
     function($q, config, storage, utils, greatCircle,
              StatusAPI, GoogleMaps, LocationHistory) {

        var timer         = null; // Timer used to poll for current location.
        var last_location = null; // The last location received.
        var last_time     = null; // Date/time when we last recorded a location.
        var cur_listener  = null; // Current listener function, if any.

        // ==================================================================
        // =                                                               ==
        // =                I N T E R N A L   F U N C T I O N S            ==
        // =                                                               ==
        // ==================================================================
        //
        // on_got_location(location)
        //
        //     Respond to a location being received.
        //
        //     If the location has changed since the last time we checked, we
        //     pass the new location on to the Status API, our Google Maps
        //     service (for display) and the Location History service (to keep
        //     a history of our location).

        var on_got_location = function(location) {

            // Get the coordinate we've received.

            loc = {latitude  : location.coords.latitude,
                   longitude : location.coords.longitude,
                   accuracy  : location.coords.accuracy};

            // Should we process this location?

            if (last_location != null) {
                var distance = greatCircle.distance(last_location.latitude,
                                                    last_location.longitude,
                                                    loc.latitude,
                                                    loc.longitude);
                if ((distance < loc.accuracy) ||
                    (distance < config.MIN_GEOLOCATOR_DELTA)) {
                    // Not enough lat/long change -> ignore.
                    return;
                }
            }
            last_location = loc;

            if (last_time != null) {
                var cur_time = new Date();
                var seconds = (cur_time - last_time) / 1000;
                if (seconds < config.MIN_GEOLOCATOR_TIME) {
                    // We haven't waited long enough -> ignore.
                    return;
                }

            }
            last_time = new Date();

            // If we get here, we need to process this location.  Send it to
            // the Status API, then add it to our map view and the location
            // history.

            console.log("Received location: ", JSON.stringify(loc));

            StatusAPI.send_status_update("location/latlong",
                                         {latitude  : loc.latitude,
                                          longitude : loc.longitude}).then(
                function() { // Success.
                    var timestamp = moment();
                    var global_id = storage.get("global_id");
                    GoogleMaps.add_location(global_id, timestamp,
                                            loc.latitude, loc.longitude).then(
                        function() { // Success.
                            LocationHistory.add(global_id,
                                                timestamp,
                                                loc.latitude,
                                                loc.longitude).then(
                                function() { // Success.
                                    // Nothing to do.
                                },
                                function(err_msg) { // Failed.
                                    utils.show_error("Adding to history: " +
                                                     err_msg);
                                }
                            );
                        },
                        function(err_msg) { // Failed.
                            utils.show_error("Adding to map: " + err_msg);
                        }
                    );

                },
                function(err_msg) { // Failed.
                    utils.show_error("Sending Status Update: " + err_msg);
                }
            );
        }

        // ==================================================================
        //
        // on_location_error(error)
        //
        //     Respond to an error being received from the Geolocation plugin.

        var on_location_error = function(error) {

            if (error.code == error.TIMEOUT) {
                // Our request timed out -> ignore.
                return;
            } else if (error.code == error.PERMISSION_DENIED) {
                // The user didn't let us retrieve the current position.  We
                // ignore this for now.
                console.log("geolocation error: permission denied");
                return;
            } else if (error.code == error.POSITION_UNAVAILABLE) {
                // The device cannot currently retrieve its position.
                console.log("geolocation error: position unavailable");
                return;
            }
        }

        // ==================================================================
        //
        // on_timer()
        //
        //     Respond to our interval timer going off.
        //
        //     This is called once a second whenever the geolocation service is
        //     monitoring the user's location.  We ask the geolocation plugin
        //     to retrieve the user's current location.

        var on_timer = function() {

            navigator.geolocation.getCurrentPosition(
                                    on_got_location,
                                    on_location_error,
                                    {enableHighAccuracy : true,
                                     maximumAge         : 3000,
                                     timeout            : 5000});
        }

        // ==================================================================
        //
        // can_geolocate()
        //
        //     Return true if and only if this device is able to receive
        //     geolocation updates.

        var can_geolocate = function() {

            if (navigator.geolocation == undefined) {
                return false;
            } else {
                return true;
            }
        }

        // ==================================================================
        //
        // start_timer()
        //
        //     Start running our interval timer.

        var start_timer = function() {

            timer = setInterval(on_timer, 1000);
        }

        // ==================================================================
        //
        // stop_timer()
        //
        //     Stop running our interval timer.

        var stop_timer = function() {

            if (timer != null) {
                clearInterval(timer);
                timer = null;
            }
        }

        // ==================================================================
        // =                                                               ==
        // =                  P U B L I C   F U N C T I O N S              ==
        // =                                                               ==
        // ==================================================================
        //
        // start()
        //
        //     Start recording the user's current location.

        var start = function() {

            if (can_geolocate()) {
                start_timer();
            }
        }

        // ==================================================================
        //
        // stop()
        //
        //     Stop recording the user's current location.

        var stop = function() {

            if (can_geolocate()) {
                stop_timer();
            }
        }

        // ==================================================================
        //
        // Our public interface:

        return {
            start : start,
            stop  : stop
        }
    }
   ]
);

