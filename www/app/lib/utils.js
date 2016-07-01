/* app.lib.utils
 *
 * This module defines various utility functions for the StorageAPITest app.
 */

angular.module('app.lib.utils', ['ionic']);

angular.module('app.lib.utils').factory('utils',
   ['$ionicPopup', function($ionicPopup) {

    var showing_error = false; // Used by show_error to prevent recursive msgs.

    // ======================================================================
    //
    // get_device_id()
    //
    //     Return the unique device ID for this device.

    var get_device_id = function() {

        if (window.cordova) {
            return device.uuid;
        } else {
            return "BROWSER"; // Best fallback when running in a browser?
        }
    }

    // ======================================================================
    //
    // calc_hmac_headers(method, url, body, access_secret)
    //
    //     Calculate the HMAC headers needed to make an authenticated call
    //     to the MM-Server API.

    var calc_hmac_headers = function(method, url, body, access_secret) {

        var nonce_string = uuid.v4();
        var content_md5  = md5(body);

        var hmac_parts   = method + "\n" + url + "\n" + content_md5 + "\n"
                         + nonce_string + "\n" + access_secret;
        var hasher = new jsSHA(hmac_parts, "TEXT");
        var hmac_auth_string = btoa(hasher.getHash("SHA-1", "HEX"));

        headers = {"Authorization": "HMAC " + hmac_auth_string,
                   "Content-MD5":   content_md5,
                   "Nonce":         nonce_string}

        return headers;
    }

    // ======================================================================
    //
    // show_error(err_msg)
    //
    //     Display the given error message to the user.

    var show_error = function(err_msg) {

        if (showing_error) {
            return
        }

        showing_error = true;
        $ionicPopup.alert({title: "Internal Error",
                           subTitle: err_msg}).then(
            function() {
                showing_error = false;
            }
        );
    }

    // ======================================================================
    //
    // string_to_moment(s)
    //
    //     Convert the given RFC-3339 format string into a Moment.JS object.

    var string_to_moment = function(s) {

        return moment(s, "YYYY-MM-DDTHH:mm:ssZ");
    }

    // ======================================================================
    //
    // moment_to_string(m)
    //
    //     Convert the given Moment.JS object into an RFC-3339 format string.

    var moment_to_string = function(m) {

        return m.format("YYYY-MM-DDTHH:mm:ssZ");
    }

    // ======================================================================
    //
    // Our public interface:

    return {
        get_device_id     : get_device_id,
        calc_hmac_headers : calc_hmac_headers,
        show_error        : show_error,
        string_to_moment  : string_to_moment,
        moment_to_string  : moment_to_string
    }
}]);

