// app.states.enterGlobalID
//
// This module implements the "enter global ID" state for the StatusAPITest
// app.
//
// We ask the user to enter their global ID.
//
// ##########################################################################

// Define our module's dependencies.

angular.module('app.states.enterGlobalID', ['app.lib.storage',
                                            'app.lib.utils',
                                            'app.services.statusAPI',
                                            'app.services.polling',
                                            'app.services.geolocation']);

// ##########################################################################

// Configuration for the "app.states.enterGlobalID" module.

angular.module('app.states.enterGlobalID').config(
    ['$stateProvider', function($stateProvider) {
        $stateProvider.state('enterGlobalID', {
            url: "/enterGlobalID",
            controller: "EnterGlobalIDController",
            templateUrl: "app/states/enterGlobalID/enterGlobalID.html"
        });
}]);

// ##########################################################################

// The "app.states.enterGlobalID" module's controller.

angular.module('app.states.enterGlobalID').controller(
    'EnterGlobalIDController',
    ['$scope', '$ionicLoading', '$state', '$ionicViewSwitcher', '$ionicPopup',
     'storage', 'utils', 'StatusAPI', 'Polling', 'Geolocation',
     function($scope, $ionicLoading, $state, $ionicViewSwitcher, $ionicPopup,
              storage, utils, StatusAPI, Polling, Geolocation) {

        var global_id = "";
        if (storage.has("global_id")) {
            global_id = storage.get("global_id");
        }

        $scope.user = {global_id: global_id};

        $scope.signin = function() {
            if (!$scope.user.global_id) {
                $ionicPopup.alert({title: "Please enter your Global ID"});
                return;
            }

            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.close();
            }

            $ionicLoading.show({template: "Signing in..."});

            var global_id = $scope.user.global_id;
            var device_id = utils.get_device_id();

            StatusAPI.get_access_id(global_id, device_id).then(
                function(response) { // Success.
                    console.log("Success!");

                    storage.set("global_id",     global_id);
                    storage.set("access_id",     response.access_id);
                    storage.set("access_secret", response.access_secret);

                    Polling.start();
                    Geolocation.start();
                    $ionicLoading.hide();
                    $ionicViewSwitcher.nextDirection('forward');
                    $state.go("tabs.contacts");
                },
                function(err_msg) { // Failed.
                    $ionicLoading.hide();
                    $ionicPopup.alert({title: "Sign in failure",
                                       subTitle: err_msg});
                }
            );
        }
}]);

