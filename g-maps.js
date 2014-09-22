/*
    Dependencies:
    require, require async lib, jquery
    Returns a jquery promise

USAGE:

define([
    'g-maps'

], function ($Gmaps) {
        var ,
        mapDiv = document.querySelector('#map'),
        latLng = [38.910943, 59.353517],
        gmapOptions = {
            // default options
        },
        coordsArray = [
            {
                latLng : [38.910943, 59.353517],
                data : {
                    // whatever you want here
                }
            }
        ],
        gmapOptions = {};

        if ($Gmaps) {
            $Gmaps.done(function (Map) {

                gmap = new Map(mapDiv, gmapOptions);
                gmap.init();

                // set map markers
            gmap.deleteMarkers()
            .setCenter(latLng)
            .setZoom(7)
            .addMarkers(coordsArray, function (data) {
                _this.onMarkerClicked(data);
            })
            .setAllMap()
            .showMarkers();
            });

            
        } 
        return gmap;

});


 */

define([
    'require',
    'async'

], function (require, async) {
    'use strict';
    /**
     * A module to abstract the gmaps API
     * @exports modules/g-maps/g-maps
     * @returns {$object} $promise - jQuery deferred object
     * @version 1.0
     */
    var $promise = $.Deferred();

    //  wrapped in a require object so that we can dynamically add vars to the gmaps url (mainly the API key)
    // 'eg: async!http://maps.google.com/maps/api/js?&key=API_KEY&sensor=false!callback'
    require(['async!http://maps.google.com/maps/api/js?sensor=false!callback'], function(gmaps){


        if (!google && !google.maps) {
            throw new Error('Maps library could not be loaded!');
        }

        var defaultOptions = {
            // path to custom icon
            'icon': 'map-pin.png'
        };

        function Map(elem, options) {
            this.map = null;
            this.markers = [];
            this.mapClickCallbacks = [];
            this.mapZoomCallbacks = [];
            this.elem = elem;
            this.icon = options.icon || defaultOptions.icon;

            // extend this object to accept custom options
            this.mapOptions = {
                zoom: 4,
                disableDefaultUI: true,
                scrollwheel: false,
                zoomControl: true,
                center: new google.maps.LatLng(47.147354, 16.158813),
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.LARGE,
                    position: google.maps.ControlPosition.RIGHT_TOP
                },
                scaleControl: false
            };

            return this;
        }


        /** Centres the map at a particular lat and long.
         * @param {Array} latLng
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.setCenter = function (latLng) {
            var newLatLng = new google.maps.LatLng(latLng[0], latLng[1]);
            this.map.setCenter(newLatLng);
            return this;
        };

        /** Centres the map at a particular lat and long.
         * @param {Number} zoom
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.setZoom = function (zoom) {
            if (typeof zoom === 'number') {
                this.map.setZoom(zoom);
            }
            return this;
        };

        /** Add an array of markers to the map and push to the array.
         * @param {Array} coordsArray - an array of objects
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.addMarkers = function (coordsArray, callback) {
            var _this = this,
                i = 0,
                j = coordsArray.length,
                marker,
                gLocation;

            for (i; i < j; i++) {

                gLocation = new google.maps.LatLng(coordsArray[i].latLng[0], coordsArray[i].latLng[1]);

                marker = new google.maps.Marker({
                    position: gLocation,
                    icon: _this.icon,
                    map: _this.map,
                    data : coordsArray[i]
                });

                _this.assignMarkerEvent(marker, 'click', callback);

                this.markers.push(marker);
            }
            return this;
        };

        /** assignMarkerEvent
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.assignMarkerEvent = function (marker, event, callback) {
            google.maps.event.addListener(marker, event, function() {
                if (typeof callback === 'function') {
                    callback(this.data);
                }
            });
            return this;
        };

        /** Sets the map on all markers in the array.
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.setAllMap = function (_map) {
            var i = 0,
                j = this.markers.length;
            for (i; i < j; i++) {
                this.markers[i].setMap(_map);
            }
            return this;
        };

        /** Removes the markers from the map, but keeps them in the array.
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.clearMarkers = function () {
            this.setAllMap(null);
            return this;
        };

        /** Shows any markers currently in the array.
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.showMarkers = function () {
            this.setAllMap(this.map);
            return this;
        };

        /** Deletes all markers in the array by removing references to them.
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.deleteMarkers = function () {
            this.clearMarkers();
            this.markers = [];
            return this;
        };

        /** Adds a custom function to map zoom event
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.registerMapZoomEvent = function (callback) {
            if (typeof callback === 'function') {
                this.mapZoomCallbacks.push(callback);
            }
            return this;
        };

        /** Adds a custom function to map click event
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.registerMapClickEvent = function (callback) {
            if (typeof callback === 'function') {
                this.mapClickCallbacks.push(callback);
            }
            return this;
        };

        /** onMapInteract
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.onMapInteract = function (arrayName, args) {
            var i = 0,
                j = this[arrayName].length;

            for (i; i<j; i++) {
                this[arrayName][i](args);
            }

            return this;
        };

        /** Proxy for getZoom() func
         * @this {Map}
         * @returns {number} zoomLevel
         */
        Map.prototype.getZoom = function () {
            return this.map.getZoom();
        };

        /** init
         * @this {Map}
         * @returns {Map}
         */
        Map.prototype.init = function () {

            var _this = this;

            this.map = new google.maps.Map(this.elem, this.mapOptions);

            // add map click event
            google.maps.event.addListener(this.map, 'click', function(event) {
                _this.onMapInteract('mapClickCallbacks', event);
            });

            // add zoom click event
            google.maps.event.addListener(this.map, 'zoom_changed', function() {
                _this.onMapInteract('mapZoomCallbacks', _this.getZoom());
            });

            return this;
        };


        $promise.resolve(Map);

    });

    return $promise;

});