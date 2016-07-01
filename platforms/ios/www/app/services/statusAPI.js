/* app.services.statusAPI
 *
 * This AngularJS service provides an interface to the GlobalID Status API.
 */

angular.module('app.services.statusAPI', ['app.lib.storage',
                                          'app.lib.config',
                                          'app.lib.utils']);

angular.module('app.services.statusAPI').factory('StatusAPI',
    ['$http', '$q', 'config', 'storage', 'utils',
     function($http, $q, config, storage, utils) {

    // ======================================================================
    //
    // get_access_id(global_id, device_id)
    //
    //     Retrieve the access ID for the given global ID and device ID.
    //
    //     We return a promise which gets resolved once the Status API returns
    //     the access ID to use for the given global ID and device ID.  The
    //     returned access ID will be a Javascript object with 'access_id' and
    //     'access_secret' fields.
    //
    //     If the access attempt is refused, the promise will be rejected with
    //     a suitable error message.

    var get_access_id = function(global_id, device_id) {

        deferred = $q.defer();

        var endpoint = "/access";
        var headers  = {'Content-Type': "application/json"};
        var body     = JSON.stringify({global_id: global_id,
                                       device_id: device_id});

        $http.post(config.STATUS_API_SERVER_URL + endpoint, body,
                   {headers: headers}).then(
            function(response) { // Success.
                deferred.resolve(response.data);
            },
            function(error) { // Failed.
                deferred.reject(error.statusText);
            }
        );

        return deferred.promise;
    }

    // ======================================================================
    //
    // send_status_update(type, contents)
    //
    //     Send a status update for the currently signed-in user.
    //
    //     'type' should be a string identifying the type of status update, and
    //     'contents' should be a javascript data structure containing the
    //     contents of the status update.
    //
    //     We attempt to create a status update for the currently signed-in
    //     user with the given type and contents, and send that status update
    //     to the server for distribution.
    //
    //     We return a promise which gets resolved once the Status API has
    //     accepted the status update.  No additional information is returned
    //     in this case.
    //
    //     If the update attempt is refused, the promise will be rejected with
    //     a suitable error message.

    var send_status_update = function(type, contents) {

        deferred = $q.defer();


        var global_id     = storage.get("global_id");
        var access_id     = storage.get("access_id");
        var access_secret = storage.get("access_secret");

        var endpoint = "/" + global_id + "/status";

        var body = JSON.stringify({type      : type,
                                   timestamp : utils.moment_to_string(moment()),
                                   contents  : JSON.stringify(contents)});

        var headers  = utils.calc_hmac_headers("POST", endpoint,
                                               body, access_secret);
        headers['Content-Type'] = "application/json";

        $http.post(config.STATUS_API_SERVER_URL + endpoint, body,
                   {headers: headers}).then(
            function(response) { // Success.
                deferred.resolve();
            },
            function(error) { // Failed.
                deferred.reject(error.statusText);
            }
        );

        return deferred.promise;
    }

    // ======================================================================
    //
    // get_status_updates(options)
    //
    //     Retrieve a set of status updates for the currently signed-in user.
    //
    //     'options' should be an object defining the parameters to use for the
    //     request.  This object can contain any of the following fields:
    //
    //         'own'
    //
    //             If present and true, the API will return the list of status
    //             updates created by this global ID, rather than the status
    //             updates created by global IDs who have given permission for
    //             this global ID to view their status updates.
    //
    //         'global_id'
    //
    //             Only retrieve status updates sent by the given global ID.
    //             If this is not present, status updates from all global IDs
    //             will be retrieved.
    //
    //         'type'
    //
    //             Only retrieve status updates with the given type.
    //
    //         'since'
    //
    //             If this parameter is supplied, only status updates which
    //             have been received since the given timestamp value will be
    //             returned.
    //
    //     We return a promise object which will get resolved once the server
    //     returns the matching set of status updates.  The returned status
    //     updates will be in the form of an object with the following fields:
    //
    //         'since'
    //
    //             A string containing the timestamp to use the next time this
    //             endpoint is called to only return newly-received status
    //             updates.
    //
    //         'updates'
    //
    //             An array of status updates.  Each item in the array will be
    //             an object with 'global_id', 'type', 'timestamp' and
    //             'contents' entries.
    //
    //     If the status updates cannot be retrieved for some reason, the
    //     promise will be rejected with a suitable error message explaining
    //     what went wrong.

    var get_status_updates = function(options) {

        var deferred = $q.defer();

        var global_id     = storage.get("global_id");
        var access_id     = storage.get("access_id");
        var access_secret = storage.get("access_secret");

        var endpoint = "/" + global_id + "/status";
        var headers  = utils.calc_hmac_headers("GET", endpoint,
                                               "", access_secret);

        var params = {};
        if (("own" in options) && (options.own == true)) {
            params.own = 1;
        }
        if ("global_id" in options) {
            params.global_id = options.global_id;
        }
        if ("type" in options) {
            params.type = options.type;
        }
        if ("since" in options) {
            params.since = options.since;
        }

        $http.get(config.STATUS_API_SERVER_URL + endpoint,
                  {headers: headers, params: params}).then(
            function(response) { // Success.
                deferred.resolve(response.data);
            },
            function(error) { // Failure.
                deferred.reject(error.statusText);
            }
        );

        return deferred.promise;
    }

    // ======================================================================
    //
    // get_history(global_id, type)
    //
    //     Download the history of status updates of the given type for the
    //     given global ID.
    //
    //     We return a promise that gets resolved once the history of status
    //     updates has been downloaded.  The promise will be resolved with an
    //     array of status updates, where each status update is an object with
    //     'global_id', 'type', 'timestamp' and 'contents' entries.
    //
    //     If the history of status updates cannot be retrieved for some
    //     reason, the promise will be rejected with a suitable error message
    //     explaining what went wrong.
    //
    //     Note that we don't support the "more" parameter at this stage.

    var get_history = function(global_id, type) {

        var deferred = $q.defer();

        var global_id     = storage.get("global_id");
        var access_id     = storage.get("access_id");
        var access_secret = storage.get("access_secret");

        var endpoint = "/" + global_id + "/history";
        var headers  = utils.calc_hmac_headers("GET", endpoint,
                                               "", access_secret);

        var params = {global_id : global_id,
                      type      : type};

        $http.get(config.STATUS_API_SERVER_URL + endpoint,
                  {headers: headers, params: params}).then(
            function(response) { // Success.
                deferred.resolve({updates : response.data.updates});
            },
            function(error) { // Failure.
                deferred.reject(error.statusText);
            }
        );

        return deferred.promise;
    }

    // ======================================================================
    //
    // get_messages()
    //
    //     Retrieve any outstanding messages for the currently signed-in user.
    //
    //     We return a promise that will get resolved once the outstanding
    //     messages have been downloaded.  The promise will be resolved with an
    //     array of messages.  Each message will be an object with the
    //     following fields:
    //
    //         'sender'
    //
    //             The global ID of the sender of this message.
    //
    //         'message'
    //
    //             The message itself, in the form of an object.
    //
    //     If the messages cannot be retrieved for some reason, the promise
    //     will be rejected with a suitable error message explaining what went
    //     wrong.

    var get_messages = function() {

        var deferred = $q.defer();

        var global_id     = storage.get("global_id");
        var access_id     = storage.get("access_id");
        var access_secret = storage.get("access_secret");

        var endpoint = "/" + global_id + "/message";
        var headers  = utils.calc_hmac_headers("GET", endpoint,
                                               "", access_secret);

        $http.get(config.STATUS_API_SERVER_URL + endpoint,
                  {headers: headers}).then(
            function(response) { // Success.
                deferred.resolve(response.data);
            },
            function(error) { // Failure.
                deferred.reject(error.statusText);
            }
        );

        return deferred.promise;
    }

    // ======================================================================
    //
    // send_message(recipient, message)
    //
    //     Send a message to the given recipient.
    //
    //     'recipient' should be the global ID of the recipient to send the
    //     message to, and 'message' should be an object containing the details
    //     of the message.
    //
    //     We return a promise that will get resolved (with no value) once the
    //     message has been sent.  If the messages cannot be sent for some
    //     reason, the promise will be rejected with a suitable error message
    //     explaining what went wrong.

    var send_message = function(recipient, message) {

        var deferred = $q.defer();

        var global_id     = storage.get("global_id");
        var access_id     = storage.get("access_id");
        var access_secret = storage.get("access_secret");

        var request = {recipient : recipient,
                       message   : message};

        var body = JSON.stringify(request);

        var endpoint = "/" + global_id + "/message";
        var headers  = utils.calc_hmac_headers("POST", endpoint,
                                               body, access_secret);
        headers['Content-Type'] = "application/json"

        $http.post(config.STATUS_API_SERVER_URL + endpoint,
                   body, {headers: headers}).then(
            function(response) { // Success.
                deferred.resolve();
            },
            function(error) { // Failure.
                deferred.reject(error.statusText);
            }
        );

        return deferred.promise;
    }

    // ======================================================================
    //
    // create_permission(access_type, global_id, status_type)
    //
    //     Create a new access permission for the given global ID.
    //
    //     'access_type' should be the desired type of access ("CURRENT" or
    //     "HISTORY"), 'global_id' should be the global ID you are granting
    //     access to, and 'status_type' should be a string, optionally
    //     including a wildcard, identifying the type of status update(s) you
    //     are granting access to.
    //
    //     We return a promise that will get resolved (with no value) once the
    //     permission has been created.  If the permission cannot be created
    //     for some reason, the promise will be rejected with a suitable error
    //     message explaining what went wrong.

    var create_permission = function(access_type, global_id, status_type) {

        var deferred = $q.defer();

        var my_global_id  = storage.get("global_id");
        var access_id     = storage.get("access_id");
        var access_secret = storage.get("access_secret");

        var request = {access_type : access_type,
                       global_id   : global_id,
                       status_type : status_type};

        var body = JSON.stringify(request);

        var endpoint = "/" + my_global_id + "/permission";
        var headers  = utils.calc_hmac_headers("POST", endpoint,
                                               body, access_secret);
        headers['Content-Type'] = "application/json"

        $http.post(config.STATUS_API_SERVER_URL + endpoint,
                   body, {headers: headers}).then(
            function(response) { // Success.
                deferred.resolve();
            },
            function(error) { // Failure.
                deferred.reject(error.statusText);
            }
        );

        return deferred.promise;
    }

    // ======================================================================
    //
    // get_permissions(options)
    //
    //     Retrieve the current list of access permissions.
    //
    //     'options' should be an object defining the parameters to use for the
    //     request.  This object can contain any of the following fields:
    //
    //         'global_id'
    //
    //             Only retrieve permissions relating to the given global ID.
    //
    //         'type'
    //
    //             Only retrieve status updates which include the given type of
    //             status update.
    //
    //     We return a promise object which will get resolved once the server
    //     returns the matching set of permissions.  The returned value will be
    //     an array of permissions, where each permission is an object with the
    //     following fields:
    //
    //         'access_type'
    //
    //             The type of access which was granted: "CURRENT" or
    //             "HISTORY".
    //
    //         'global_id'
    //
    //             The global ID value identifying the person or group that has
    //             been given this permission.
    //
    //         'status_type'
    //
    //             A string identifying the type of status updates which are
    //             covered by this access permission, possibly including a
    //             wildcard.
    //
    //     If the permissions cannot be retrieved for some reason, the promise
    //     will be rejected with a suitable error message explaining what went
    //     wrong.

    var get_permissions = function(options) {

        var deferred = $q.defer();

        var global_id     = storage.get("global_id");
        var access_id     = storage.get("access_id");
        var access_secret = storage.get("access_secret");

        var endpoint = "/" + global_id + "/permission";
        var headers  = utils.calc_hmac_headers("GET", endpoint,
                                               "", access_secret);

        var params = {};
        if ("global_id" in options) {
            params.global_id = options.global_id;
        }
        if ("type" in options) {
            params.type = options.type;
        }

        $http.get(config.STATUS_API_SERVER_URL + endpoint,
                  {headers: headers, params: params}).then(
            function(response) { // Success.
                deferred.resolve(response.data);
            },
            function(error) { // Failure.
                deferred.reject(error.statusText);
            }
        );

        return deferred.promise;
    }

    // ======================================================================
    //
    // delete_permission(access_type, global_id, status_type)
    //
    //     Delete an existing access permission for the given global ID.
    //
    //     'access_type' should be the desired type of access ("CURRENT" or
    //     "HISTORY"), 'global_id' should be the global ID you are revoking
    //     access to, and 'status_type' should be a string, optionally
    //     including a wildcard, identifying the type of status update(s) you
    //     are revoking access to.
    //
    //     We return a promise that will get resolved (with no value) once the
    //     permission has been deleted.  If the permission cannot be deleted
    //     for some reason, the promise will be rejected with a suitable error
    //     message explaining what went wrong.

    var delete_permission = function(access_type, global_id, status_type) {

        var deferred = $q.defer();

        var my_global_id  = storage.get("global_id");
        var access_id     = storage.get("access_id");
        var access_secret = storage.get("access_secret");

        var endpoint = "/" + my_global_id + "/permission";
        var headers  = utils.calc_hmac_headers("DELETE", endpoint,
                                               "", access_secret);

        var params = {access_type: access_type,
                      global_id: global_id,
                      status_type: status_type};

        $http.delete(config.STATUS_API_SERVER_URL + endpoint,
                     {headers: headers, params: params}).then(
            function(response) { // Success.
                deferred.resolve();
            },
            function(error) { // Failure.
                deferred.reject(error.statusText);
            }
        );

        return deferred.promise;
    }

    // ======================================================================
    //
    // Our public interface:

    return {
        get_access_id      : get_access_id,
        send_status_update : send_status_update,
        get_status_updates : get_status_updates,
        get_history        : get_history,
        get_messages       : get_messages,
        send_message       : send_message,
        create_permission  : create_permission,
        get_permissions    : get_permissions,
        delete_permission  : delete_permission
    }
}]);

