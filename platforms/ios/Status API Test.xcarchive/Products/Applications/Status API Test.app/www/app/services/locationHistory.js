/* app.services.locationHistory
 *
 * This AngularJS service keeps track of the location for each global ID we are
 * interested in.  As well as remembering the current location for each global
 * ID, we also store the history of location updates going back in time.
 */

angular.module('app.services.locationHistory',
               ['app.lib.storage',
                'app.lib.config',
                'app.lib.utils',
                'app.services.statusAPI']);

angular.module('app.services.locationHistory').factory('LocationHistory',
    ['$http', '$q', '$timeout', 'config', 'utils', 'storage', 'StatusAPI',
     function($http, $q, $timeout, config, utils, storage, StatusAPI) {

        var history = new HashMap(); // Maps each global ID to a HashMap
                                     // mapping timestamp values to an object
                                     // with 'latitude' and 'longitude' fields.

        // ==================================================================
        // =                                                               ==
        // =                   P U B L I C   F U N C T I O N S             ==
        // =                                                               ==
        // ==================================================================
        //
        // download(global_id)
        //
        //     Download the location history for the given global ID.
        //
        //     We ask the Status API to download the location updates for the
        //     given global ID.  Any of these location updates which are within
        //     the last 'config.LOCATION_HISTORY_CUTOFF' hours will be added to
        //     our location history.
        //
        //     Note that we return a Promise object that gets resolved (with no
        //     value) once the location updates have been downloaded, or
        //     rejected (with a suitable error message) if the attempt to
        //     download the location updates fails for any reason.

        var download = function(global_id) {

            var deferred = $q.defer();

            StatusAPI.get_history(global_id, "location/latlong").then(
                function(response) { // Success.
                    response.updates.forEach(function(update) {
                        var timestamp = utils.string_to_moment(update.timestamp);
                        var age = moment().diff(timestamp, "seconds");
                        if (age < config.LOCATION_HISTORY_CUTOFF * 60 * 60) {
                            var contents = JSON.parse(update.contents);
                            add(update.global_id,
                                timestamp,
                                contents.latitude,
                                contents.longitude);
                        }
                    });

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
        // add(global_id, timestamp, latitude, longitude)
        //
        //     Add the given lat/long coordinate to our location history.
        //
        //     The given global ID will be recorded as being at the given
        //     lat/long position, and have the given timestamp.  'timestamp'
        //     should be a moment() object representing the date and time at
        //     which the location was recorded.
        //
        //     Note that we return a Promise which gets resolved (with no
        //     value) once the location has been recorded, or rejected (with a
        //     suitable error message) if something goes wrong.

        var add = function(global_id, timestamp, latitude, longitude) {

            var deferred = $q.defer()

            if (history.has(global_id)) {
                history.get(global_id).set(timestamp, {latitude  : latitude,
                                                       longitude : longitude});
            } else {
                var locs = new HashMap();
                locs.set(timestamp, {latitude  : latitude,
                                     longitude : longitude});
                history.set(global_id, locs);
            }

            deferred.resolve(); // We operate synchronously for now.

            return deferred.promise;
        }

        // ==================================================================
        //
        // global_ids()
        //
        //     Return a list of the global IDs we have a location history for.

        var global_ids = function() {

            return history.keys();
        }

        // ==================================================================
        //
        // get(global_id)
        //
        //     Retrieve the location history for the given global ID.
        //
        //     We return a HashMap mapping timestamps to objects with
        //     'latitude' and 'longitude' values, where each timestamp is a
        //     moment() object.
        //
        //     If we have no location history for the given global ID, we
        //     return null.

        var get = function(global_id) {

            if (history.has(global_id)) {
                return history.get(global_id)
            } else {
                return null;
            }
        }

        // ==================================================================
        //
        // Our public interface:

        return {
            download   : download,
            add        : add,
            global_ids : global_ids,
            get        : get
        }
    }
]);

