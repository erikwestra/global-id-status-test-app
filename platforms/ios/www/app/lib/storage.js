/* app.lib.storage
 *
 * This module defines a simple local data storage service for the StatusAPI
 * system.  It provides a single service named "storage" which lets the system
 * store and retrieve key/value pairs using window.localStorage.
 */

angular.module('app.lib.storage', []);

angular.module('app.lib.storage').factory('storage',
    ['$window', '$log', function($window, $log) {

    var load_store = function() {
        var store = $window.localStorage["statusAPITestStore"] || "{}";
        return JSON.parse(store);
    }

    var save_store = function(store) {
        $window.localStorage["statusAPITestStore"] = JSON.stringify(store);
    }

    return {
        set: function(key, value) {
            // Add the given key/value pair to our local storage.
            //$log.info("storage.set, key = ", key, ", value = ", value);
            var store = load_store();
            store[key] = value;
            save_store(store);
        },
        get: function(key) {
            // Retrieve the value associated with the given key.  If there is
            // no entry with that key in our local storage, we return null.
            var store = load_store();
            if (key in store) {
                return store[key];
            } else {
                return null;
            }
        },
        remove: function(key) {
            // Remove the entry with the given key from our local storage.
            var store = load_store();
            if (key in store) {
                delete store[key];
                save_store(store);
            }
        },
        has: function(key) {
            // Return true if we have the given key in our local storage.
            var store = load_store();
            return (key in store);
        }
    }
}]);

