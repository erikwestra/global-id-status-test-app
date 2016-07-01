// app.states.map
//
// This module implements the "map" state for the StatusAPITest app.
//
// ##########################################################################

// Define our module's dependencies.

angular.module('app.states.map', ['app.lib.storage',
                                  'app.lib.utils',
                                  'app.services.statusAPI',
                                  'app.services.googleMaps']);

// ##########################################################################

// Configuration for the "app.states.map" module.

angular.module('app.states.map').config(
    ['$stateProvider', function($stateProvider) {
        $stateProvider.state('tabs.map', {
            url: "/map",
            views: {
                'map-tab': {
                    templateUrl: "app/states/map/map.html",
                    controller: "MapController"
                }
            }
        });
}]);

// ##########################################################################

// The "app.states.map" module's controller.

angular.module('app.states.map').controller(
    'MapController',
    ['$scope', 'GoogleMaps',
     function($scope, GoogleMaps) {

         GoogleMaps.init($scope);
}]);

