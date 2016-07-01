// uiRouterDebugger.js
//
// This AngularJS module adds various hooks to enable logging on various events
// within Angular-UI-Router.  This is useful for debugging.
//
// To use this module, add a dependency to UIRouterDebugger to your app, and
// then in the app's run() function, call:
//
//     UIRouterDebugger.active = true;
//
// ##########################################################################

angular.module("uiRouterDebugger", []).factory("UIRouterDebugger",
    ["$rootScope", function($rootScope) {

    var handler = {active: true};

    $rootScope.$on('$stateChangeStart',
                   function(event, toState, toParams, fromState, fromParams) {
        console.log("$stateChangeStart --- event, toState, toParams, " +
                    "fromState, fromParams");
        console.log(arguments);
    });

/*
    $rootScope.$on('$stateChangeError',
                   function(event, toState, toParams, fromState, fromParams,
                            error) {
        if (handler.active) {
            console.log("$stateChangeError --- event, toState, toParams, " +
                        "fromState, fromParams, error");
            console.log(arguments);
        };
    });

    $rootScope.$on('$stateChangeSuccess',
                   function(event, toState, toParams, fromState, fromParams) {
        if (handler.active) {
            console.log("$stateChangeSuccess --- event, toState, toParams, " +
                        "fromState, fromParams");
            console.log(arguments);
        };
    });
*/
    $rootScope.$on('$viewContentLoading', function(event, viewConfig) {
        console.log("loading");
        if (handler.active) {
            console.log("$viewContentLoading --- event, viewConfig");
            console.log(arguments);
        };
    });

    $rootScope.$on('$viewContentLoaded', function(event) {
        if (handler.active) {
            console.log("$viewContentLoaded --- event");
            console.log(arguments);
        };
    });

    $rootScope.$on('$stateNotFound',
                   function(event, unfoundState, fromState, fromParams) {
        console.log("not found!");
        if (handler.active) {
            console.log("$stateNotFound --- event, unfoundState, fromState, " +
                        "fromParams");
            console.log(arguments);
        };
    });

    return handler;
}]);

