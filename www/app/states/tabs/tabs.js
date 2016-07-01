// app.states.tabs
//
// This module implements the "tabs" state for the StatusAPITest app.
//
// ##########################################################################

// Define our module's dependencies.

angular.module('app.states.tabs', ['ionic',
                                   'app.lib.storage',
                                   'app.services.polling']);

// ##########################################################################

// Configuration for the "app.states.enterGlobalID" module.

angular.module('app.states.tabs').config(
    ['$stateProvider', function($stateProvider) {
        $stateProvider.state('tabs', {
            url         : "/tabs",
            abstract    : true,
            templateUrl : "app/states/tabs/tabs.html",
            controller  : 'TabsController'
        });
}]);

// ##########################################################################

// The 'app.states.tabs' module's controller.

angular.module('app.states.tabs').controller('TabsController',
    ['$scope', '$state', '$ionicActionSheet', '$ionicViewSwitcher',
     'storage', 'Polling',
     function($scope, $state, $ionicActionSheet, $ionicViewSwitcher,
              storage, Polling) {

         $scope.showOptions = function() {
             $ionicActionSheet.show({
                 buttons: [{text: "Sign Out"}],
                 cancelText: "Cancel",
                 buttonClicked: function(index) {
                     if (index == 0) { // The user tapped our Sign Out button.
                         Polling.stop();
                         storage.remove("access_id");
                         storage.remove("access_secret");
                         $ionicViewSwitcher.nextDirection("back");
                         $state.go("enterGlobalID");
                     }
                     return true;
                 }
             });
         }
}]);
