/* app.services.polling
 *
 * This AngularJS service implements the logic for polling the Status API for
 * updates.
 */

angular.module('app.services.polling', ['ionic',
                                        'app.lib.config',
                                        'app.services.statusAPI',
                                        'app.services.googleMaps',
                                        'app.services.locationHistory',
                                        'app.services.messageHandler']);

angular.module('app.services.polling').factory('Polling',
    ['$timeout', '$ionicPopup',
     'config', 'StatusAPI', 'GoogleMaps', 'LocationHistory', 'MessageHandler',
     function($timeout, $ionicPopup,
              config, StatusAPI, GoogleMaps, LocationHistory, MessageHandler) {

        var timer = null; // $timeout timer for polling.
        var since = null; // Last 'since' value returned by the API.

        // ==================================================================
        // =                                                               ==
        // =                I N T E R N A L   F U N C T I O N S            ==
        // =                                                               ==
        // ==================================================================
        //
        // get_status_updates()
        //
        //     Retrieve the latest set of status updates from the API.
        //
        //     This is called periodically for as long as we are polling the
        //     API.  If we receive any status updates for a contact's location,
        //     we pass this information onto the locationHistory service.

        var get_status_updates = function() {

            var params = {}
            if (since != null) {
                params.since = since;
            }

            StatusAPI.get_status_updates(params).then(
                function(response) { // Success.
                    response.updates.forEach(function(update) {
                        if (update.type == "location/latlong") {
                            var timestamp = utils.string_to_moment(
                                                            update.timestamp);
                            var contents = JSON.parse(update.contents);
                            GoogleMaps.add_location(
                                            update.global_id,
                                            timestamp,
                                            contents.latitude,
                                            contents.longitude).then(
                                function() { // Success.
                                    LocationHistory.add(
                                                update.global_id,
                                                timestamp,
                                                contents.latitude,
                                                contents.longitude).then(
                                        function() { // Success.
                                            // Nothing to do.
                                        },
                                        function(err_msg) { // Failed.
                                            utils.show_error("Adding to " +
                                                             "history: " +
                                                             err_msg);
                                        }
                                    );
                                },
                                function(err_msg) { // Failed.
                                    utils.show_error("Adding to map: " +
                                                     err_msg);
                                }
                            );
                        }
                    });
                    since = response.since;
                },
                function(err_msg) { // Failed.
                    $ionicPopup.alert({title: "Unable to get status updates!",
                                       subTitle: err_msg});
                }
            );
        }

        // ==================================================================
        //
        // get_messages()
        //
        //     Retrieve any pending messages from the API.
        //
        //     This is called periodically for as long as we're polling the
        //     API.  If we receive any messages, they are passed to the message
        //     handler module for processing.

        var get_messages = function() {

            StatusAPI.get_messages().then(
                function(response) { // Success.
                    response.forEach(function(message) {
                        MessageHandler.receive(message.sender,
                                               message.message);
                    });
                },
                function(err_msg) { // Failed.
                    $ionicPopup.alert({title: "Unable to get messages!",
                                       subTitle: err_msg});
                }
            );
        }

        // ==================================================================
        //
        // poll()
        //
        //     Poll for new data.
        //
        //     We poll for new data, and then restart the timer so that we will
        //     be called again after config.POLL_FREQUENCY milliseconds.

        var poll = function() {
            get_status_updates();
            get_messages();
            timer = $timeout(poll, config.POLL_FREQUENCY);
        }

        // ==================================================================
        // =                                                               ==
        // =                  P U B L I C   F U N C T I O N S              ==
        // =                                                               ==
        // ==================================================================
        //
        // start()
        //
        //     Start polling for updates.
        //
        //     This should be called once the user has signed in.

        var start = function() {

            timer = $timeout(poll, config.POLL_FREQUENCY);
        }

        // ==================================================================
        //
        // stop()
        //
        //     Stop polling for updates.
        //
        //     This should be called when the user signs out.

        var stop = function() {

            if (timer != null) {
                $timeout.cancel(timer);
                timer = null;
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
]);

