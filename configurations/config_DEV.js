/* app.lib.config
 *
 * This module provides a single constant named "config" which holds various
 * configuration settings for the StatusAPITest app.
 *
 * WARNING: If you edit this file, make sure you edit the version in the
 *          `configurations` directory, and not the copy in `app/lib`.  The
 *          `copy_config.sh` shell script will overwrite the copy in `app/lib`
 *          when building the application.
 *
 * NOTE: These settings are for running in the development environment.
 */

angular.module('app.lib.config', []);

angular.module('app.lib.config').constant('config', {
    GOOGLE_MAPS_API_KEY     : "AIzaSyAv-MdvdPzBAEwbQq5aILLEq0Az3d_oOc0",
    //STATUS_API_SERVER_URL: "http://127.0.0.1:8000",
    STATUS_API_SERVER_URL   : "http://status.3taps.com",
    POLL_FREQUENCY          : 5000, // Milliseconds.
    MIN_GEOLOCATOR_DELTA    : 10,   // Metres.
    MIN_GEOLOCATOR_TIME     : 30,   // Seconds.
    MAX_SEGMENT_TIME_DELTA  : 600,  // Seconds (600 = 10 minutes).
    MAX_SEGMENT_DIST_DELTA  : 1000, // Metres.
    LOCATION_HISTORY_CUTOFF : 0     // Hours.
});

