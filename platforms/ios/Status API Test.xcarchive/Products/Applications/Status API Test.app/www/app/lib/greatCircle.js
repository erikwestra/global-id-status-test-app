/* app/lib/greatCircle.js
 *
 * This file implements a "greatCircle" module which implements various
 * functions for performing great-circle distance calculations.
 */

angular.module('app.lib.greatCircle', []);

angular.module('app.lib.greatCircle').factory('greatCircle',
    function() {

        // ==================================================================
        //
        // distance(lat1, long1, lat2, long2)
        //
        //     Return the distance between the two points, in metres.

        var distance = function(lat1, long1, lat2, long2) {

            var rLat1  = lat1 * (Math.PI / 180);
            var rLong1 = long1 * (Math.PI / 180);

            var rLat2  = lat2 * (Math.PI / 180);
            var rLong2 = long2 * (Math.PI / 180);

            var dLat  = rLat2 - rLat1;
            var dLong = rLong2 - rLong1

            var a = Math.pow(Math.sin(dLat/2), 2)
                  + Math.cos(rLat1) * Math.cos(rLat2)
                                    * Math.pow(Math.sin(dLong/2), 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            var distance = 6371 * c; // Distance in kilometres.

            return distance * 1000; // Distance in metres.
        }

        // ==================================================================
        //
        // end_point(start_lat, start_long, distance, bearing)
        //
        //     Calculate a point a given distance and bearing from a starting
        //     point.
        //
        //     'start_lat' and 'start_long' define the starting point.
        //     'distance' is the desired distance to travel, in metres, and
        //     'bearing' is the desired directon of travel, in degrees from due
        //     north.
        //
        //     We return an array with two entries, end_lat and end_long.
        //     These define the coordinates for a point that is the given
        //     distance away from the starting point, heading in the given
        //     direction.
        //
        //     Note that this code is adapted from:
        //
        //         http://stackoverflow.com/questions/7222382

        var end_point = function(start_lat, start_long, distance, bearing) {

            var RADIUS = 6378100.0; // Radius of the Earth, in metres.
            bearing = bearing * (Math.PI / 180); // Convert to radians.

            lat1  = start_lat  * (Math.PI / 180);
            long1 = start_long * (Math.PI / 180);

            var lat2 = Math.asin(Math.sin(lat1)*Math.cos(distance/RADIUS) +
                                 Math.cos(lat1)*Math.sin(distance/RADIUS) *
                                 Math.cos(bearing));

            var long2 = long1 + Math.atan2(Math.sin(bearing) *
                                           Math.sin(distance/RADIUS) *
                                           Math.cos(lat1),
                                           Math.cos(distance/RADIUS) -
                                           Math.sin(lat1) * Math.sin(lat2));

            lat2  = lat2  / (Math.PI / 180);
            long2 = long2 / (Math.PI / 180);

            return [lat2, long2];
        }

        // ==================================================================
        //
        // angular_distance(start_lat, start_long, distance, method)
        //
        //     Convert a distance in metres into an angular distance.
        //
        //     'start_lat' and 'start_long' define the starting point, and
        //     'distance' is the desired distance, measured in metres.
        //     'method' is a string defining how the angular distance should be
        //     calculated; the following method values are currently supported:
        //
        //         "MIN"     = the smallest angular distance.
        //         "MAX"     = the biggest angular distance.
        //         "AVERAGE" = the average angular distance.
        //
        //     We start by calculating the position of four points, heading in
        //     each of the cardinal directions from the given starting point
        //     for the given distance:
        //
        //                     Point 1
        //                        ^
        //                        |
        //            Point 2 <---+---> Point 3
        //                        |
        //                        v
        //                     Point 4
        //
        //     We then calculate how far away each of these four points is from
        //     the starting point, and use these four angular distance values
        //     to calculate a single angular distance value using the specified
        //     method.

        var angular_distance = function(start_lat, start_long,
                                        distance, method) {

            var point_1 = end_point(start_lat, start_long, distance, 0);
            var point_2 = end_point(start_lat, start_long, distance, 270);
            var point_3 = end_point(start_lat, start_long, distance, 90);
            var point_4 = end_point(start_lat, start_long, distance, 180);

            var lat_delta_1  = point_1[0] - start_lat;
            var lat_delta_2  = start_lat - point_4[0];
            var long_delta_1 = start_long - point_2[1];
            var long_delta_2 = point_3[1] - start_long;

            if (method == "MAX") {
                return Math.max(lat_delta_1, long_delta_1,
                                lat_delta_2, long_delta_2);
            } else if (method == "MIN") {
                return Math.min(lat_delta_1, long_delta_1,
                                lat_delta_2, long_delta_2);
            } else if (method == "AVERAGE") {
                return (lat_delta_1+long_delta_1+lat_delta_2+long_delta_2)/4;
            } else {
                throw new Error("Unknown method: " + method);
            }
        }

        // ==================================================================
        //
        // Define our public interface:

        return {
            distance         : distance,
            end_point        : end_point,
            angular_distance : angular_distance
        }
    }
);

