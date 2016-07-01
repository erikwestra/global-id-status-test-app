/* app.services.messageHandler
 *
 * This AngularJS service handles incoming and outgoing messages.  We use these
 * messages to request permission from a user to view their status updates, to
 * respond to these requests, and to cancel a user's permission.
 */

angular.module('app.services.messageHandler',
               ['app.lib.storage',
                'app.lib.config',
                'app.lib.utils',
                'app.services.statusAPI',
                'app.services.contactList']);

angular.module('app.services.messageHandler').factory('MessageHandler',
    ['$q', '$ionicLoading', '$ionicPopup',
     'StatusAPI', 'ContactList', 'utils',
     function($q, $ionicLoading, $ionicPopup,
              StatusAPI, ContactList, utils) {

        // ==================================================================
        // =                                                               ==
        // =                I N T E R N A L   F U N C T I O N S            ==
        // =                                                               ==
        // ==================================================================
        //
        // handle_request_permission(sender)
        //
        //     Respond to an incoming "request permission" message.  We ask the
        //     user if they accept the request to see the user's location, and
        //     if so create the appropriate permission.  Either way, a message
        //     is sent back to the sender telling them about the user's
        //     decision.

        var handle_request_permission = function(global_id) {

            $ionicPopup.confirm({
                title      : "Request Received",
                subTitle   : global_id + " has asked to see your location.  "
                           + "Do you agree to this?",
                okText     : "Yes",
                cancelText : "No"
            }).then(
                function(confirmed) {
                    if (confirmed) {
                        $ionicLoading.show({template: "Accepting request..."});
                        StatusAPI.create_permission("CURRENT", global_id,
                                                    "location/latlong").then(
                            function() { // Success.
                                var message = {type: "REQUEST_ACCEPTED"};
                                StatusAPI.send_message(global_id,
                                                       message).then(
                                    function() { // Success.
                                        $ionicLoading.hide();
                                    },
                                    function(err_msg) { // Failure.
                                        $ionicLoading.hide();
                                        utils.show_error(err_msg);
                                    }
                                );
                            },
                            function(err_msg) { // Failure.
                                $ionicLoading.hide();
                                utils.show_error(err_msg);
                            }
                        );
                    } else {
                        $ionicLoading.show({template: "Rejecting request..."});
                        var message = {type: "REQUEST_REJECTED"};
                        StatusAPI.send_message(global_id, message).then(
                            function() { // Success.
                                $ionicLoading.hide();
                            },
                            function(err_msg) { // Failure.
                                $ionicLoading.hide();
                                utils.show_error(err_msg);
                            }
                        );
                    }
                }
            );
        }

        // ==================================================================
        //
        // handle_request_accepted(global_id)
        //
        //     Respond to a "request accepted" message being received.
        
        var handle_request_accepted = function(global_id) {

            $ionicPopup.alert({
                title: "Request Accepted",
                subTitle: global_id + " accepted your request to "
                        + "follow their location."
            }).then(
                function() {
                    ContactList.update(global_id, false);
                }
            );
        }

        // ==================================================================
        //
        // handle_request_rejected(global_id)
        //
        //     Respond to a "request rejected" message being received.

        var handle_request_rejected = function(global_id) {

            $ionicPopup.alert({title: "Request rejected",
                               subTitle: global_id + " rejected your request "
                                       + "to follow their location."}).then(
                function() {
                    ContactList.remove(global_id);
                }
            );
        }

        // ==================================================================
        //
        // handle_permission_revoked(global_id)
        //
        //     Respond to a "permission revoked" message being received.

        var handle_permission_revoked = function(global_id) {

            $ionicPopup.alert({title: "Contact Deleted",
                               subTitle: global_id + " has removed you from "
                                       + "their contact list.  You can no "
                                       + "longer view their location."}).then(
                function() {
                    ContactList.remove(global_id);
                }
            );
        }

        // ==================================================================
        // =                                                               ==
        // =                   P U B L I C   F U N C T I O N S             ==
        // =                                                               ==
        // ==================================================================
        //
        // request_permission(global_id)
        //
        //     Send a request to the given global ID for permission to view
        //     their status updates.
        //
        //     Returns a promise which gets resolved (with no value) if the
        //     request was sent to the server, or else gets rejected if an
        //     error occurs.

        var request_permission = function(global_id) {

            var message = {type: "REQUEST_PERMISSION"}
            return StatusAPI.send_message(global_id, message)
        }

        // ==================================================================
        //
        // revoke_permission(global_id)
        //
        //     Remove permission for the given Global ID to view the signed-in
        //     user's status updates.
        //
        //     We revoke the permission, and then send a message to that user
        //     telling them that permission has been revoked.
        //
        //     Returns a promise which gets resolved (with no value) if the
        //     request was sent to the server, or else gets rejected if an
        //     error occurs.

        var revoke_permission = function(global_id) {

            var deferred = $q.defer();

            StatusAPI.delete_permission("CURRENT", global_id,
                                        "location/latlong").then(
                function() { // Success.
                    var message = {type: "PERMISSION_REVOKED"}
                    StatusAPI.send_message(global_id, message).then(
                        function() { // Success.
                            deferred.resolve();
                        },
                        function(err_msg) { // Failed.
                            deferred.reject(err_msg);
                        }
                    );
                },
                function(err_msg) { // Failed.
                    deferred.reject(err_msg);
                }
            );

            return deferred.promise;
        }

        // ==================================================================
        //
        // receive(sender, message)
        //
        //     Respond to the signed-in user receiving the given message.
        //
        //     We process the message, responding according to the message
        //     contents.

        var receive = function(sender, message) {

            if (message.type == "REQUEST_PERMISSION") {
                handle_request_permission(sender);
            } else if (message.type == "REQUEST_ACCEPTED") {
                handle_request_accepted(sender);
            } else if (message.type == "REQUEST_REJECTED") {
                handle_request_rejected(sender);
            } else if (message.type == "PERMISSION_REVOKED") {
                handle_permission_revoked(sender);
            } else {
                utils.show_error("Unknown message received: " +
                                 JSON.stringify(message));
            }
        }

        // ==================================================================
        //
        // Our public interface:

        return {
            request_permission : request_permission,
            revoke_permission  : revoke_permission,
            receive            : receive
        }
    }
]);

