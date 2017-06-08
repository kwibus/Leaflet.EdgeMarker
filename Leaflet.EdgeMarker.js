(function(L) {
  'use strict';
  var classToExtend = 'Class';
  if (L.version.charAt(0) !== '0') {
    classToExtend = 'Layer';
  }

  L.EdgeMarker = L[classToExtend].extend({
    options: {
      distanceOpacity: false,
      distanceOpacityFactor: 4,
      rotateIcons: true,
      icon: L.icon({
        iconUrl: L.Icon.Default.imagePath + '/edge-arrow-marker.png',
        clickable: true,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      })
    },

    initialize: function(target,options) {
      this._target = target;
      L.setOptions(this, options);
    },

    addTo: function(map) {
      this._map = map;

      map.on('move', this._addEdgeMarkers, this);
      map.on('viewreset', this._addEdgeMarkers, this);

      this._addEdgeMarkers();

      return this;
    },

    destroy: function() {
      if (this._map ) {
        this._map.off('move', this._addEdgeMarkers, this);
        this._map.off('viewreset', this._addEdgeMarkers, this);
        this._removeMarker();
        this._map.removeLayer(this);
      }
    },

    setTarget: function (latlng){
      this._target=latlng;
      this._addEdgeMarkers();
    },

    _makeThisTarget: function (object)
    {
      this.setTarget(object.latlng);
    },

    onClick: function(e) {
      this._map.setView(e.latlng, this._map.getZoom());
    },

    onAdd: function() {},

    _marker: undefined,
    _target: undefined,

    _addEdgeMarkers: function() {
      this._removeMarker();
      if ( this._target  != undefined){
        var mapPixelBounds = this._map.getSize();

        var markerWidth = this.options.icon.options.iconSize[0];
        var markerHeight = this.options.icon.options.iconSize[1];

        var currentMarkerPosition = this._map.latLngToContainerPoint( this._target);

        if (
          currentMarkerPosition.y < 0 ||
          currentMarkerPosition.y > mapPixelBounds.y ||
          currentMarkerPosition.x > mapPixelBounds.x ||
          currentMarkerPosition.x < 0
        ) {
          // get pos of marker
          var x = currentMarkerPosition.x;
          var y = currentMarkerPosition.y;
          var markerDistance;

          // top out
          if (currentMarkerPosition.y < 0) {
            y = 0 + markerHeight / 2;
            markerDistance = -currentMarkerPosition.y;
            // bottom out
          } else if (currentMarkerPosition.y > mapPixelBounds.y) {
            y = mapPixelBounds.y - markerHeight / 2;
            markerDistance = currentMarkerPosition.y - mapPixelBounds.y;
          }

          // right out
          if (currentMarkerPosition.x > mapPixelBounds.x) {
            x = mapPixelBounds.x - markerWidth / 2;
            markerDistance = currentMarkerPosition.x - mapPixelBounds.x;
            // left out
          } else if (currentMarkerPosition.x < 0) {
            x = 0 + markerWidth / 2;
            markerDistance = -currentMarkerPosition.x;
          }

          // change opacity on distance
          var newOptions = this.options;
          if (this.options.distanceOpacity) {
            newOptions.fillOpacity =
              (100 - markerDistance / this.options.distanceOpacityFactor) / 100;
          }

          // rotate markers
          if (this.options.rotateIcons) {
            var centerX = mapPixelBounds.x / 2;
            var centerY = mapPixelBounds.y / 2;
            var angle = Math.atan2(centerY - y, centerX - x) / Math.PI * 180;
            newOptions.angle = angle;
          }

          var ref = { latlng: this._targert };
          newOptions = L.extend({}, newOptions, ref);

          this._marker = L.rotatedMarker(
              this._map.containerPointToLatLng([x, y]),
              newOptions
            ).addTo(this._map);
        }
      }
    },

    _removeMarker: function (){
      if (! (typeof this._marker === 'undefined')) {
        this._map.removeLayer(this._marker);
        this._marker=undefined;
      }
    }
  });

  L[classToExtend].include({

    bindEdgeMarker: function (options){
      if (!this._edgeMarkerHandlersAdded) {
        this._edgeMarker = L.edgeMarker(this.getLatLng(),options);
        this._edgeMarker.addTo(this._map);
        this.on('remove', this._edgeMarker.destroy, this._edgeMarker); // does not fire on leaflet 0.7
        this.on('move', this._edgeMarker._makeThisTarget, this._edgeMarker);
        this._edgeMarkerHandlersAdded = true;
      }
      return this;
    },

    unbindEdgeMarker: function (){
      if (this._edgeMarker){
        this.off('remove', this._edgeMarker.remove, this._edgeMarker);// does not have effect on leaflet 0.7
        this.off('move', this._edgeMarker._makeThisTarget, this._edgeMarker);
        this._edgeMarker.remove();
        this._edgeMarker=undefined;
        this._edgeMarkerHandlersAdded=false;
      }
        return this;
    },
  });

  /*
   * L.rotatedMarker class is taken from https://github.com/bbecquet/Leaflet.PolylineDecorator.
   */
  L.RotatedMarker = L.Marker.extend({
    options: {
      angle: 0
    },

    statics: {
      TRANSFORM_ORIGIN: L.DomUtil.testProp([
        'transformOrigin',
        'WebkitTransformOrigin',
        'OTransformOrigin',
        'MozTransformOrigin',
        'msTransformOrigin'
      ])
    },

    _initIcon: function() {
      L.Marker.prototype._initIcon.call(this);

      this._icon.style[L.RotatedMarker.TRANSFORM_ORIGIN] = '50% 50%';
    },

    _setPos: function(pos) {
      L.Marker.prototype._setPos.call(this, pos);

      if (L.DomUtil.TRANSFORM) {
        // use the CSS transform rule if available
        this._icon.style[L.DomUtil.TRANSFORM] +=
          ' rotate(' + this.options.angle + 'deg)';
      } else if (L.Browser.ie) {
        // fallback for IE6, IE7, IE8
        var rad = this.options.angle * (Math.PI / 180),
          costheta = Math.cos(rad),
          sintheta = Math.sin(rad);
        this._icon.style.filter +=
          " progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11=" +
          costheta +
          ', M12=' +
          -sintheta +
          ', M21=' +
          sintheta +
          ', M22=' +
          costheta +
          ')';
      }
    },

    setAngle: function(ang) {
      this.options.angle = ang;
    }
  });

  L.rotatedMarker = function(pos, options) {
    return new L.RotatedMarker(pos, options);
  };

  L.edgeMarker = function(target, options) {
    return new L.EdgeMarker(target, options);
  };
})(L);
