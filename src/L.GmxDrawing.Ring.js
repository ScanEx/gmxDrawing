L.GmxDrawing.Ring = L.LayerGroup.extend({
    options: {
        className: 'leaflet-drawing-ring',
        //noClip: true,
        maxPoints: 0,
        smoothFactor: 0,
		noClip: true,
        opacity: 1,
        shape: 'circle',
        fill: true,
        fillColor: '#ffffff',
        fillOpacity: 1,
        size: L.Browser.mobile ? 40 : 8,
        weight: 2
    },
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,

    initialize: function (parent, coords, options) {
        options = options || {};

        this.contextmenu = new L.GmxDrawingContextMenu();
        options.mode = '';
        this._activeZIndex = options.activeZIndex || 7;
        this._notActiveZIndex = options.notActiveZIndex || 6;
        this.options = L.extend({}, this.options, parent.getStyle(), options);

        this._layers = {};
        this._coords = coords;
        this._legLength = [];
        this._parent = parent;

        this._initialize(parent, coords);
    },

    _initialize: function (parent, coords) {
        this.clearLayers();
        delete this.lines;
        delete this.fill;
        delete this.points;

        this.downObject = false;
        this.mode = '';
        this.lineType = this.options.type.indexOf('Polyline') !== -1;
		if (this.options.type === 'Rectangle') {
			this.options.disableAddPoints = true;
		}

        var pointStyle = this.options.pointStyle;
        var lineStyle = {opacity:1, weight:2, noClip: true, clickable: false, className: 'leaflet-drawing-lines'};
        if (!this.lineType) {
            lineStyle.fill = 'fill' in this.options ? this.options.fill : true;
        }
        if (this.options.lineStyle) {
            for (var key in this.options.lineStyle) {
                if (key !== 'fill' || !this.lineType) {
                    lineStyle[key] = this.options.lineStyle[key];
                }
            }
        }
        if (this.options.hole) {
            lineStyle = L.extend({}, lineStyle, L.GmxDrawing.utils.defaultStyles.holeStyle);
            pointStyle = L.extend({}, pointStyle, L.GmxDrawing.utils.defaultStyles.holeStyle);
        }

        var latlngs = coords,
            _this = this,
            mode = this.options.mode || (latlngs.length ? 'edit' : 'add');

        this.fill = new L.Polyline(latlngs, {
            className: 'leaflet-drawing-lines-fill',
            opacity: 0,
			smoothFactor: 0,
			noClip: true,
            fill: false,
            size: 10,
            weight: 10
        });
        this.addLayer(this.fill);

        this.lines = new L.Polyline(latlngs, lineStyle);
        this.addLayer(this.lines);
        if (!this.lineType && mode === 'edit') {
			var latlng = latlngs[0][0] || latlngs[0];
            this.lines.addLatLng(latlng);
            this.fill.addLatLng(latlng);
        }
        this.mode = mode;

        this.points = new L.GmxDrawing.PointMarkers(latlngs, pointStyle);
        this.points._parent = this;

        this.addLayer(this.points);

        this.points
            .on('mouseover', function (ev) {
				this.toggleTooltip(ev, true, _this.lineType ? 'Length' : 'Area');
                if (ev.type === 'mouseover') {
                    _this._recheckContextItems('points', _this._map);
                }
            }, this)
            .on('mouseout', this.toggleTooltip, this);
        this.fill
            .on('mouseover mousemove', function (ev) {
				this.toggleTooltip(ev, true);
            }, this)
            .on('mouseout', this.toggleTooltip, this);

		if (this.points.bindContextMenu) {
			this.points.bindContextMenu({
				contextmenu: false,
				contextmenuInheritItems: false,
				contextmenuItems: []
			});
		}
		if (this.fill.bindContextMenu) {
			this.fill.bindContextMenu({
				contextmenu: false,
				contextmenuInheritItems: false,
				contextmenuItems: []
			});
			this.fill.on('mouseover', function (ev) {
				if (ev.type === 'mouseover') {
					this._recheckContextItems('fill', this._map);
				}
			}, this);
		}
        this._parent.on('rotate', function (ev) {
			this.toggleTooltip(ev, true, 'angle');
		}, this);
		L.DomEvent.on(document, 'keydown keyup', this._toggleBboxClass, this);
	},

    bringToFront: function () {
		if (this.lines) { this.lines.bringToFront(); }
		if (this.fill) { this.fill.bringToFront(); }
		if (this.points) { this.points.bringToFront(); }

		return this;
    },

    bringToBack: function () {
		if (this.lines) { this.lines.bringToBack(); }
		if (this.fill) { this.fill.bringToBack(); }
		if (this.points) { this.points.bringToBack(); }

		return this;
    },

    _toggleBboxClass: function (ev) {
		if (this.bbox) {
			var flagRotate = this._needRotate;
			if (!ev.altKey) { flagRotate = !flagRotate; }
			if (ev.type === 'keyup' && !ev.altKey) { flagRotate = !this._needRotate; }
			L.DomUtil[flagRotate ? 'removeClass' : 'addClass'](this.bbox._path, 'Rotate');
		}
	},

    toggleTooltip: function (ev, flag, type) {
		if ('hideTooltip' in this._parent) {
			ev.ring = this;
			if (flag) {
				type = type || 'Length';
				this._parent._showTooltip(type, ev);
			} else if (this.mode !== 'add') {
				this._parent.hideTooltip(ev);
			}
		}
	},

    _recheckContextItems: function (type, map) {
        var _this = this;
		this[type].options.contextmenuItems = (map.gmxDrawing.contextmenu.getItems()[type] || [])
			.concat(this._parent.contextmenu.getItems()[type] || [])
			.concat(this.contextmenu.getItems()[type] || [])
			.map(function(obj) {
				var ph = {
					id: obj.text,
					text: L.GmxDrawing.utils.getLocale(obj.text),
					icon: obj.icon,
					retinaIcon: obj.retinaIcon,
					iconCls: obj.iconCls,
					retinaIconCls: obj.retinaIconCls,
					callback: function (ev) {
						_this._eventsCmd(obj, ev);
					},
					context: obj.context || _this,
					disabled: 'disabled' in obj ? obj.disabled : false,
					separator: obj.separator,
					hideOnSelect: 'hideOnSelect' in obj ? obj.hideOnSelect : true
				};
				return ph;
			});
		return this[type].options.contextmenuItems;
    },

    _eventsCmd: function (obj, ev) {
		var ring = ev.relatedTarget && ev.relatedTarget._parent || this;
		var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map, this._parent);
		if (downAttr) {
			var type = obj.text;
			if (obj.callback) {
				obj.callback(downAttr);
			} else if (type === 'Remove point') {
				ring._removePoint(downAttr.num);
			} else if (type === 'Save' || type === 'Move' || type === 'Rotate' || type === 'Rotate around Point') {
                this._toggleRotate(type, downAttr);
			} else if (type === 'Cancel' && this._editHistory.length) {
				if (this._editHistory.length) {
					this.setLatLngs(this._editHistory[0]);
					this._editHistory = [];
				}
                this._toggleRotate('Save', downAttr);
			}
        }
    },

    getFeature: function () {
		return this._parent;
    },

    onAdd: function (map) {
        L.LayerGroup.prototype.onAdd.call(this, map);
        this.setEditMode();
		if (this.points.bindContextMenu) {
			var contextmenuItems = this._recheckContextItems('points', map);
			this.points.bindContextMenu({
				contextmenu: true,
				contextmenuInheritItems: false,
				contextmenuItems: contextmenuItems
			});
		}

    },

    onRemove: function (map) {
        if (this.points) {
            this._pointUp();
            this.removeAddMode();
            this.removeEditMode();

            if ('hideTooltip' in this._parent) { this._parent.hideTooltip(); }
        }
        L.LayerGroup.prototype.onRemove.call(this, map);
        if (this.options.type === 'Point') {
            map.removeLayer(this._obj);
        }
        this._fireEvent('removefrommap');
    },

    getAngleLength: function (downAttr) {
        if (L.GeometryUtil && downAttr && downAttr.num) {
            var num = downAttr.num,
				latlngs = this.points._latlngs[0],
                prev = latlngs[num - 1],
                curr = latlngs[num] || downAttr.latlng,
				_parts = this.points._parts[0],
				angle = L.GeometryUtil.computeAngle(_parts[num - 1], _parts[num] || downAttr.layerPoint);
			angle += 90;
			angle %= 360;
			angle += angle < 0 ? 360 : 0;
			return {
				length: L.gmxUtil.distVincenty(prev.lng, prev.lat, curr.lng, curr.lat),
				angle: L.gmxUtil.formatDegrees(angle, 0)
			};
		}
        return null;
    },

    getLength: function (downAttr) {
        var length = 0,
            latlngs = this._getLatLngsArr(),
            len = latlngs.length;

        if (len) {
            var beg = 1,
                prev = latlngs[0];
            if (downAttr) {
                if (downAttr.type === 'node') {
                    len = downAttr.num + 1;
                } else {
                    beg = downAttr.num;
                    if (beg === len) {
                        prev = latlngs[beg - 1];
                        beg = 0;
                    } else {
                        prev = latlngs[beg - 1];
                    }
                    len = beg + 1;
                }
            }
            for (var i = beg; i < len; i++) {
                var leg = this._legLength[i] || null;
                if (leg === null) {
                    leg = L.gmxUtil.distVincenty(prev.lng, prev.lat, latlngs[i].lng, latlngs[i].lat);
                    this._legLength[i] = leg;
                }
                prev = latlngs[i];
                length += leg;
            }
        }
        return length;
    },

    _setPoint: function (latlng, nm, type) {
        if (!this.points) { return; }
        var latlngs = this._getLatLngsArr();
        if (this.options.type === 'Rectangle') {
			if (type === 'edge') {
                nm--;
                if (nm === 0) { latlngs[0].lng = latlngs[1].lng = latlng.lng; }
                else if (nm === 1) { latlngs[1].lat = latlngs[2].lat = latlng.lat; }
                else if (nm === 2) { latlngs[2].lng = latlngs[3].lng = latlng.lng; }
                else if (nm === 3) { latlngs[0].lat = latlngs[3].lat = latlng.lat; }
            } else {
                latlngs[nm] = latlng;
                if (nm === 0) { latlngs[3].lat = latlng.lat; latlngs[1].lng = latlng.lng; }
                else if (nm === 1) { latlngs[2].lat = latlng.lat; latlngs[0].lng = latlng.lng; }
                else if (nm === 2) { latlngs[1].lat = latlng.lat; latlngs[3].lng = latlng.lng; }
                else if (nm === 3) { latlngs[0].lat = latlng.lat; latlngs[2].lng = latlng.lng; }
            }
            this._legLength = [];
        } else {
            latlngs[nm] = latlng;
            this._legLength[nm] = null;
            this._legLength[nm + 1] = null;
        }
        this.setLatLngs(latlngs);
    },

    addLatLng: function (point, delta) {
        this._legLength = [];
        if (this.points) {
            var points = this._getLatLngsArr(),
                maxPoints = this.options.maxPoints,
                len = points.length,
                lastPoint = points[len - 2],
				flag = !lastPoint || !lastPoint.equals(point);

            if (maxPoints && len >= maxPoints) {
				this.setEditMode();
				this._fireEvent('drawstop', {latlng: point});
				len--;
			}
            if (flag) {
                if (delta) { len -= delta; }    // reset existing point
                this._setPoint(point, len, 'node');
            }
			this._parent.lastAddLatLng = point;
        } else if ('addLatLng' in this._obj) {
            this._obj.addLatLng(point);
        }
    },

    setPositionOffset: function (p) {
        L.DomUtil.setPosition(this.points._container, p);
        L.DomUtil.setPosition(this.fill._container, p);
        L.DomUtil.setPosition(this.lines._container, p);
    },

    setLatLngs: function (latlngs) {	// TODO: latlngs не учитывает дырки полигонов
		if (this.points) {
            var points = this.points;
            this.fill.setLatLngs(latlngs);
            this.lines.setLatLngs(latlngs);
            if (!this.lineType && this.mode === 'edit' && latlngs.length > 2) {
                this.lines.addLatLng(latlngs[0]);
                this.fill.addLatLng(latlngs[0]);
            }
            if (this.bbox) {
				this.bbox.setBounds(this.lines._bounds);
            }

            points.setLatLngs(latlngs);
        } else if ('setLatLngs' in this._obj) {
            this._obj.setLatLngs(latlngs);
        }
        this._fireEvent('edit');
    },

    _getLatLngsArr: function () {
		return L.GmxDrawing.utils.isOldVersion ? this.points._latlngs : this.points._latlngs[0];
    },

    // edit mode
    _pointDown: function (ev) {
        if (!this._map) {
            return;
        }
        if (L.Browser.ie || (L.gmxUtil && L.gmxUtil.gtIE11)) {
            this._map.dragging._draggable._onUp(ev); // error in IE
        }
        if (ev.originalEvent) {
            var originalEvent = ev.originalEvent;
            if (originalEvent.altKey) {	// altKey, shiftKey
                this._onDragStart(ev);
                return;
            } else if (originalEvent.which !== 1 && originalEvent.button !== 1) {
                return;
            }
        }
        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map, this._parent),
            type = downAttr.type,
            opt = this.options;

        this._lastDownTime = Date.now() + 100;
        this.down = downAttr;
        if (type === 'edge' && opt.type !== 'Rectangle') {
            if (opt.disableAddPoints) { return; }
            this._legLength = [];
            var num = downAttr.num,
                points = this._getLatLngsArr();
            points.splice(num, 0, points[num]);
            this._setPoint(ev.latlng, num, type);
        }
        this.downObject = true;
        this._parent._disableDrag();
        this._map
            .on('mousemove', this._pointMove, this)
            .on('mouseup', this._mouseupPoint, this);
    },

    _mouseupPoint: function (ev) {
		this._pointUp(ev);
        if (this.__mouseupPointTimer) { cancelIdleCallback(this.__mouseupPointTimer); }
		this.__mouseupPointTimer = requestIdleCallback(function() {
			this._fireEvent('editstop', ev);
		}.bind(this), {timeout: 250});
    },

    _pointMove: function (ev) {
        if (this.down && this._lastDownTime < Date.now()) {
            if (!this.lineType) {
                this._parent.showFill();
            }
            this._clearLineAddPoint();
            this._moved = true;

			var latlng = ev.originalEvent.ctrlKey ? L.GmxDrawing.utils.snapPoint(ev.latlng, this, this._map) : ev.latlng;
            this._setPoint(latlng, this.down.num, this.down.type);
			if ('_showTooltip' in this._parent) {
				ev.ring = this;
				this._parent._showTooltip(this.lineType ? 'Length' : 'Area', ev);
			}
        }
    },

    _pointUp: function (ev) {
        this.downObject = false;
        this._parent._enableDrag();
        if (!this.points) { return; }
        if (this._map) {
            this._map
                .off('mousemove', this._pointMove, this)
                .off('mouseup', this._mouseupPoint, this);

            var target = ev && ev.originalEvent ? ev.originalEvent.target : null;
            if (target && target._leaflet_pos && /leaflet-marker-icon/.test(target.className)) {
                var latlng = L.GmxDrawing.utils.getMarkerByPos(target._leaflet_pos, this._map.gmxDrawing.getFeatures());
                this._setPoint(latlng, this.down.num, this.down.type);
            }
            this._map._skipClick = true;    // for EventsManager
        }
        if (this._drawstop) {
            this._fireEvent('drawstop', ev);
        }
        this._drawstop = false;
        this.down = null;
        var lineStyle = this.options.lineStyle || {};
        if (!lineStyle.fill && !this.lineType) {
            this._parent.hideFill();
        }
    },
    _lastPointClickTime: 0,  // Hack for emulate dblclick on Point

    _removePoint: function (num) {
        var points = this._getLatLngsArr();
        if (points.length > num) {
            this._legLength = [];
            points.splice(num, 1);
            if (this.options.type === 'Rectangle'
                || points.length < 2
                || (points.length < 3 && !this.lineType)
                ) {
                this._parent.remove(this);
            } else {
                this._setPoint(points[0], 0);
            }
        }
	},

    _clearLineAddPoint: function () {
        if (this._lineAddPointID) { clearTimeout(this._lineAddPointID); }
        this._lineAddPointID = null;
    },

    _pointDblClick: function (ev) {
        this._clearLineAddPoint();
        if (!this.options.disableAddPoints && (!this._lastAddTime || Date.now() > this._lastAddTime)) {
            var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map, this._parent);
            this._removePoint(downAttr.num);
        }
    },

    _pointClick: function (ev) {
        if (ev.originalEvent && ev.originalEvent.ctrlKey) { return; }
        var clickTime = Date.now(),
            prevClickTime = this._lastPointClickTime;

        this._lastPointClickTime = clickTime + 300;
        if (this._moved || clickTime < prevClickTime) { this._moved = false; return; }

        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map, this._parent),
            mode = this.mode;
        if (downAttr.type === 'node') {
            var num = downAttr.num;
            if (downAttr.end) {  // this is click on first or last Point
                if (mode === 'add') {
                    this._pointUp();
                    this.setEditMode();
                    if (this.lineType && num === 0) {
                        this._parent.options.type = this.options.type = 'Polygon';
                        this.lineType = false;
                        this._removePoint(this._getLatLngsArr().length - 1);
                    }
                    this._fireEvent('drawstop', downAttr);
                    this._removePoint(num);
                } else if (this.lineType) {
					this._clearLineAddPoint();
                    this._lineAddPointID = setTimeout(function () {
						if (num === 0) { this._getLatLngsArr().reverse(); }
						this.points.addLatLng(downAttr.latlng);
						this.setAddMode();
						this._fireEvent('drawstop', downAttr);
					}.bind(this), 250);
                }
            } else if (mode === 'add') { // this is add pont
                this.addLatLng(ev.latlng);
            }
        }
    },

    _editHistory: [],
    // _dragType: 'Save',
    _needRotate: false,
    _toggleRotate: function (type, downAttr) {
		this._needRotate = type === 'Rotate' || type === 'Rotate around Point';
		this._editHistory = [];

		if (this.bbox) {
			this.bbox
				.off('contextmenu', this._onContextmenu, this)
				.off('mousedown', this._onRotateStart, this);
			this.removeLayer(this.bbox);
			this.bbox = null;
		} else {
			L.DomUtil.TRANSFORM_ORIGIN = L.DomUtil.TRANSFORM_ORIGIN || L.DomUtil.testProp(
				['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin']);

			this.bbox = L.rectangle(this.lines.getBounds(), {
				color: this.lines.options.color, //||'rgb(51, 136, 255)',
				opacity: this.lines.options.opacity,
				className: 'leaflet-drawing-bbox ' + type,
				dashArray: '6, 3',
				smoothFactor: 0,
				noClip: true,
				fillOpacity: 0,
				fill: true,
				weight: 1
			});
			this.addLayer(this.bbox);
			this.bbox
				.on('contextmenu', this._onContextmenu, this)
				.on('mousedown', this._onRotateStart, this);

			if (this.bbox.bindContextMenu) {
				this.bbox.bindContextMenu({
					contextmenu: false,
					contextmenuInheritItems: false,
					contextmenuItems: []
				});
			}

            this._recheckContextItems('bbox', this._map);
			this._rotateCenterPoint = type === 'Rotate' ? this.bbox.getCenter() : downAttr.latlng;

		}
    },

    _onContextmenu: function () {
		this.bbox.options.contextmenuItems[1].disabled = this._editHistory.length < 1;
    },

    _isContextMenuEvent: function (ev) {
		var e = ev.originalEvent;
		return e.which !== 1 && e.button !== 1 && !e.touches;
    },

    _onRotateStart: function (ev) {
		if (this._isContextMenuEvent(ev)) { return; }
		this._editHistory.push(this._getLatLngsArr().map(function(it) { return it.clone(); }));
		var flagRotate = this._needRotate;
		if (ev.originalEvent.altKey) {
			flagRotate = !flagRotate;
		}
		if (this._map.contextmenu) { this._map.contextmenu.hide(); }
		if (flagRotate) {
			this._rotateStartPoint = ev.latlng;
			this._rotateCenter = this._rotateCenterPoint;

			this._map
				.on('mouseup', this._onRotateEnd, this)
				.on('mousemove', this._onRotate, this);
			this._parent._disableDrag();
			this._fireEvent('rotatestart', ev);
		} else {
			this._onDragStart(ev);
		}
    },

    _onRotateEnd: function (ev) {	// TODO: не учитывает дырки полигонов
        this._map
            .off('mouseup', this._onRotateEnd, this)
            .off('mousemove', this._onRotate, this);

		this.toggleTooltip(ev);

		if (this._center) {
			var center = this._center,
				shiftPoint = this._map.getPixelOrigin().add(center),
				cos = Math.cos(-this._angle),
				sin = Math.sin(-this._angle),
				map = this._map,
				_latlngs = this.points._parts[0].map(function (p) {
					var ps = p.subtract(center);
					return map.unproject(L.point(
						ps.x * cos + ps.y * sin,
						ps.y * cos - ps.x * sin
					).add(shiftPoint));
				});
			this.setLatLngs(_latlngs);

			this._rotateItem();
			this.bbox.setBounds(this.lines._bounds);
			// console.log('_onRotateEnd', this.mode, this.points._latlngs, _latlngs);
		}
		this._parent._enableDrag();
        this._fireEvent('rotateend', ev);
    },

    _onRotate: function (ev) {
        var pos = ev.latlng,			// текущая точка
			s = this._rotateStartPoint,	// точка начала вращения
			c = this._rotateCenter;		// центр объекта

		this._rotateItem(
			Math.atan2(s.lat - c.lat, s.lng - c.lng) - Math.atan2(pos.lat - c.lat, pos.lng - c.lng),
			this._map.project(c).subtract(this._map.getPixelOrigin())
		);
		this._fireEvent('rotate', ev);
    },

    _rotateItem: function (angle, center) {
        var originStr = '',
			rotate = '';

		if (center) {
			originStr = center.x + 'px ' + center.y + 'px';
			rotate = 'rotate(' + angle + 'rad)';
		}

		this._angle = angle;
		this._center = center;

        [this.bbox, this.lines, this.fill, this.points].forEach(function(it) {
			it._path.style[L.DomUtil.TRANSFORM_ORIGIN] = originStr;
			it._path.style.transform = rotate;
		});
   },

    _onDragEnd: function () {
        this._map
            .off('mouseup', this._onDragEnd, this)
            .off('mousemove', this._onDrag, this);

		this._parent._enableDrag();
        this._fireEvent('dragend');
    },

    _onDragStart: function (ev) {
        this._dragstartPoint = ev.latlng;
        this._map
            .on('mouseup', this._onDragEnd, this)
            .on('mousemove', this._onDrag, this);
		this._parent._disableDrag();
        this._fireEvent('dragstart');
    },

    _onDrag: function (ev) {
        var lat = this._dragstartPoint.lat - ev.latlng.lat,
            lng = this._dragstartPoint.lng - ev.latlng.lng,
            points = this._getLatLngsArr();

        points.forEach(function (item) {
            item.lat -= lat;
            item.lng -= lng;
        });
        this._dragstartPoint = ev.latlng;

        this._legLength = [];
        this.setLatLngs(points);
        this._fireEvent('drag');
    },

    _fireEvent: function (name, options) {
        this._parent._fireEvent(name, options);
    },

    _startTouchMove: function (ev, drawstop) {
        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map, this._parent);
        if (downAttr.type === 'node') {
            this._parent._disableDrag();
            this.down = downAttr;
            //var num = downAttr.num;
            var my = this;
            var _touchmove = function (ev) {
                downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map, this._parent);
                    if (ev.touches.length === 1) { // Only deal with one finger
                        my._pointMove(downAttr);
                  }
            };
            var _touchend = function () {
                L.DomEvent
                    .off(my._map._container, 'touchmove', _touchmove, my)
                    .off(my._map._container, 'touchend', _touchend, my);
                my._parent._enableDrag();
                if (drawstop) {
                    my._parent.fire('drawstop', {mode: my.options.type, object: my});
                }
            };
            L.DomEvent
                .on(my._map._container, 'touchmove', _touchmove, my)
                .on(my._map._container, 'touchend', _touchend, my);
        }
    },

    _editHandlers: function (flag) {
        //if (!this.points) { return; }
        var stop = L.DomEvent.stopPropagation,
			prevent = L.DomEvent.preventDefault;
        if (this.touchstart) {
            L.DomEvent.off(this.points._container, 'touchstart', this.touchstart, this);
        }
        if (this.touchstartFill) {
            L.DomEvent.off(this.fill._container, 'touchstart', this.touchstartFill, this);
        }
        this.touchstart = null;
        this.touchstartFill = null;
        if (flag) {
            this.points
                .on('dblclick click', stop, this)
                .on('dblclick click', prevent, this)
                .on('dblclick', this._pointDblClick, this)
                .on('click', this._pointClick, this);
            if (L.Browser.mobile) {
                if (this._EditOpacity) {
                    this._parent._setPointsStyle({fillOpacity: this._EditOpacity});
                }
                var my = this;
                this.touchstart = function (ev) {
                    my._startTouchMove(ev);
                };
                L.DomEvent.on(this.points._container, 'touchstart', this.touchstart, this);
                this.touchstartFill = function (ev) {
                    var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map, this._parent);
                    if (downAttr.type === 'edge' && my.options.type !== 'Rectangle') {
                        var points = my.points._latlngs;
                        points.splice(downAttr.num, 0, points[downAttr.num]);
                        my._legLength = [];
                        my._setPoint(downAttr.latlng, downAttr.num, downAttr.type);
                    }
                };
                L.DomEvent.on(this.fill._container, 'touchstart', this.touchstartFill, this);
            } else {
                this.points
                    .on('mousemove', stop)
                    .on('mousedown', this._pointDown, this);
                this.lines
                    .on('mousedown', this._pointDown, this);
                this.fill
                    .on('dblclick click', stop, this)
                    .on('mousedown', this._pointDown, this);
                this._fireEvent('editmode');
            }
        } else {
            this._pointUp();
            this.points
                .off('dblclick click', stop, this)
                .off('dblclick click', prevent, this)
                .off('dblclick', this._pointDblClick, this)
                .off('click', this._pointClick, this);
            if (!L.Browser.mobile) {
                this.points
                    .off('mousemove', stop)
                    .off('mousedown', this._pointDown, this);
                this.lines
                    .off('mousedown', this._pointDown, this);
                this.fill
                    .off('dblclick click', stop, this)
                    .off('mousedown', this._pointDown, this);
            }
        }
    },

    _createHandlers: function (flag) {
        if (!this.points || !this._map) { return; }
        var stop = L.DomEvent.stopPropagation;
        if (flag) {
			if (this._map.contextmenu) {
				this._map.contextmenu.disable();
			}

            this._parent._enableDrag();
            this._map
                .on('dblclick', stop)
                .on('mousedown', this._mouseDown, this)
                .on('mouseup', this._mouseUp, this)
                .on('mousemove', this._moseMove, this);
            this.points
                .on('click', this._pointClick, this);
            this._fireEvent('addmode');
            if (!this.lineType) { this.lines.setStyle({fill: true}); }
        } else {
            if (this._map) {
                this._map
                    .off('dblclick', stop)
                    .off('mouseup', this._mouseUp, this)
                    .off('mousemove', this._moseMove, this);
                this.points
                    .off('click', this._pointClick, this);
            }
            var lineStyle = this.options.lineStyle || {};
            if (!this.lineType && !lineStyle.fill) {
                this.lines.setStyle({fill: false});
            }
        }
    },

    setEditMode: function () {
        if (this.options.editable) {
            this._editHandlers(false);
            this._createHandlers(false);
            this._editHandlers(true);
            this.mode = 'edit';
        }
        return this;
    },

    setAddMode: function () {
        if (this.options.editable) {
            this._editHandlers(false);
            this._createHandlers(false);
            this._createHandlers(true);
            this.mode = 'add';
        }
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
        if (this.points) {
            var points = this._getLatLngsArr(),
				latlng = ev.latlng;
            if (ev.originalEvent.ctrlKey) { latlng = L.GmxDrawing.utils.snapPoint(latlng, this, this._map); }
            if (points.length === 1) { this._setPoint(latlng, 1); }

            this._setPoint(latlng, points.length - 1);
			this.toggleTooltip(ev, true, this.lineType ? 'Length' : 'Area');
        }
    },

    _mouseDown: function () {
        this._lastMouseDownTime = Date.now() + 200;
		if (this._map && this._map.contextmenu) { this._map.contextmenu.hide(); }
		if ('hideTooltip' in this._parent) { this._parent.hideTooltip(); }
    },

    _mouseUp: function (ev) {
        var timeStamp = Date.now();
        if (ev.delta || timeStamp < this._lastMouseDownTime) {
            this._lastAddTime = timeStamp + 1000;

			var _latlngs = this._getLatLngsArr();
			if (ev.originalEvent && ev.originalEvent.which === 3
				&& this.points && _latlngs && _latlngs.length) {	// for click right button

				this.setEditMode();
				this._removePoint(_latlngs.length - 1);
				this._pointUp();
				this._fireEvent('drawstop');
				if (this._map && this._map.contextmenu) {
					requestIdleCallback(this._map.contextmenu.enable.bind(this._map.contextmenu), {timeout: 250});
				}
			} else {
				var latlng = ev._latlng || ev.latlng;
				if (ev.delta) { this.addLatLng(latlng, ev.delta); }    // for click on marker
				this.addLatLng(latlng);
			}
			this._parent._parent._clearCreate();
        }
    }
});
