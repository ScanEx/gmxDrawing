var _touchEventNames = { touchstart: 'touchstart', touchmove: 'touchmove', touchend: 'touchend' };
if (L.Browser.msPointer) _touchEventNames = { touchstart: 'MSPointerDown', touchmove: 'MSPointerMove', touchend: 'MSPointerUp' };
else if (L.Browser.pointer) _touchEventNames = { touchstart: 'pointerdown', touchmove: 'pointermove', touchend: 'pointerup' };

L.GmxDrawing = L.Class.extend({
    options: {
        type: ''
    },
    includes: L.Mixin.Events,

    initialize: function (map) {
        this._map = map;
        this.items = [];
        this.current = null;
    },
    add: function (obj, options) {
        if (!options) options = {};

        var opt = this.options,
            item = null;
        if (obj instanceof L.Rectangle)     options.type = 'Rectangle';
        else if (obj instanceof L.Polygon)  options.type = 'Polygon';
        else if (obj instanceof L.Polyline) options.type = 'Polyline';

        item = new L.GmxDrawing.Feature(this, obj, options);
        if (item) {
            this.items.push(item);
            this.fire('add', {mode: item.mode, object: item});
        }
        return item;
    },

    _clearCreate: function (object) {
        if (this._createKey) {
            this._map.off(this._createKey.eventName, this._createKey.fn, this);
            //this.fire('createend', {type: this._createKey.type, object: object});
        }
        this._createKey = null;
    },

    create: function (type, drawOptions) {
//console.log('create');
        this._clearCreate(null);
        if (type) {
            if (type === 'Rectangle') this._map.dragging.disable();
            if (!drawOptions) drawOptions = {};
            var my = this;
            this._createKey = {
                type: type,
                drawOptions: drawOptions,
                eventName: type === 'Rectangle' ? 'mousedown' : 'click',
                fn: function (ev) {
                    var obj = null;
//console.log('create_1_ ', ev, type, obj);
                    if (type === 'Point') {
                        obj = L.marker(ev.latlng, {draggable: true})
                            .addTo(this._map)
                            .on('click', L.DomEvent.stopPropagation)
                            .on('dblclick', function() {
                                this._map.removeLayer(this);
                                this.options.type = type;
                                my._removeItem(this, true);
                            });
                        my.items.push(obj);
                        my.fire('drawstop', {mode: type, object: obj});
                    } else if (type === 'Rectangle') {
                        obj = my.add(
                            L.rectangle(L.latLngBounds(L.latLng(ev.latlng.lat + 0.01, ev.latlng.lng - 0.01), ev.latlng))
                        , {mode: 'edit', drawOptions: drawOptions} );
                        obj._pointDown(ev);
                        obj._drawstop = true;
                        
                    } else if (type === 'Polygon') {
//console.log('create_2_ ', ev, type, obj);
                        obj = my.add(L.polygon([ev.latlng]), {mode: 'add', drawOptions: drawOptions}).setAddMode();
//console.log('create_3_ ', ev, type, obj);
                    } else if (type === 'Polyline') {
                        obj = my.add(L.polyline([ev.latlng]), {mode: 'add', drawOptions: drawOptions}).setAddMode();
                    }
//console.log('create__ ', ev, type, obj);
                    my._clearCreate(obj);
                    //if (object) this.fire('added', {mode: mode, object: object});
                }
            }
            this._map.on(this._createKey.eventName, this._createKey.fn, this);
            this.fire('drawstart', {mode: type});
        }
        this.options.type = type;
    },

    getFeatures: function () {
        return this.items;
    },

    _removeItem: function (obj, remove) {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var item = this.items[i];
            if (item === obj) {
                if (remove) {
                    this.items.splice(i, 1);
                    var ev = {type: item.options.type, object: item};
                    this.fire('remove', ev);
                    item.fire('remove', ev);
                }
                return item;
            }
        }
        return null;
    },

    remove: function (obj) {
        var item = this._removeItem(obj);
        if (item) {
            item.remove(obj);
        }
        return item;
    } 
});

L.Map.addInitHook(function () {
    this.gmxDrawing = new L.GmxDrawing(this);
});

L.GmxDrawing.Feature = L.Handler.extend({
    options: {
        mode: '' // add, edit
    },
    includes: L.Mixin.Events,

    initialize: function (parent, obj, options) {
//console.log('initialize');
        if (!options) options = {};
        L.setOptions(this, options);

        this._parent = parent;
        this._map = parent._map;

        var latlngs = obj._latlngs,
            mode = options.mode || (latlngs.length ? 'edit' : 'add'),
            linesStyle = {opacity:1, weight:2};
        if (this.options.type === 'Polygon' || this.options.type === 'Rectangle') {
            //linesStyle.clickable = false;
            linesStyle.fill = true;//, linesStyle.fillColor;
        }
        for (var key in options.lines) linesStyle[key] = options.lines[key];
        this._group = new L.LayerGroup();
        this.lines = new L.Polyline(latlngs, linesStyle);
        this._group.addLayer(this.lines);
        this.fill = new L.GmxDrawing._Fill(latlngs);
        this._group.addLayer(this.fill);
        if (this.options.type !== 'Polyline' && mode === 'edit') {
            this.lines.addLatLng(latlngs[0]);
            this.fill.addLatLng(latlngs[0]);
        }
        
        this.points = new L.GmxDrawing.PointMarkers(latlngs, options.points || {});
        this.points._parent = this;
        this._group.addLayer(this.points);

        this._map.addLayer(this._group);
        if (mode === 'edit') {
            this._createHandlers(false);
            this._editHandlers(true);
            this.mode = 'edit';
        }
		this.points._path.setAttribute('fill-rule', 'inherit');
//console.log('initialize', this);
    },

    remove: function () {
        this._pointUp();
        this.removeEditMode();
        this._map.removeLayer(this._group);
        this._parent._removeItem(this, true);
    },

    setLinesStyle: function (options) {
        this.lines.setStyle(options);
        this.lines.redraw();
    },

    setPointsStyle: function (options) {
        this.points.setStyle(options);
        this.points.redraw();
    },

    _setPoint: function (latlng, nm, type) {
        var points = this.points._latlngs;
//console.log('_setPoint', points, latlng, nm, type);
        if (this.options.type === 'Rectangle') {
            if (type === 'edge') {
                nm--;
                if (nm === 0) points[0].lng = points[1].lng = latlng.lng;
                else if (nm === 1) points[1].lat = points[2].lat = latlng.lat;
                else if (nm === 2) points[2].lng = points[3].lng = latlng.lng;
                else if (nm === 3) points[0].lat = points[3].lat = latlng.lat;
            } else {
                points[nm] = latlng;
                if (nm === 0) points[3].lat = latlng.lat, points[1].lng = latlng.lng;
                else if (nm === 1) points[2].lat = latlng.lat, points[0].lng = latlng.lng;
                else if (nm === 2) points[1].lat = latlng.lat, points[3].lng = latlng.lng;
                else if (nm === 3) points[0].lat = latlng.lat, points[2].lng = latlng.lng;
            }
        } else {
            points[nm] = latlng;
        }
        this.setLatLngs(points);
    },

    getGeoJSON: function () {
        var type = this.options.type === 'Rectangle' ? 'Polygon' : this.options.type,
            coords = this.points._latlngs;
        if (type === 'Polygon') {
            var last = coords.length - 1;
            if (coords[0].lat !== last.lat || coords[0].lng !== last.lng) {
                var arr = [];
                coords.forEach(function (item) { arr.push(item); });
                arr.push(coords[0]);
                coords = arr;
            }
        }
        return L.GeoJSON.getFeature(this, {
            type: type,
            coordinates: L.GeoJSON.latLngsToCoords(coords)
        });
        
    },

    getType: function () {
        return this.options.type;
    },

    getLatLngs: function () {
        return this.points._latlngs;
    },

    setLatLngs: function (points) {
//console.log('setLatLngs', points);
        this.fill.setLatLngs(points);
        this.lines.setLatLngs(points);
        if (this.options.type !== 'Polyline' && this.mode === 'edit' && points.length > 2) {
            this.lines.addLatLng(points[0]);
            this.fill.addLatLng(points[0]);
        }
        this.points.setLatLngs(points);
        this._fireEvent('edit');
    },

    addLatLng: function (point) {
//console.log('addLatLng', point, this.points);
        this._setPoint(point, this.points._latlngs.length, 'node');
    },

    // edit mode
    _pointDown: function (ev) {
//console.log('_pointDown', this.down, ev);
        if (ev.originalEvent && ev.originalEvent.ctrlKey) {
            this._onDragStart(ev);
            return;
        }

        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map),
            num = downAttr.num,
            type = downAttr.type,
            points = this.points._latlngs,
            latlng = ev.latlng;

        if (type === 'edge' && this.options.type !== 'Rectangle') {
            points.splice(num, 0, points[num]);
            this._setPoint(latlng, num, type);
        }
        this.down = downAttr;
        this._map
            .on('mousemove', this._pointMove, this)
            .on('mouseup', this._pointUp, this);
			
        this._enableDrag();
    },

    _pointUp: function (ev) {
//console.log('_pointUp', this.down, ev);
        this._map
            .off('mousemove', this._pointMove, this)
            .off('mouseup', this._pointUp, this);
        if (this._drawstop) {
            this._fireEvent('drawstop');
            this.skipClick = false;
        }
        this._drawstop = false;
        this.down = null;
    },
    _lastPointClickTime: 0,  // Hack for emulate dblclick on Point

    _removePoint: function (num) {
        var points = this.points._latlngs;
//console.log('_removePoint', points);
        if (points.length > num) {
            points.splice(num, 1);
            if (points.length < 2 || this.options.type === 'Rectangle') {
                this.remove();
            } else {
                this._setPoint(points[0], 0);
            }
        }
    },

    _pointMove: function (ev) {
//console.log('_pointMove', this.down, ev.latlng);
        if (this.down) {
            this._setPoint(ev.latlng, this.down.num, this.down.type);
            this.skipClick = true;
        }
    },

    _pointClick: function (ev) {
        if (ev.originalEvent.ctrlKey) return;
        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map);
        var clickTime = new Date().getTime(),
            prevClickTime = this._lastPointClickTime;
        this._lastPointClickTime = clickTime + 300;
//console.log('_pointClick 0', downAttr, L.Browser.mobile, this.skipClick);
        if (downAttr.type === 'node' && !this.skipClick) {
            var num = downAttr.num;
//console.log('_pointClick', (clickTime < prevClickTime));
            if (clickTime < prevClickTime) {  // this is dblclick on Point
                if (this.addLinePointTimer) {
                    clearTimeout(this.addLinePointTimer);
                    this.addLinePointTimer = null;
                }
                this._removePoint(num);
                this.setEditMode();
            } else if (this.options.type === 'Polyline' && downAttr.end) {
                if (!this.addLinePointTimer) {
                    var my = this,
                        latlng = downAttr.latlng;
                    this.addLinePointTimer = setTimeout(function () {
                        clearTimeout(my.addLinePointTimer);
                        my.addLinePointTimer = null;
                        my._pointUp();
                        if (num === 0) my.points._latlngs.reverse();
                        if (!L.Browser.mobile) my.points.addLatLng(latlng);
                        my.setAddMode();
                        my._fireEvent('drawstop');
                    }, 300);
                }
            }
        }
        this.skipClick = false;
    },

    _onDragEnd: function (ev) {
        this._map
            .off('mouseup', this._onDragEnd, this)
            .off('mousemove', this._onDrag, this);
        this._fireEvent('dragend');
    },

    _onDragStart: function (ev) {
        this._dragstartPoint = ev.latlng;
        this._map
            .on('mouseup', this._onDragEnd, this)
            .on('mousemove', this._onDrag, this);
        this._fireEvent('dragstart');
    },

    _onDrag: function (ev) {
//console.log('_onDrag', this.points, ev);
        var lat = this._dragstartPoint.lat - ev.latlng.lat,
            lng = this._dragstartPoint.lng - ev.latlng.lng,
            points = this.points._latlngs;
            
        points.forEach(function (item) {
            item.lat -= lat;
            item.lng -= lng;
        });
        this._dragstartPoint = ev.latlng;
        
        this.setLatLngs(points);
        this._fireEvent('drag');
    },

    _fireEvent: function (name) {
        var event = {mode: this.mode, object: this};
        this.fire(name, event);
        this._parent.fire(name, event);
    },

    _disableDrag: function (ev) {
        this._map.dragging.disable();
    },

    _enableDrag: function (ev) {
        this._map.dragging.enable();
        L.DomUtil.disableTextSelection();
        L.DomUtil.disableImageDrag();
    },

    _editHandlers: function (flag) {
        var stop = L.DomEvent.stopPropagation;
        var prevent = L.DomEvent.preventDefault;
//console.log('_editHandlers', flag, L.Browser.mobile);
		//var touchstart = null;
		if (this.touchstart) this.points._container.removeEventListener(_touchEventNames.touchstart, this.touchstart, false);
		if (this.touchstartFill) this.fill._container.removeEventListener(_touchEventNames.touchstart, this.touchstartFill, false);
		this.touchstart = null;
		this.touchstartFill = null;
        if (flag) {
			this._map
				.on('dblclick click', stop);
			this.points
				.on('dblclick click', stop, this)
				//.on('dblclick click', prevent, this)
				.on('click', this._pointClick, this);
			if (L.Browser.mobile) {
				if (this._EditOpacity) {
					this.setPointsStyle({fillOpacity: this._EditOpacity});
				}
				var my = this;
				this.touchstart = function (ev) {
					//L.DomEvent.stopPropagation(ev);
					//L.DomEvent.preventDefault(ev);
					var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map);
//console.log('_touchstart', ev, downAttr);
					if (downAttr.type === 'node') {
						my._disableDrag();
						my.down = downAttr;
						var num = downAttr.num;
						var _touchmove = function (ev) {
							downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map);
								if(ev.touches.length == 1){ // Only deal with one finger
									my._pointMove(downAttr);
							  }
						};
						var _touchend = function (ev) {
							my._map._container.removeEventListener(_touchEventNames.touchmove, _touchmove, false);
							my._map._container.removeEventListener(_touchEventNames.touchend, _touchend, false);
							my._enableDrag();
							my.skipClick = false;
//console.log('_touchend', ev);
						}

						my._map._container.addEventListener(_touchEventNames.touchmove, _touchmove, false);
						my._map._container.addEventListener(_touchEventNames.touchend, _touchend, false);
					}
					
				};
				this.points._container.addEventListener(_touchEventNames.touchstart, this.touchstart, false);
				this.touchstartFill = function (ev) {
					var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map);
					if (downAttr.type === 'edge' && my.options.type !== 'Rectangle') {
					    var points = my.points._latlngs;

//console.log('touchstartFill', downAttr, points);
						points.splice(downAttr.num, 0, points[downAttr.num]);
						my._setPoint(downAttr.latlng, downAttr.num, downAttr.type);
					}
				};
				this.fill._container.addEventListener(_touchEventNames.touchstart, this.touchstartFill, false);
			} else {
				this.points
					.on('mousemove', stop)
					.on('mousedown', this._pointDown, this);
				this.fill
					.on('dblclick click', stop, this)
					//.on('dblclick click', prevent, this)
					.on('mousedown', this._pointDown, this);
				this._fireEvent('editmode');
			}
        } else {
            this._pointUp();
			this._map
				.off('dblclick click', stop);
			this.points
				.off('dblclick click', stop, this)
				//.off('dblclick click', prevent, this)
				.off('click', this._pointClick, this);
			if (L.Browser.mobile) {
			} else {
				// this._map
					// .off('dblclick click', stop);
				this.points
					// .off('dblclick click', stop, this)
					.off('mousemove', stop)
					// .off('click', this._pointClick, this)
					.off('mousedown', this._pointDown, this);
			//this.points._container.removeEventListener(_touchstart, this._pointDown, false);
				// this.points._container
					// .off('touchstart', this._pointDown, this);
				this.fill
					.off('dblclick click', stop, this)
					//.off('dblclick click', prevent, this)
					.off('mousedown', this._pointDown, this);
			}
        }
    },

    _createHandlers: function (flag) {
        var stop = L.DomEvent.stopPropagation;
//console.log('_createHandlers', flag, L.Browser.mobile);
        if (flag) {
			if (L.Browser.mobile) {
				this._EditOpacity = this.points.options.fillOpacity;
				this.setPointsStyle({fillOpacity: 0.5});
				this.points.redraw();
				this._map
					.on('dblclick', stop)
					.on('click', this._mouseClick, this)
					.on('mousemove', this._moseMove, this);
				this.points
					.on('dblclick click', stop, this)
					.on('click', this._mouseClick, this);
			} else {
				this._map
					.on('dblclick', stop)
					.on('mousedown', this._mousedown, this)
					.on('mouseup', this._mouseup, this)
					.on('mousemove', this._moseMove, this);
            }
			this._fireEvent('addmode');
        } else {
			if (L.Browser.mobile) {
				this._map
					.off('dblclick', stop)
					.off('click', this._mouseClick, this)
					.off('mousemove', this._moseMove, this);
				this.points
					.off('dblclick click', stop, this)
					.off('click', this._mouseClick, this);
			} else {
				this._map
					.off('dblclick', stop)
					.off('mousedown', this._mousedown, this)
					.off('mouseup', this._mouseup, this)
					.off('mousemove', this._moseMove, this);
			}
        }
//console.log('_createHandlers__', flag, L.Browser.mobile);
    },

    setEditMode: function () {
        this._editHandlers(false);
        this._createHandlers(false);
        this._editHandlers(true);
        this.mode = 'edit';
		return this;
    },

    setAddMode: function () {
        this._editHandlers(false);
        this._createHandlers(false);
        this._createHandlers(true);
        this.mode = 'add';
		return this;
    },

    removeAddMode: function () {
        this._createHandlers(false);
        this.mode = '';
    },

    removeEditMode: function () {
        this._editHandlers(false);
        this.mode = '';
    },

    // add mode
    _moseMove: function (ev) {
        var points = this.points._latlngs;
//console.log('_moseMove', points);
        if (points.length === 1) this._setPoint(ev.latlng, 1);

        this._setPoint(ev.latlng, points.length - 1);
    },

    _mousedown: function (ev) {
//console.log('_mousedown', ev, this.mode, this._lastTime);
        this._lastTime = new Date().getTime() + 300;  // Hack for determinating map dragging
    },

    _mouseClick: function (ev) {
		var down = L.GmxDrawing.utils.getDownType.call(this, ev, this._map),
			points = this.points._latlngs;
//console.log('_mouseClick', down, points, ev);

		if (down.type === 'node' && down.end) {
			if (down.num === 0 || ((down.prev || L.Browser.mobile) && down.num === points.length - 1)) {
				this.setEditMode();
				if (!L.Browser.mobile) points.pop();
				if (points.length > 1) {
					this.skipClick = true;
					
					if (down.num === 0 && this.options.type === 'Polyline') {
						this.options.type = 'Polygon';
					}
					this._setPoint(points[0], 0);
					this._fireEvent('drawstop');
				} else {
					this.remove();
				}
				//this._fireEvent('created');
				return;
			}
		}

		this.addLatLng(ev.latlng);
		this._parent._clearCreate();
    },

    _mouseup: function (ev) {
//console.log('_mouseup', ev, this.mode, this._lastTime);
        if (new Date().getTime() < this._lastTime && this.mode === 'add') {
			this._mouseClick(ev);
        }
    }
});

L.GmxDrawing._Fill = L.Polyline.extend({
    options: {
        opacity: 0,
        fill: true,
        fillOpacity: 0,
        size: 10,
        weight: 1
    },

    _getPathPartStr: function (points) {
        var options = this.options,
            size = this.options.size/2;

        var arr = L.GmxDrawing.utils.getEquidistancePolygon(points, 1.5 * size);
        for (var i = 0, len = arr.length, str = '', p; i < len; i++) {
            p = arr[i];
            str += 'M' + p[0][0] + ' ' + p[0][1] +
                'L' + p[1][0] + ' ' + p[1][1] +
                'L' + p[2][0] + ' ' + p[2][1] +
                'L' + p[3][0] + ' ' + p[3][1] +
                'L' + p[0][0] + ' ' + p[0][1];
        }
        return str;
    }
    ,
    _updatePath: function () {
        if (!this._map) { return; }

        this._clipPoints();

        L.Path.prototype._updatePath.call(this);
    }
});

L.GmxDrawing.Point = L.Marker.extend({
    getLatLngs: function () {
        return [this._latlng];
    },

    getType: function () {
        return 'Point';
    },
    
    getGeoJSON: function () {
        return L.GeoJSON.getFeature(this, {
            type: 'Point',
            coordinates: L.GeoJSON.latLngsToCoords([this._latlng])
        });
        
    }
});

L.GmxDrawing.PointMarkers = L.Polygon.extend({
    options: {
        noClip: true,
		smoothFactor: 0,
        opacity: 1,
        fill: true,
        fillColor: '#ffffff',
        fillOpacity: 1,
        size: L.Browser.mobile ? 40 : 10,
        weight: 2
    },

    _getPathPartStr: function (points) {
        var round = L.Path.VML,
            size = this.options.size/2,
            weight = this.options.weight,
            skipLastPoint = this._parent.mode === 'add' && !L.Browser.mobile ? 1 : 0,
            radius = (this.options.shape === 'circle' ? true : false);

        for (var j = 0, len2 = points.length - skipLastPoint, str = '', p; j < len2; j++) {
            p = points[j];
            if (round) p._round();
            if(radius) {
                str += "M" + p.x + "," + (p.y - size) +
                       " A" + size + "," + size + ",0,1,1," +
                       (p.x - 0.1) + "," + (p.y - size) + " ";
            } else {
                var px = p.x, px1 = px - size, px2 = px + size,
                    py = p.y + weight, py1 = py - size, py2 = py + size;
                str += 'M' + px1 + ' ' + py1 + 'L' + px2 + ' ' + py1 + 'L' + px2 + ' ' + py2 + 'L' + px1 + ' ' + py2 + 'L' + px1 + ' ' + py1;
            }
        }
        return str;
    },

    _onMouseClick: function (e) {
        //if (this._map.dragging && this._map.dragging.moved()) { return; }

        this._fireMouseEvent(e);
    },

    _updatePath: function () {
        if (!this._map) { return; }

        this._clipPoints();

        L.Path.prototype._updatePath.call(this);
    }
});

L.GmxDrawing.utils = {
    getEquidistancePolygon: function(points, d) {   // get EquidistancePolygon from line
        var out = [];
        if(points.length) {
            var p = points[0];
            for (var i = 1, len = points.length; i < len; i++) {
                var p1 = points[i],
                    dx = p1.x - p.x,
                    dy = p1.y - p.y,
                    d2 = dx*dx + dy*dy;
                if(d2 > 0) {
                    var dp = d / Math.sqrt(d2),
                        x0 = p1.x + dp * dx,        y0 = p1.y + dp * dy,
                        x3 = p1.x - dx - dp * dx,   y3 = p1.y - dy - dp * dy,
                        y01 = y0 - p1.y,    x01 = p1.x - x0,
                        y30 = y3 - p.y,     x30 = p.x - x3;
                    out.push([
                        [x0 + y01, y0 + x01]
                        ,[x0 - y01, y0 - x01]
                        ,[x3 + y30, y3 + x30]
                        ,[x3 - y30, y3 - x30]
                    ]);
                }
                p = p1;
            }
        }
        return out;
    },

    getDownType: function(ev, map) {
        //console.log('getDownType', this, arguments);
        var out = {type: ''},
            points = this.points._parts[0],
            len = points.length;
        if (len === 0) return out;
		
        //var layerPoint = (L.Browser.mobile ? this.mouseEventToLayerPoint(ev.touches[0]) : ev.layerPoint),
        var layerPoint = ev.layerPoint,
			latlng = ev.latlng,
            size = (this.points.options.size || 10) / 2;
//console.log('getDownType', layerPoint, size, ev.layerPoint);

        size += (this.points.options.weight || 2);

		if (ev.touches && ev.touches.length === 1) {
			var first = ev.touches[0];
			var containerPoint = map.mouseEventToContainerPoint(first);
			layerPoint = map.containerPointToLayerPoint(containerPoint);
			latlng = map.layerPointToLatLng(layerPoint);
			//layerPoint = new L.Point(first.clientX, first.clientY);
		//var t1 = L.DomEvent.getMousePosition(ev, this.points._container);
				//pos = L.DomUtil.getPosition(this.points._container);
				//layerPoint = L.DomUtil.getPosition(this.points._container).subtract(startPoint);

			//L.DomEvent.preventDefault(e);
		
//var tt = map.latLngToLayerPoint(ev.latlng);
//var containerPoint = L.DomEvent.getMousePosition(ev, this.points._container);

//var tt = map.containerPointToLayerPoint(containerPoint);
//console.log('getDownType__', ev, points, this, containerPoint, tt, layerPoint);
		}
		
        var cursorBounds = new L.Bounds(
            L.point(layerPoint.x - size, layerPoint.y - size),
            L.point(layerPoint.x + size, layerPoint.y + size)
            ),
            prev = points[len - 1];
        out = {
            type: 'node',
            num: 0,
            latlng: latlng,
            end: true
        };
        if (cursorBounds.contains(points[0])) {
//console.log('getDownType 444 ', cursorBounds, points[0]);
			return out;
		}
        out.num = len - 1;
        out.prev = (len > 1 ? cursorBounds.contains(points[len - 2]) : false);
        if (cursorBounds.contains(prev)) {
//console.log('getDownType 33 ', cursorBounds, prev);
			return out;
		}
		
        out = {latlng: latlng};
//console.log('getDownType ___222 ', ev, {cursorBounds: cursorBounds, points: points});
        for (var i = 0; i < len; i++) {
            var point = points[i];
            if (cursorBounds.contains(point)) {
//console.log('getDownType 2222 ', cursorBounds, point, i);
				return {
            
				type: 'node', num: i, end: (i === 0 ? true : false), latlng: latlng
				};
		    }
            var dist = L.LineUtil.pointToSegmentDistance(layerPoint, prev, point);
            if (dist < size) out = {type: 'edge', num: (i === 0 ? len : i), latlng: latlng};
            prev = point;
        }
//console.log('getDownType cccccccccc ', size, out, cursorBounds, points);
        return out;
    }
};
