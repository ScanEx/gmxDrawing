(function () {

var rectDelta = 0.0000001;
var stateVersion = '1.0.0';

L.GmxDrawing = L.Class.extend({
    options: {
        type: ''
    },
    includes: L.Mixin.Events,

    initialize: function (map) {
        this._map = map;
        this.items = [];
        this.current = null;

        if (L.gmxUtil && L.gmxUtil.prettifyDistance) {
            var tooltip = document.createElementNS(L.Path.SVG_NS, 'g');
            L.DomUtil.addClass(tooltip, 'gmxTooltip');
            var bg = document.createElementNS(L.Path.SVG_NS, 'rect');
            bg.setAttributeNS(null, 'rx', 4);
            bg.setAttributeNS(null, 'ry', 4);
            bg.setAttributeNS(null, 'height', 16);
            L.DomUtil.addClass(bg, 'gmxTooltipBG');

            var text = document.createElementNS(L.Path.SVG_NS, 'text');
            var userSelectProperty = L.DomUtil.testProp(
                ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);
            text.style[userSelectProperty] = 'none';
            tooltip.appendChild(bg);
            tooltip.appendChild(text);

            this.hideTooltip = function() {
                tooltip.setAttributeNS(null, 'visibility', 'hidden');
            };
            this.showTooltip = function(point, mouseovertext) {
                var x = point.x + 11,
                    y = point.y - 14;
                text.setAttributeNS(null, 'x', x);
                text.setAttributeNS(null, 'y', y);
                text.textContent = mouseovertext;
                if (tooltip.getAttributeNS(null, 'visibility') !== 'visible') {
                    this._map._pathRoot.appendChild(tooltip);
                    tooltip.setAttributeNS(null, 'visibility', 'visible');
                }
                var length = text.getComputedTextLength();
                bg.setAttributeNS(null, 'width', length + 8);
                bg.setAttributeNS(null, 'x', x - 4);
                bg.setAttributeNS(null, 'y', y - 12);
            };
        }
    },

    bringToFront: function () {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var item = this.items[i];
            if (item._map && 'bringToFront' in item) { item.bringToFront(); }
        }
    },

    addGeoJSON: function (obj, options) {
        var arr = [],
            isLGeoJSON = obj instanceof L.GeoJSON;
        if (!isLGeoJSON) {
            obj = L.geoJson(obj, options);
        }
        if (obj instanceof L.GeoJSON) {
            var layers = obj.getLayers();
            if (layers) {
                for (var i = 0, len = layers.length; i < len; i++) {
                    arr.push(this.add(layers[i], options));
                }
            }
        }
        return arr;
    },

    add: function (obj, options) {
        var item = null;
        if (obj instanceof L.GmxDrawing.Feature) {
            item = obj;
        } else {
            options = options || {};
            if (!('editable' in options)) { options.editable = true; }
            if (obj instanceof L.Rectangle)     { options.type = 'Rectangle'; }
            else if (obj instanceof L.Polygon)  { options.type = 'Polygon'; }
            else if (obj instanceof L.MultiPolygon)  { options.type = 'MultiPolygon'; options.editable = true; }
            else if (obj instanceof L.Polyline) { options.type = 'Polyline'; }
            else if (obj instanceof L.MultiPolyline) { options.type = 'MultiPolyline'; options.editable = true; }
            else if (obj instanceof L.Marker) {
                options.type = 'Point'; options.editable = false;
            }
            item = new L.GmxDrawing.Feature(this, obj, options);
        }
        if (!('map' in options)) { options.map = true; }
        if (options.map && !item._map) { this._map.addLayer(item); }
        else { this._addItem(item); }
        //if (!item._map) this._map.addLayer(item);
        //if (item.points) item.points._path.setAttribute('fill-rule', 'inherit');
        if ('setEditMode' in item) { item.setEditMode(); }
        return item;
    },

    _disableDrag: function () {
        this._map.dragging.disable();
        L.DomUtil.disableTextSelection();
        L.DomUtil.disableImageDrag();
		this._map.doubleClickZoom.removeHooks();
    },

    _enableDrag: function () {
        this._map.dragging.enable();
        L.DomUtil.enableTextSelection();
        L.DomUtil.enableImageDrag();
		this._map.doubleClickZoom.addHooks();
    },

    _clearCreate: function () {
        if (this._createKey) {
            if (this._createKey.type === 'Rectangle' && L.Browser.mobile) {
                L.DomEvent.off(this._map._container, 'touchstart', this._createKey.fn, this);
            } else {
                this._map.off(this._createKey.eventName, this._createKey.fn, this);
            }
            this._enableDrag();
        }
        this._createKey = null;
    },

    create: function (type, drawOptions) {
        this._clearCreate(null);
        if (type) {
            if (type === 'Rectangle') {
                this._map._initPathRoot();
                this._map.dragging.disable();
            }
            var my = this,
                iconStyle;
            drawOptions = drawOptions || {};
            if (drawOptions.iconUrl) {
                iconStyle = {
                    iconUrl: drawOptions.iconUrl
                };
                delete drawOptions.iconUrl;
                if (drawOptions.iconAnchor) {
                    iconStyle.iconAnchor = drawOptions.iconAnchor;
                    delete drawOptions.iconAnchor;
                }
                if (drawOptions.iconSize) {
                    iconStyle.iconSize = drawOptions.iconSize;
                    delete drawOptions.iconSize;
                }
                if (drawOptions.popupAnchor) {
                    iconStyle.popupAnchor = drawOptions.popupAnchor;
                    delete drawOptions.popupAnchor;
                }
                if (drawOptions.shadowSize) {
                    iconStyle.shadowSize = drawOptions.shadowSize;
                    delete drawOptions.shadowSize;
                }
                drawOptions.markerStyle = {
                    iconStyle: iconStyle
                };
            }
            this._createKey = {
                type: type,
                eventName: type === 'Rectangle' ? (L.Browser.mobile ? 'touchstart' : 'mousedown') : 'click',
                fn: function (ev) {
                    var obj, key,
                        opt = {},
                        latlng = ev.latlng;

                    for (key in drawOptions) {
                        if (!(key in L.GmxDrawing.utils.defaultStyles)) {
                            opt[key] = drawOptions[key];
                        }
                    }
                    if (type === 'Point') {
                        var markerStyle = drawOptions.markerStyle || {},
                            markerOpt = {
                                draggable: true
                            };
                        if (ev && ev.originalEvent) {
                            markerOpt.ctrlKey = ev.originalEvent.ctrlKey;
                            markerOpt.shiftKey = ev.originalEvent.shiftKey;
                            markerOpt.altKey = ev.originalEvent.altKey;
                        }
                        if (markerStyle.iconStyle) {
                            markerOpt.icon = L.icon(markerStyle.iconStyle);
                        }
                        obj = my.add(L.marker(latlng, markerOpt), opt);
                    } else {
                        if (drawOptions.pointStyle) { opt.pointStyle = drawOptions.pointStyle; }
                        if (drawOptions.lineStyle) { opt.lineStyle = drawOptions.lineStyle; }
                        if (type === 'Rectangle') {
                            if (L.Browser.mobile) {
                                var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map);
                                latlng = downAttr.latlng;
                            }
                            opt.mode = 'edit';
                            obj = my.add(
                                L.rectangle(L.latLngBounds(L.latLng(latlng.lat + rectDelta, latlng.lng - rectDelta), latlng))
                            , opt);
                            if (L.Browser.mobile) { obj._startTouchMove(ev, true); }
                            else { obj._pointDown(ev); }

                            obj.rings[0].ring._drawstop = true;
                        } else if (type === 'Polygon') {
                            opt.mode = 'add';
                            obj = my.add(L.polygon([latlng]), opt);
                            obj.setAddMode();
                        } else if (type === 'Polyline') {
                            opt.mode = 'add';
                            obj = my.add(L.polyline([latlng]), opt).setAddMode();
                        }
                    }
                    my._clearCreate();
                }
            };
            if (type === 'Rectangle' && L.Browser.mobile) {
                L.DomEvent.on(my._map._container, 'touchstart', this._createKey.fn, this);
            } else {
                this._map.on(this._createKey.eventName, this._createKey.fn, this);
            }
            L.DomUtil.addClass(my._map._mapPane, 'leaflet-clickable');
            this.fire('drawstart', {mode: type});
        }
        this.options.type = type;
    },

    getFeatures: function () {
        var out = [];
        for (var i = 0, len = this.items.length; i < len; i++) {
            out.push(this.items[i]);
        }
        return out;
    },

    loadState: function (data) {
        //if (data.version !== stateVersion) return;

        var _this = this,
            featureCollection = data.featureCollection;
        L.geoJson(featureCollection, {
            onEachFeature: function (feature, layer) {
                var options = feature.properties;
                if (options.type === 'Rectangle') {
                    layer = L.rectangle(layer.getBounds());
                } else if (options.type === 'Point') {
                    options = options.options;
                    var icon = options.icon;
                    if (icon) {
                        delete options.icon;
                        if (icon.iconUrl) { options.icon = L.icon(icon); }
                    }
                    layer = L.marker(layer.getLatLng(), options);
                }
                _this.add(layer, options);
            }
        });
    },

    saveState: function () {
        var featureGroup = L.featureGroup();
        var points = [];
        for (var i = 0, len = this.items.length; i < len; i++) {
            var it = this.items[i];
            if (it.options.type === 'Point') {
                var geojson = it.toGeoJSON();
                geojson.properties = L.GmxDrawing.utils.getNotDefaults(it.options, L.GmxDrawing.utils.defaultStyles.markerStyle);
                if (!it._map) { geojson.properties.map = false; }
                var res = L.GmxDrawing.utils.getNotDefaults(it._obj.options, L.GmxDrawing.utils.defaultStyles.markerStyle.options);
                if (Object.keys(res).length) { geojson.properties.options = res; }
                res = L.GmxDrawing.utils.getNotDefaults(it._obj.options.icon.options, L.GmxDrawing.utils.defaultStyles.markerStyle.options.icon);
                if (Object.keys(res).length) {
                    if (!geojson.properties.options) { geojson.properties.options = {}; }
                    geojson.properties.options.icon = res;
                }
                points.push(geojson);
            } else {
                featureGroup.addLayer(it);
            }
        }
        var featureCollection = featureGroup.toGeoJSON();
        featureCollection.features = featureCollection.features.concat(points);
        return {
            version: stateVersion,
            featureCollection: featureCollection
        };
    },

    _addItem: function (item) {
        var addFlag = true;
        for (var i = 0, len = this.items.length; i < len; i++) {
            var it = this.items[i];
            if (it === item) {
                addFlag = false;
                break;
            }
        }
        if (addFlag) { this.items.push(item); }
        this.fire('add', {mode: item.mode, object: item});
    },

    _removeItem: function (obj, remove) {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var item = this.items[i];
            if (item === obj) {
                if (remove) {
                    this.items.splice(i, 1);
                    var ev = {type: item.options.type, mode: item.mode, object: item};
                    this.fire('remove', ev);
                    item.fire('remove', ev);
                }
                return item;
            }
        }
        return null;
    },

    clear: function () {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var item = this.items[i];
            if (item && item._map) {
                item._map.removeLayer(item);
            }
            var ev = {type: item.options.type, mode: item.mode, object: item};
            this.fire('remove', ev);
            item.fire('remove', ev);
        }
        this.items = [];
        return this;
    },

    remove: function (obj) {
        var item = this._removeItem(obj, true);
        if (item && item._map) {
            item._map.removeLayer(item);
        }
        return item;
    }
});

L.Map.addInitHook(function () {
    this.gmxDrawing = new L.GmxDrawing(this);
});


})();
