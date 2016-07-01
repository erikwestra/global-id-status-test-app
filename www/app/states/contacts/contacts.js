// app.states.contacts
//
// This module implements the "contacts" state for the StatusAPITest app.
//
// Note that we store the list of contacts into the storage module under the
// key "contacts".  This is an array of contacts, where each contact is an
// object with the following fields:
//
//     'global_id'
//
//         The global ID of the contact person.
//
//     'pending'
//
//         If true, we have asked this contact for permission to view their
//         location updates, but have not yet received their response.
//
// ##########################################################################

// Define our module's dependencies.

angular.module('app.states.contacts', ['ionic',
                                       'app.lib.storage',
                                       'app.lib.utils',
                                       'app.services.statusAPI',
                                       'app.services.contactList',
                                       'app.services.messageHandler']);

// ##########################################################################

// Configuration for the "app.states.contacts" module.

angular.module('app.states.contacts').config(
    ['$stateProvider', function($stateProvider) {
        $stateProvider.state('tabs.contacts', {
            url: "/contacts",
            views: {
                'contacts-tab': {
                    templateUrl: "app/states/contacts/contacts.html",
                    controller: "ContactsController"
                }
            }
        });
}]);

// ##########################################################################

// The "app.states.contacts" module's controller.

angular.module('app.states.contacts').controller(
    'ContactsController',
    ['$scope', '$ionicLoading', '$state', '$ionicViewSwitcher', '$ionicPopup',
     'storage', 'utils', 'StatusAPI', 'ContactList', 'MessageHandler',
     function($scope, $ionicLoading, $state, $ionicViewSwitcher, $ionicPopup,
              storage, utils, StatusAPI, ContactList, MessageHandler) {

        $scope.ContactList = ContactList
        $scope.options = {editing: false};

        // The following function lets the user add a new contact.

        $scope.addContact = function() {
            $scope.new_contact = {global_id: ""};

            var popup = {
                template: '<input type="text" ' +
                                 'ng-model="new_contact.global_id">',
                title: "Add Contact",
                subTitle: "Please enter the global ID for the " +
                          "contact you want to add",
                scope: $scope,
                buttons: [{text: "Cancel",
                           type: "button-positive",
                           onTap: function(event) {
                                    return null;
                                  }
                          },

                          {text: "Add",
                           type: "button-balanced",
                           onTap: function(event) {
                                    if ($scope.new_contact.global_id == "") {
                                        return null;
                                    } else {
                                        return $scope.new_contact.global_id;
                                    }
                                  }
                          }]
            };

            $ionicPopup.show(popup).then(
                function(global_id) {
                    if (global_id == null) {
                        return
                    }

                    var found   = false; // initially.
                    var pending = false;

                    var contacts = ContactList.get();
                    for (var i=0; i < contacts.length; i++) {
                        var contact = contacts[i];
                        if (global_id == contact.global_id) {
                            found   = true;
                            pending = contact.pending;
                        }
                    }

                    if (found & pending) {
                        $ionicPopup.confirm({
                            title : "Add Contact",
                            subTitle : "You asked this user for permission " +
                                       "to follow their location.  Would " +
                                       "you like to re-send the request?"
                        }).then(
                            function(confirmed) {
                                if (confirmed) {
                                    MessageHandler.request_permission(global_id);
                                }
                            }
                        );
                    } else if (found & !pending) {
                        $ionicPopup.alert({
                            title    : "Add Contact",
                            subTitle : "You already have that contact " +
                                       "in your list!"
                        });
                    } else {
                        ContactList.add(global_id, true);
                        $ionicLoading.show({template: "Sending request..."})
                        MessageHandler.request_permission(global_id).then(
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

        // The following function lets the user remove a contact.

        $scope.removeContact = function(global_id) {
            ContactList.remove(global_id);
            MessageHandler.revoke_permission(global_id).then(
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
]);

