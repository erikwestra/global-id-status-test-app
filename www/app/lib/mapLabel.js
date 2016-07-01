/* app/lib/mapLabel.js
 *
 * This module implements a custom map label used to draw labels onto a Google
 * Map.
 *
 * Note that this is a modified version of the "Map Label" library provided by
 * Google Maps:
 *
 *     https://github.com/googlemaps/js-map-label
 */

angular.module('app.lib.mapLabel', []);

angular.module('app.lib.mapLabel').factory('mapLabel',
    function() {

        // ==================================================================
        //
        // create(options)
        //
        //     Create and return an instance of the MapLabel class, using the
        //     given options.

        var create = function(options) {

            function _MapLabel(opt_options) {
              this.set('fontFamily', 'sans-serif');
              this.set('fontSize', 12);
              this.set('fontColor', '#000000');
              this.set('strokeWeight', 4);
              this.set('strokeColor', '#ffffff');
              this.set('align', 'center');
              this.set('zIndex', 1e3);

              this.setValues(opt_options);
            }
            _MapLabel.prototype = new google.maps.OverlayView;

            _MapLabel.prototype.changed = function(prop) {
              switch (prop) {
                case 'fontFamily':
                case 'fontSize':
                case 'fontColor':
                case 'strokeWeight':
                case 'strokeColor':
                case 'align':
                case 'text':
                  return this.drawCanvas_();
                case 'maxZoom':
                case 'minZoom':
                case 'position':
                  return this.draw();
              }
            };

            _MapLabel.prototype.drawCanvas_ = function() {
              var canvas = this.canvas_;
              if (!canvas) return;

              var style = canvas.style;
              style.zIndex = (this.get('zIndex'));

              var ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.strokeStyle = this.get('strokeColor');
              ctx.fillStyle = this.get('fontColor');
              ctx.font = this.get('fontSize') + 'px ' + this.get('fontFamily');

              var strokeWeight = Number(this.get('strokeWeight'));

              var text = this.get('text');
              if (text) {
                if (strokeWeight) {
                  ctx.lineWidth = strokeWeight;
                  ctx.strokeText(text, strokeWeight, strokeWeight);
                }

                ctx.fillText(text, strokeWeight, strokeWeight);

                var textMeasure = ctx.measureText(text);
                var textWidth = textMeasure.width + strokeWeight;
                style.marginLeft = this.getMarginLeft_(textWidth) + 'px';
                style.marginTop = "-0.4em";
              }
            };

            _MapLabel.prototype.onAdd = function() {
              var canvas = this.canvas_ = document.createElement('canvas');
              var style = canvas.style;
              style.position = 'absolute';

              var ctx = canvas.getContext('2d');
              ctx.lineJoin = 'round';
              ctx.textBaseline = 'top';

              this.drawCanvas_();

              var panes = this.getPanes();
              if (panes) {
                panes.floatPane.appendChild(canvas);
              }
            };
            _MapLabel.prototype['onAdd'] = _MapLabel.prototype.onAdd;

            _MapLabel.prototype.getMarginLeft_ = function(textWidth) {
              switch (this.get('align')) {
                case 'left':
                  return 0;
                case 'right':
                  return -textWidth;
              }
              return textWidth / -2;
            };

            _MapLabel.prototype.draw = function() {
              var projection = this.getProjection();

              if (!projection) {
                // The map projection is not ready yet so do nothing
                return;
              }

              if (!this.canvas_) {
                // onAdd has not been called yet.
                return;
              }

              var latLng = this.get('position');
              if (!latLng) {
                return;
              }
              var pos = projection.fromLatLngToDivPixel(latLng);

              var style = this.canvas_.style;

              style['top'] = pos.y + 'px';
              style['left'] = pos.x + 'px';

              style['visibility'] = this.getVisible_();
            };
            _MapLabel.prototype['draw'] = _MapLabel.prototype.draw;

            _MapLabel.prototype.getVisible_ = function() {
              var minZoom = this.get('minZoom');
              var maxZoom = this.get('maxZoom');

              if (minZoom === undefined && maxZoom === undefined) {
                return '';
              }

              var map = this.getMap();
              if (!map) {
                return '';
              }

              var mapZoom = map.getZoom();
              if (mapZoom < minZoom || mapZoom > maxZoom) {
                return 'hidden';
              }
              return '';
            };

            _MapLabel.prototype.onRemove = function() {
              var canvas = this.canvas_;
              if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
              }
            };
            _MapLabel.prototype['onRemove'] = _MapLabel.prototype.onRemove;

            return new _MapLabel(options);
        }

        // ==================================================================
        //
        // Our public interface:

        return {
            create : create
        };
    }
);
