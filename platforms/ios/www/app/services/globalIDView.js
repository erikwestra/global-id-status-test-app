/* app.services.globalIDView
 *
 * This module implements a class named GlobalIDView.  This class implements
 * the visual appearance of a global ID on the map.  The GlobalIDView keeps
 * track of the status updates received over time and uses this information to
 * build the various visual elements which appear on the map for a single global
 * ID.
 */

angular.module('app.services.globalIDView',
               ['app.lib.config',
                'app.lib.utils',
                'app.lib.greatCircle',
                'app.lib.mapLabel']);

// ##########################################################################

angular.module('app.services.globalIDView').factory('GlobalIDView',
    ['config', 'utils', 'greatCircle', 'mapLabel',
     function(config, utils, greatCircle, mapLabel) {

        // ==================================================================
        //
        // GlobalIDView(global_id, label)
        //
        //     This is the constructor function for our GlobalIDView class.
        //
        //     The parameters are as follows:
        //
        //         'global_id'
        //
        //             The global ID for the person, group or thing this view
        //             is for.
        //
        //         'label'
        //
        //             A string to display on the map to label this global ID.
        //             This can either be the global ID itself, or a more
        //             user-friendly version of the ID such as a user-supplied
        //             name.

        function GlobalIDView(global_id, label) {

            this._global_id = global_id;
            this._label     = label;
            this._map       = null;

            this._locations = new HashMap(); // A mapping from timestamp
                                             // objects to google.maps.LatLng
                                             // for all received locations.
                                             // Note that this gets broken down
                                             // into segments as appropriate.

            this._segments  = []; // Array of segments shown for this global
                                  // ID.  Each array entry is an object with
                                  // the following fields:
                                  //
                                  //     'locations'
                                  //
                                  //         A HashMap mapping each timestamp
                                  //         object to a google.maps.LatLng
                                  //         object for each location which
                                  //         makes up this segment.
                                  //
                                  //     'type'
                                  //
                                  //         A string indicating the type of
                                  //         segment we are displaying.  The
                                  //         following type codes are currently
                                  //         supported:
                                  //
                                  //             "CURRENT"
                                  //
                                  //                 This segment ends at the
                                  //                 user's current location.
                                  //
                                  //             "STOPPED"
                                  //
                                  //                 This segment ends at the
                                  //                 point where this user has
                                  //                 stopped moving for a
                                  //                 while.
                                  //
                                  //             "JUMPED"
                                  //
                                  //                 This segment ends at the
                                  //                 point where the user
                                  //                 jumped to a new location.
                                  //
                                  //         Note that the type affects how the
                                  //         segment will be displayed on the
                                  //         map.
                                  //
                                  //     'polyline'
                                  //
                                  //         A google.maps.Polyline object that
                                  //         draws the line for this segment of
                                  //         the entity's path.
                                  //
                                  //     'marker'
                                  //
                                  //         A google.maps.Marker to display at
                                  //         the endpoint of the segment.
                                  //
                                  //     'maplabel'
                                  //
                                  //         A mapLabel object to display at
                                  //         the endpoint of the segment.
                                  //
                                  // Note that the 'polyline', 'marker' and
                                  // 'maplabel' fields will be set to null if
                                  // we don't need to display this type of
                                  // element.
        }

        GlobalIDView.prototype = {};

        // ==================================================================
        //
        // global_id()
        //
        //     Return the global ID associated with this view.

        GlobalIDView.prototype.global_id = function() {

            return this._global_id;
        }

        // ==================================================================
        //
        // add_to_map(map)
        //
        //     Set the GlobalIDView to display itself on the given map.
        //
        //     'map' is a Google Map object the global ID view should be
        //     displayed on.

        GlobalIDView.prototype.add_to_map = function(map) {

            this._map = map;

            for (var i=0; i < this._segments.length; i++) {
                var segment = this._segments[i];
                if (segment.polyline != null) {
                    segment.polyline.setMap(map);
                }
                if (segment.marker != null) {
                    segment.marker.setMap(map);
                }
                if (segment.maplabel != null) {
                    segment.maplabel.set("map", map);
                }
            }
        }

        // ==================================================================
        //
        // remove_from_map()
        //
        //     Remove this GlobalIDView from the map.

        GlobalIDView.prototype.remove_from_map = function() {

            if (this._map != null) {
                for (var i=0; i < this._segments.length; i++) {
                    var segment = this._segments[i];
                    if (segment.polyline != null) {
                        segment.polyline.setMap(null);
                    }
                    if (segment.marker != null) {
                        segment.marker.setMap(null);
                    }
                    if (segment.maplabel != null) {
                        segment.maplabel.set("map", null);
                    }
                }
            }
            this._map = null;
        }

        // ==================================================================
        //
        // add_location(timestamp, latitude, longitude)
        //
        //     Add the given location to our view.
        //
        //     'timestamp' is a string that contains the timestamp for the
        //     given location, as a JS moment() object; 'latitude' and
        //     'longitude' define the location associated with this global ID
        //     at that moment in time.
        //
        //     We add the location to our private history of the user's
        //     location, updating our map elements to match.

        GlobalIDView.prototype.add_location = function(timestamp,
                                                       latitude, longitude) {

            var position = new google.maps.LatLng(latitude, longitude);

            if ((this._locations.has(datetime)) &&
                (this._locations.get(timestamp).equals(position))) {
                return; // We already have this location -> don't add it twice.
            }

            this._locations.set(timestamp, position);
            this.update_view();
        }

        // ==================================================================
        //
        // add_locations(locations)
        //
        //     Add a number of locations at once to our view.
        //
        //     'locations' should be a HashMap mapping each timestamp to an
        //     object with 'latitude' and 'longitude' fields.
        //
        //     Note that this is equivalent to calling add_location() for each
        //     location in turn, except that it is optimised to avoid
        //     unnecessary screen redraws.

        GlobalIDView.prototype.add_locations = function(locations) {

            var changed = false; // initially.
            var cur_locations = this._locations;

            locations.forEach(function(value, key) {
                var timestamp = key;
                var position  = new google.maps.LatLng(value.latitude,
                                                       value.longitude);

                if ((cur_locations.has(timestamp)) &&
                    (cur_locations.get(timestamp).equals(position))) {
                    return; // We already have this location -> don't add it
                            // twice.
                }

                cur_locations.set(timestamp, position);
                changed = true;
            });

            if (changed) {
                this.update_view();
            }
        }

        // ==================================================================
        //
        // update_view()
        //
        //     Update our view to show the current set of locations.
        //
        //     Note that this method is used internally; it should not be
        //     called outside of this class itself.

        GlobalIDView.prototype.update_view = function() {

            // The following helper function returns a sorted list of
            // timestamps from the given HashMap, where the timestamps are
            // stored as they keys into the HashMap.

            var get_hashmap_timestamps = function(hashmap) {

                var timestamps = hashmap.keys();
                timestamps.sort(function(t1, t2) {
                    if (t1.isBefore(t2)) {
                        return -1;
                    } else if (t1.isSame(t2)) {
                        return 0;
                    } else {
                        return 1;
                    }
                });
                return timestamps;
            }

            // Remove the current segments, if any, from the map.

            for (var i=0; i < this._segments.length; i++) {
                var segment = this._segments[i];
                if (segment.polyline != null) {
                    segment.polyline.setMap(null);
                }
                if (segment.marker != null) {
                    segment.marker.setMap(null);
                }
                if (segment.maplabel != null) {
                    segment.maplabel.set("map", null);
                }
            }

            // Split the master list of locations into segments.  We split the
            // location at all points where the timestamp differs by more than
            // config.MAX_SEGMENT_TIME_DELTA seconds, or the location differs
            // by more than config.MAX_SEGMENT_DIST_DELTA metres.

            segments = []; // An array of segments, matching the structure of
                           // this._segments.

            var timestamps = get_hashmap_timestamps(this._locations);

            var prev_timestamp = null;
            var prev_position  = null;

            for (var i=0; i < timestamps.length; i++) {
                var cur_timestamp = timestamps[i];
                var cur_position  = this._locations.get(cur_timestamp);

                var new_segment       = false; // Start a new segment?
                var prev_segment_type = null; // 'type' value to use for the
                                              // previous segment, if starting
                                              // a new one.

                if ((prev_timestamp == null) || (prev_position == null)) {
                    new_segment       = true;
                    prev_segment_type = null; // No previous segment.
                } else {
                    var time_delta = cur_timestamp.diff(prev_timestamp,
                                                        "seconds");
                    if (time_delta > config.MAX_SEGMENT_TIME_DELTA) {
                        new_segment       = true;
                        prev_segment_type = "STOPPED";
                    } else {
                        var dist_delta = greatCircle.distance(
                                                        prev_position.lat(),
                                                        prev_position.lng(),
                                                        cur_position.lat(),
                                                        cur_position.lng());
                        if (dist_delta > config.MAX_SEGMENT_DIST_DELTA) {
                            new_segment       = true;
                            prev_segment_type = "JUMPED";
                        }
                    }
                }

                if (new_segment) {
                    // Start a new segment.
                    if (prev_segment_type != null) {
                        var prev_segment = segments[segments.length-1];
                        prev_segment.type = prev_segment_type;
                    }
                    var segment = {locations: new HashMap()};
                    segment.locations.set(cur_timestamp, cur_position);
                    segments.push(segment);
                } else {
                    // Add this location to the current segment.
                    var segment = segments[segments.length-1];
                    segment.locations.set(cur_timestamp, cur_position);
                }

                prev_timestamp = cur_timestamp;
                prev_position  = cur_position;
            }

            // We've now calculated the segment locations and the 'type' value
            // for all segments except for the last one.  See if the most
            // recent timestamp is more than config.MAX_SEGMENT_TIME_DELTA
            // seconds old; if so, we consider the user to have stopped moving.

            var last_segment = segments[segments.length-1];

            var last_timestamp = null; // initially.
            last_segment.locations.forEach(function(value, key) {
                var timestamp = key;
                if ((last_timestamp == null) ||
                    (timestamp.isBefore(last_timestamp))) {
                    last_timestamp = timestamp;
                }
            });
            if (moment().diff(last_timestamp,
                              "seconds") > config.MAX_SEGMENT_TIME_DELTA) {
                last_segment.type = "STOPPED";
            } else {
                last_segment.type = "CURRENT";
            }

            // Now that we have the updated list of segments, create our map
            // elements to display the various segments.
            //
            // FIXME: Add visual distinction based on the 'type' field.

            this._segments = [];

            for (var i=0; i < segments.length; i++) {
                var segment = segments[i];

                var timestamps = get_hashmap_timestamps(segment.locations);

                var path = [];
                for (var i=0; i < timestamps.length; i++) {
                    var timestamp = timestamps[i];
                    var position = segment.locations.get(timestamp);
                    path.push(position);
                }

                var latest_position = null;
                if (timestamps.length > 0) {
                    var latest = timestamps[timestamps.length-1];
                    var latest_position = segment.locations.get(latest);
                }

                segment.polyline  = new google.maps.Polyline({
                                            strokeColor: '#000000',
                                            strokeOpacity: 1.0,
                                            strokeWeight: 1,
                                            map: this._map
                                        });
                segment.polyline.setPath(path);

                segment.marker    = new google.maps.Marker({
                                            clickable: false,
                                            draggable: false,
                                            map: this._map
                                        });
                if (latest_position != null) {
                    segment.marker.setPosition(latest_position);
                }

                segment.maplabel  = mapLabel.create({
                                            text: this._label,
                                            fontSize: 16,
                                            zIndex: 1000,
                                            map: this._map
                                        });
                if (latest_position != null) {
                    segment.maplabel.set("position", latest_position);
                }

                this._segments.push(segment);
            }
        }

        // ==================================================================
        //
        // Return our constructor function so that we can inject the
        // GlobalIDView class into the other modules which need it.

        return GlobalIDView;
     }
    ]
);

