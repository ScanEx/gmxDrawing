!function(){var t=1e-7,e="1.0.0";L.GmxDrawing=L.Class.extend({options:{type:""},includes:L.Evented?L.Evented.prototype:L.Mixin.Events,initialize:function(t){if(this._map=t,this.items=[],this.current=null,this.contextmenu=new L.GmxDrawingContextMenu({points:[],lines:[]}),L.gmxUtil&&L.gmxUtil.prettifyDistance){var e="http://www.w3.org/2000/svg",i=document.createElementNS(e,"g");L.DomUtil.addClass(i,"gmxTooltip");var n=document.createElementNS(e,"rect");n.setAttributeNS(null,"rx",4),n.setAttributeNS(null,"ry",4),n.setAttributeNS(null,"height",16),L.DomUtil.addClass(n,"gmxTooltipBG");var o=document.createElementNS(e,"text"),s=L.DomUtil.testProp(["userSelect","WebkitUserSelect","OUserSelect","MozUserSelect","msUserSelect"]);o.style[s]="none",i.appendChild(n),i.appendChild(o),this.hideTooltip=function(){i.setAttributeNS(null,"visibility","hidden")},this.showTooltip=function(t,e){var s=t.x+11,l=t.y-14;o.setAttributeNS(null,"x",s),o.setAttributeNS(null,"y",l),o.textContent=e,"visible"!==i.getAttributeNS(null,"visibility")&&((this._map._pathRoot||this._map._renderer._container).appendChild(i),i.setAttributeNS(null,"visibility","visible"));var a=o.getComputedTextLength();n.setAttributeNS(null,"width",a+8),n.setAttributeNS(null,"x",s-4),n.setAttributeNS(null,"y",l-12)}}var l=function(t){this._drawMode=t.mode};this.on("drawstop drawstart",l)},bringToFront:function(){for(var t=0,e=this.items.length;t<e;t++){var i=this.items[t];i._map&&"bringToFront"in i&&i.bringToFront()}},addGeoJSON:function(t,e){var i=[],n=t instanceof L.GeoJSON;if(n||(t=L.geoJson(t,e)),t instanceof L.GeoJSON){var o=t.getLayers();if(o)for(var s=function(t){var n=null;if(t.setStyle&&e&&e.lineStyle){n={};for(var o in e.lineStyle)n[o]=e.lineStyle[o];t.setStyle(e.lineStyle)}var s=this.add(t,e);s._originalStyle=n,i.push(s)},l=0,a=o.length;l<a;l++){var r=o[l];"GeometryCollection"!==r.feature.geometry.type&&(r=L.layerGroup([r])),r.eachLayer(s,this)}}return i},add:function(t,e){var i=null;if(e=e||{},t){if(t instanceof L.GmxDrawing.Feature)i=t;else{var n={};if(t.feature&&t.feature.geometry){var o=t.feature.geometry.type;"Point"===o?t=new L.Marker(t._latlng):"MultiPolygon"===o&&(n.type=o)}if(e&&"editable"in e||(n.editable=!0),t.geometry?n.type=t.geometry.type:t instanceof L.Rectangle?n.type="Rectangle":t instanceof L.Polygon?n.type=n.type||"Polygon":L.MultiPolygon&&t instanceof L.MultiPolygon?n.type="MultiPolygon":t instanceof L.Polyline?n.type="Polyline":L.MultiPolyline&&t instanceof L.MultiPolyline?n.type="MultiPolyline":(t.setIcon||t instanceof L.Marker)&&(n.type="Point",n.editable=!1,t.options.draggable=!0),e=this._chkDrawOptions(n.type,e),L.extend(e,n),t.geometry){var s=e.markerStyle&&e.markerStyle.iconStyle;return"Point"===e.type&&!e.pointToLayer&&s&&(e.icon=L.icon(s),e.pointToLayer=function(t,i){return new L.Marker(i,e)}),this.addGeoJSON(t,e)}i=new L.GmxDrawing.Feature(this,t,e)}"map"in e||(e.map=!0),e.map&&!i._map&&this._map?this._map.addLayer(i):this._addItem(i),"setEditMode"in i&&i.setEditMode()}return i},_disableDrag:function(){this._map&&(this._map.dragging.disable(),L.DomUtil.disableTextSelection(),L.DomUtil.disableImageDrag(),this._map.doubleClickZoom.removeHooks())},_enableDrag:function(){this._map&&(this._map.dragging.enable(),L.DomUtil.enableTextSelection(),L.DomUtil.enableImageDrag(),this._map.doubleClickZoom.addHooks())},_clearCreate:function(){this._createKey&&this._map&&("Rectangle"===this._createKey.type&&L.Browser.mobile?L.DomEvent.off(this._map._container,"touchstart",this._createKey.fn,this):this._map.off(this._createKey.eventName,this._createKey.fn,this),this._enableDrag()),this._createKey=null},_chkDrawOptions:function(t,e){var i=L.GmxDrawing.utils.defaultStyles,n={};if(e||(e=L.extend({},i)),"Point"===t?L.extend(n,i.markerStyle.options.icon,e):(L.extend(n,e),n.lineStyle=L.extend({},i.lineStyle,e.lineStyle),n.pointStyle=L.extend({},i.pointStyle,e.pointStyle),n.holeStyle=L.extend({},i.holeStyle,e.holeStyle)),n.iconUrl){var o={iconUrl:n.iconUrl};delete n.iconUrl,n.iconAnchor&&(o.iconAnchor=n.iconAnchor,delete n.iconAnchor),n.iconSize&&(o.iconSize=n.iconSize,delete n.iconSize),n.popupAnchor&&(o.popupAnchor=n.popupAnchor,delete n.popupAnchor),n.shadowSize&&(o.shadowSize=n.shadowSize,delete n.shadowSize),n.markerStyle={iconStyle:o}}return n},create:function(e,i){if(this._clearCreate(null),e&&this._map){var n=this._map,o=this._chkDrawOptions(e,i),s=this;"Rectangle"===e&&n.dragging.disable(),this._createKey={type:e,eventName:"Rectangle"===e?L.Browser.mobile?"touchstart":"mousedown":"click",fn:function(i){s._createType="";var n,l,a={},r=i.latlng;for(l in o)l in L.GmxDrawing.utils.defaultStyles||(a[l]=o[l]);if("Point"===e){var h=o.markerStyle||{},p={draggable:!0};i&&i.originalEvent&&(p.ctrlKey=i.originalEvent.ctrlKey,p.shiftKey=i.originalEvent.shiftKey,p.altKey=i.originalEvent.altKey),h.iconStyle&&(p.icon=L.icon(h.iconStyle)),n=s.add(new L.Marker(r,p),a)}else o.pointStyle&&(a.pointStyle=o.pointStyle),o.lineStyle&&(a.lineStyle=o.lineStyle),"Rectangle"===e?(a.mode="edit",n=s.add(L.rectangle(L.latLngBounds(L.latLng(r.lat+t,r.lng-t),r)),a),L.Browser.mobile?n._startTouchMove(i,!0):n._pointDown(i),n.rings[0].ring._drawstop=!0):"Polygon"===e?(a.mode="add",n=s.add(L.polygon([r]),a),n.setAddMode()):"Polyline"===e&&(a.mode="add",n=s.add(L.polyline([r]),a).setAddMode());s._clearCreate()}},"Rectangle"===e&&L.Browser.mobile?L.DomEvent.on(n._container,"touchstart",this._createKey.fn,this):n.on(this._createKey.eventName,this._createKey.fn,this),this._createType=e,L.DomUtil.addClass(n._mapPane,"leaflet-clickable"),this.fire("drawstart",{mode:e})}this.options.type=e},extendDefaultStyles:function(t){var e=L.GmxDrawing.utils.defaultStyles;if(t=t||{},t.iconUrl){var i=e.markerStyle.options.icon;i.iconUrl=t.iconUrl,delete t.iconUrl,t.iconAnchor&&(i.iconAnchor=t.iconAnchor,delete t.iconAnchor),t.iconSize&&(i.iconSize=t.iconSize,delete t.iconSize),t.popupAnchor&&(i.popupAnchor=t.popupAnchor,delete t.popupAnchor),t.shadowSize&&(i.shadowSize=t.shadowSize,delete t.shadowSize)}return t.lineStyle&&(L.extend(e.lineStyle,t.lineStyle),delete t.lineStyle),t.pointStyle&&(L.extend(e.pointStyle,t.pointStyle),delete t.pointStyle),t.holeStyle&&(L.extend(e.holeStyle,t.holeStyle),delete t.holeStyle),L.extend(e,t),this},getFeatures:function(){for(var t=[],e=0,i=this.items.length;e<i;e++)t.push(this.items[e]);return t},loadState:function(t){var e=this,i=t.featureCollection;L.geoJson(i,{onEachFeature:function(t,i){var n=t.properties,o=n.popupOpened;if("Rectangle"===n.type)i=L.rectangle(i.getBounds());else if("Point"===n.type){n=n.options;var s=n.icon;s&&(delete n.icon,s.iconUrl&&(n.icon=L.icon(s))),i=L.marker(i.getLatLng(),n)}i.setStyle&&n&&n.lineStyle&&i.setStyle(n.lineStyle),e.add(i,n),o&&i.openPopup()}})},saveState:function(){for(var t=L.featureGroup(),i=[],n=0,o=this.items.length;n<o;n++){var s=this.items[n];if("Point"===s.options.type){var l=s.toGeoJSON();l.properties=L.GmxDrawing.utils.getNotDefaults(s.options,L.GmxDrawing.utils.defaultStyles.markerStyle),s._map?s._map.hasLayer(s.getPopup())&&(l.properties.popupOpened=!0):l.properties.map=!1;var a=L.GmxDrawing.utils.getNotDefaults(s._obj.options,L.GmxDrawing.utils.defaultStyles.markerStyle.options);Object.keys(a).length&&(l.properties.options=a),a=L.GmxDrawing.utils.getNotDefaults(s._obj.options.icon.options,L.GmxDrawing.utils.defaultStyles.markerStyle.options.icon),Object.keys(a).length&&(l.properties.options||(l.properties.options={}),l.properties.options.icon=a),i.push(l)}else t.addLayer(s)}var r=t.toGeoJSON();return r.features=r.features.concat(i),{version:e,featureCollection:r}},_addItem:function(t){for(var e=!0,i=0,n=this.items.length;i<n;i++){var o=this.items[i];if(o===t){e=!1;break}}e&&this.items.push(t),this.fire("add",{mode:t.mode,object:t})},_removeItem:function(t,e){for(var i=0,n=this.items.length;i<n;i++){var o=this.items[i];if(o===t){if(e){this.items.splice(i,1);var s={type:o.options.type,mode:o.mode,object:o};this.fire("remove",s),o.fire("remove",s)}return o}}return null},clear:function(){for(var t=0,e=this.items.length;t<e;t++){var i=this.items[t];i&&i._map&&i._map.removeLayer(i);var n={type:i.options.type,mode:i.mode,object:i};this.fire("remove",n),i.fire("remove",n)}return this.items=[],this},remove:function(t){var e=this._removeItem(t,!0);return e&&e._map&&e._map.removeLayer(e),e}}),L.Map.addInitHook(function(){this.gmxDrawing=new L.GmxDrawing(this)})}(),L.GmxDrawing.Feature=L.LayerGroup.extend({options:{smoothFactor:0,mode:""},includes:L.Evented?L.Evented.prototype:L.Mixin.Events,simplify:function(){var t,e,i,n,o;for(t=0,i=this.rings.length;t<i;t++){var s=this.rings[t],l=s.ring;for(l.setLatLngs(l.points.getPathLatLngs()),e=0,n=s.holes.length;e<n;e++)o=s.holes[e],o.setLatLngs(o.points.getPathLatLngs())}return this},bringToFront:function(){return this.invoke("bringToFront")},bringToBack:function(){return this.invoke("bringToBack")},onAdd:function(t){if(L.LayerGroup.prototype.onAdd.call(this,t),this._parent._addItem(this),"Point"===this.options.type){t.addLayer(this._obj);var e=this;setTimeout(function(){e._fireEvent("drawstop",e._obj.options)},0)}else{var i=this._map._pathRoot||this._map._renderer._container;"visible"!==i.getAttribute("pointer-events")&&i.setAttribute("pointer-events","visible")}this._fireEvent("addtomap")},onRemove:function(t){"hideTooltip"in this&&this.hideTooltip(),L.LayerGroup.prototype.onRemove.call(this,t),"Point"===this.options.type&&t.removeLayer(this._obj),this._fireEvent("removefrommap")},remove:function(t){if(t){var e,i,n,o,s;for(e=0,n=this.rings.length;e<n;e++)if(t.options.hole){for(i=0,o=this.rings[e].holes.length;i<o;i++)if(s=this.rings[e].holes[i],t===s){this.rings[e].holes.splice(i,1),s._map&&s._map.removeLayer(s);break}if(!t._map)break}else if(t===this.rings[e].ring){for(i=0,o=this.rings[e].holes.length;i<o;i++)s=this.rings[e].holes[i],s._map&&s._map.removeLayer(s);this.rings.splice(e,1),t._map&&t._map.removeLayer(t);break}}else this.rings=[];return this.rings.length<1&&(this._originalStyle&&this._obj.setStyle(this._originalStyle),this._parent.remove(this)),this},_fireEvent:function(t){if(!("removefrommap"===t&&this.rings.length>1)){var e={mode:this.mode||"",object:this};this.fire(t,e),this._parent.fire(t,e),"drawstop"===t&&this._map&&L.DomUtil.removeClass(this._map._mapPane,"leaflet-clickable")}},getStyle:function(){var t=L.extend({},this._drawOptions);return delete t.holeStyle,"Point"===t.type&&(L.extend(t,t.markerStyle.iconStyle),delete t.markerStyle),t},setOptions:function(t){return t.lineStyle&&this._setStyleOptions(t.lineStyle,"lines"),t.pointStyle&&this._setStyleOptions(t.pointStyle,"points"),"editable"in t&&(t.editable?this.enableEdit():this.disableEdit()),L.setOptions(this,t),this._fireEvent("optionschange"),this},_setStyleOptions:function(t,e){for(var i=0,n=this.rings.length;i<n;i++){var o=this.rings[i].ring[e];o.setStyle(t),o.redraw();for(var s=0,l=this.rings[i].holes.length;s<l;s++)o=this.rings[i].holes[s][e],o.setStyle(t),o.redraw()}this._fireEvent("stylechange")},_setLinesStyle:function(t){this._setStyleOptions(t,"lines")},_setPointsStyle:function(t){this._setStyleOptions(t,"points")},getOptions:function(){var t=this.options,e=L.extend({},t);e.lineStyle=t.lineStyle,e.pointStyle=t.pointStyle;var i=L.GmxDrawing.utils.getNotDefaults(e,L.GmxDrawing.utils.defaultStyles);if(Object.keys(i.lineStyle).length||delete i.lineStyle,Object.keys(i.pointStyle).length||delete i.pointStyle,this._map||(i.map=!1),"Point"===t.type){var n=L.GmxDrawing.utils.getNotDefaults(this._obj.options,L.GmxDrawing.utils.defaultStyles.markerStyle.options);Object.keys(n).length&&(i.options=n),n=L.GmxDrawing.utils.getNotDefaults(this._obj.options.icon.options,L.GmxDrawing.utils.defaultStyles.markerStyle.options.icon),Object.keys(n).length&&(i.options.icon=n)}return i},_latLngsToCoords:function(t,e){var i=L.GeoJSON.latLngsToCoords(L.GmxDrawing.utils.isOldVersion?t:t[0]);if(e){var n=i[i.length-1];n[0]===i[0][0]&&n[1]===i[0][1]||i.push(i[0])}return i},_latlngsAddShift:function(t,e){for(var i=[],n=0,o=t.length;n<o;n++)i.push(L.GmxDrawing.utils.getShiftLatlng(t[n],this._map,e));return i},getPixelOffset:function(){var t=this.shiftPixel;if(!t&&this._map){var e=256/L.gmxUtil.tileSizes[this._map._zoom];t=this.shiftPixel=new L.Point(Math.floor(e*this._dx),(-Math.floor(e*this._dy)))}return t||new L.Point(0,0)},setOffsetToGeometry:function(t,e){var i,n,o,s,l,a,r=256/L.gmxUtil.tileSizes[this._map._zoom],h=new L.Point(r*(this._dx||t||0),-r*(this._dy||e||0));for(i=0,n=this.rings.length;i<n;i++){var p=this.rings[i];if(l=p.ring,a=l.points.getLatLngs(),l.setLatLngs(this._latlngsAddShift(a,h)),p.holes&&p.holes.length)for(o=0,s=p.holes.length;o<s;o++)l=p.holes[o].ring,a=l.points.getLatLngs(),l.setLatLngs(this._latlngsAddShift(a,h))}return this.setPositionOffset(),this},setPositionOffset:function(t,e){if(this._dx=t||0,this._dy=e||0,this._map){this.shiftPixel=null;for(var i=this.getPixelOffset(),n=0,o=this.rings.length;n<o;n++){this.rings[n].ring.setPositionOffset(i);for(var s=0,l=this.rings[n].holes.length;s<l;s++)this.rings[n].holes[s].setPositionOffset(i)}}},_getCoords:function(t){for(var e=this.options.type,i="Polygon"===e||"Rectangle"===e||"MultiPolygon"===e,n=t?null:this.shiftPixel,o=[],s=0,l=this.rings.length;s<l;s++){var a=this.rings[s],r=this._latLngsToCoords(a.ring.points.getLatLngs(),i,n);if(i&&(r=[r]),a.holes&&a.holes.length)for(var h=0,p=a.holes.length;h<p;h++)r.push(this._latLngsToCoords(a.holes[h].points.getLatLngs(),i,n));o.push(r)}return("Polyline"===e||i&&"MultiPolygon"!==e)&&(o=o[0]),o},toGeoJSON:function(){return this._toGeoJSON(!0)},_toGeoJSON:function(t){var e,i=this.options.type,n=this.getOptions();if(delete n.mode,!this.options.editable||"Point"===i){var o=this._obj;o instanceof L.GeoJSON&&(o=L.GmxDrawing.utils._getLastObject(o).getLayers()[0]);var s=o.toGeoJSON();return s.properties=n,s}return this.rings&&(e=this._getCoords(t),"Rectangle"===i?i="Polygon":"Polyline"===i?i="LineString":"MultiPolyline"===i&&(i="MultiLineString")),L.GeoJSON.getFeature({feature:{type:"Feature",properties:n}},{type:i,coordinates:e})},getType:function(){return this.options.type},hideFill:function(){this._fill._map&&this._map.removeLayer(this._fill)},showFill:function(){var t=this.toGeoJSON(),e=L.GeoJSON.geometryToLayer(t,null,null,{weight:0});return this._fill.clearLayers(),e instanceof L.LayerGroup?e.eachLayer(function(t){this._fill.addLayer(t)},this):(e.setStyle({smoothFactor:0,weight:0,fill:!0,fillColor:"#0033ff"}),this._fill.addLayer(e)),this._fill._map||(this._map.addLayer(this._fill),this._fill.bringToBack()),this},getBounds:function(){var t=new L.LatLngBounds;if("Point"===this.options.type){var e=this._obj.getLatLng();t.extend(e)}else t=this._getBounds();return t},_getBounds:function(t){var e,i=t||this,n=new L.LatLngBounds;return i instanceof L.LayerGroup?(i.eachLayer(function(t){e=this._getBounds(t),n.extend(e)},this),n):(e=i instanceof L.Marker?i.getLatLng():i.getBounds(),n.extend(e),n)},initialize:function(t,e,i){i=i||{},this.contextmenu=new L.GmxDrawingContextMenu,i.mode="",this._drawOptions=L.extend({},i);var n=i.type;"Point"===n?(delete i.pointStyle,delete i.lineStyle):(delete i.iconUrl,delete i.iconAnchor,delete i.iconSize,delete i.popupAnchor,delete i.shadowSize,delete i.markerStyle),delete i.holeStyle,L.setOptions(this,i),this._layers={},this._obj=e,this._parent=t,this._dx=0,this._dy=0,this._initialize(t,e)},enableEdit:function(){this.options.mode="edit";var t=this.options.type;if("Point"!==t){var e=L.geoJson(this.toGeoJSON()),i=e.getLayers();this.options.editable=!0,i.length&&this._initialize(this._parent,i[0])}return this},disableEdit:function(){var t=this.options.type;if("Point"!==t){this._originalStyle=this.options.lineStyle;for(var e=L.geoJson(this.toGeoJSON().geometry,this._originalStyle).getLayers()[0],i=0,n=this.rings.length;i<n;i++){var o=this.rings[i];o.ring.removeEditMode(),o.ring.options.editable=!1;for(var s=0,l=o.holes.length;s<l;s++){var a=o.holes[s];a.removeEditMode(),a.options.editable=!1}}this._obj=e,this.options.editable=!1,this._initialize(this._parent,this._obj)}return this},getArea:function(){var t=0;return L.gmxUtil.geoJSONGetArea&&(t=L.gmxUtil.geoJSONGetArea(this.toGeoJSON())),t},getLength:function(){var t=0;return L.gmxUtil.geoJSONGetLength&&(t=L.gmxUtil.geoJSONGetLength(this.toGeoJSON())),t},getSummary:function(){var t="",e=this._map?this._map.options:{},i=this.options.type;if("Polyline"===i||"MultiPolyline"===i)t=L.gmxUtil.prettifyDistance(this.getLength(),e.distanceUnit);else if("Polygon"===i||"MultiPolygon"===i||"Rectangle"===i)t=L.gmxUtil.prettifyArea(this.getArea(),e.squareUnit);else if("Point"===i){var n=this._obj.getLatLng();t=L.gmxUtil.formatCoordinates(n)}return t},_initialize:function(t,e){if(this.clearLayers(),this.rings=[],this.mode="",this._fill=L.featureGroup(),this._fill.options&&(this._fill.options.smoothFactor=0),this.options.editable){var i=[];L.GmxDrawing.utils.isOldVersion?i=e.getLayers?L.GmxDrawing.utils._getLastObject(e).getLayers():[e]:(i=e.getLayers?L.GmxDrawing.utils._getLastObject(e):[e],"MultiPolygon"===this.options.type&&(i=(e.getLayers?e.getLayers()[0]:e).getLatLngs().map(function(t){return{_latlngs:t.shift(),_holes:t}})));for(var n=0,o=i.length;n<o;n++){var s=i[n],l=[],a=new L.GmxDrawing.Ring(this,s._latlngs,{ring:!0,editable:this.options.editable});if(this.addLayer(a),s._holes)for(var r=0,h=s._holes.length;r<h;r++){var p=new L.GmxDrawing.Ring(this,s._holes[r],{hole:!0,editable:this.options.editable});this.addLayer(p),l.push(p)}this.rings.push({ring:a,holes:l})}if(L.gmxUtil&&L.gmxUtil.prettifyDistance&&!this._showTooltip){var g=L.GmxDrawing.utils.getLocale,c=this;this._showTooltip=function(t,e){var i=e.ring,n=e.originalEvent,o=n.buttons||n.button;if(i&&(i.downObject||!o)){var s=c._map?c._map.options:{},l=s.distanceUnit,a=s.squareUnit,r="";if("Area"===t){if(!L.gmxUtil.getArea)return;r=e.originalEvent.ctrlKey?g("Perimeter")+": "+L.gmxUtil.prettifyDistance(c.getLength(),l):g(t)+": "+L.gmxUtil.prettifyArea(c.getArea(),a),c._parent.showTooltip(e.layerPoint,r)}else if("Length"===t){var h=L.GmxDrawing.utils.getDownType.call(c,e,c._map,c),p=i.getLength(h),u=("edit"===h.mode||h.num>1?h.type:"")+t,d=g(u);r=(d===u?g(t):d)+": "+L.gmxUtil.prettifyDistance(p,l),c._parent.showTooltip(e.layerPoint,r)}c._fireEvent("onMouseOver")}},this.hideTooltip=function(){this._parent.hideTooltip(),this._fireEvent("onMouseOut")},this.getTitle=g}}else"Point"===this.options.type?this._setMarker(e):this.addLayer(e)},_enableDrag:function(){this._parent._enableDrag()},_disableDrag:function(){this._parent._disableDrag()},_setMarker:function(t){var e=this,i=this._parent,n=i._map,o=n?n.options:{};t.bindPopup(null,{maxWidth:1e3,closeOnClick:!(o.maxPopupCount>1)}).on("dblclick",function(){n&&n.removeLayer(this),e.remove()}).on("dragstart",function(){e._fireEvent("dragstart")}).on("drag",function(i){i.originalEvent&&i.originalEvent.ctrlKey&&t.setLatLng(L.GmxDrawing.utils.snapPoint(t.getLatLng(),t,n)),e._fireEvent("drag"),e._fireEvent("edit")}).on("dragend",function(){e._fireEvent("dragend")}).on("popupopen",function(i){var n=i.popup;n._input||(n._input=L.DomUtil.create("textarea","leaflet-gmx-popup-textarea",n._contentNode),n._input.value=e.options.title||t.options.title||"",n._contentNode.style.width="auto"),L.DomEvent.on(n._input,"keyup",function(){var i=this.value.split("\n"),o=this.cols||0;i.forEach(function(t){t.length>o&&(o=t.length)}),this.rows=i.length,o&&(this.cols=o),n.update(),e.options.title=t.options.title=this.value,this.focus()},n._input),n.update()}),n.addLayer(t),e.openPopup=t.openPopup=function(){if(t._popup&&t._map&&!t._map.hasLayer(t._popup)){t._popup.setLatLng(t._latlng);var e=t._map.gmxDrawing;e._drawMode?t._map.fire(e._createType?"click":"mouseup",{latlng:t._latlng,delta:1}):(t._popup.addTo(t._map),t._popup._isOpen=!0)}return t}},setAddMode:function(){return this.rings.length&&this.rings[0].ring.setAddMode(),this},_pointDown:function(t){this.rings.length&&this.rings[0].ring._pointDown(t)},getPopup:function(){if("Point"===this.options.type)return this._obj.getPopup()}}),L.GmxDrawing.Ring=L.LayerGroup.extend({options:{className:"leaflet-drawing-ring",maxPoints:0,smoothFactor:0,noClip:!0,opacity:1,shape:"circle",fill:!0,fillColor:"#ffffff",fillOpacity:1,size:L.Browser.mobile?40:8,weight:2},includes:L.Evented?L.Evented.prototype:L.Mixin.Events,initialize:function(t,e,i){i=i||{},this.contextmenu=new L.GmxDrawingContextMenu,i.mode="",this._activeZIndex=i.activeZIndex||7,this._notActiveZIndex=i.notActiveZIndex||6,this.options=L.extend({},this.options,t.getStyle(),i),this._layers={},this._coords=e,this._legLength=[],this._parent=t,this._initialize(t,e)},_initialize:function(t,e){this.clearLayers(),delete this.lines,delete this.fill,delete this.points,this.downObject=!1,this.mode="",this.lineType=this.options.type.indexOf("Polyline")!==-1,this.options.disableAddPoints="Rectangle"===this.options.type;var i=this.options.pointStyle,n={opacity:1,weight:2,noClip:!0,clickable:!1,className:"leaflet-drawing-lines"};if(this.lineType||(n.fill=!("fill"in this.options)||this.options.fill),this.options.lineStyle)for(var o in this.options.lineStyle)"fill"===o&&this.lineType||(n[o]=this.options.lineStyle[o]);this.options.hole&&(n=L.extend({},n,L.GmxDrawing.utils.defaultStyles.holeStyle),i=L.extend({},i,L.GmxDrawing.utils.defaultStyles.holeStyle));var s=e,l=this,a=this.options.mode||(s.length?"edit":"add");if(this.fill=new L.Polyline(s,{className:"leaflet-drawing-lines-fill",opacity:0,smoothFactor:0,noClip:!0,fill:!1,size:10,weight:10}),this.addLayer(this.fill),this.lines=new L.Polyline(s,n),this.addLayer(this.lines),!this.lineType&&"edit"===a){var r=s[0][0]||s[0];this.lines.addLatLng(r),this.fill.addLatLng(r)}this.mode=a,this.points=new L.GmxDrawing.PointMarkers(s,i),this.points._parent=this,this.addLayer(this.points),this.points.on("mouseover",function(t){this.toggleTooltip(t,!0,l.lineType?"Length":"Area"),"mouseover"===t.type&&l._recheckContextItems("points",l._map)},this).on("mouseout",this.toggleTooltip,this),this.fill.on("mouseover mousemove",function(t){this.toggleTooltip(t,!0)},this).on("mouseout",this.toggleTooltip,this),this.points.bindContextMenu&&this.points.bindContextMenu({contextmenu:!1,contextmenuInheritItems:!1,contextmenuItems:[]})},toggleTooltip:function(t,e,i){"hideTooltip"in this._parent&&(t.ring=this,e?(i=i||"Length",this._parent._showTooltip(i,t)):"add"!==this.mode&&this._parent.hideTooltip(t))},_recheckContextItems:function(t,e){var i=this;this[t].options.contextmenuItems=e.gmxDrawing.contextmenu.getItems()[t].concat(this._parent.contextmenu.getItems()[t]).concat(this.contextmenu.getItems()[t]).map(function(t){return{id:t.text,text:L.GmxDrawing.utils.getLocale(t.text),callback:t.callback||function(e){i._eventsCmd(t,e)}}})},_eventsCmd:function(t,e){var i=e.relatedTarget._parent,n=L.GmxDrawing.utils.getDownType.call(i,e,i._map,i._parent);if(n){var o=t.text;t.callback?t.callback(n):"Remove point"===o?i._removePoint(n.num):"Delete feature"===o&&i._parent.remove(i)}},getFeature:function(){return this._parent},onAdd:function(t){L.LayerGroup.prototype.onAdd.call(this,t),this.setEditMode()},onRemove:function(t){this.points&&(this._pointUp(),this.removeAddMode(),this.removeEditMode(),"hideTooltip"in this._parent&&this._parent.hideTooltip()),L.LayerGroup.prototype.onRemove.call(this,t),"Point"===this.options.type&&t.removeLayer(this._obj),this._fireEvent("removefrommap")},getLength:function(t){var e=0,i=this._getLatLngsArr(),n=i.length;if(n){var o=1,s=i[0];t&&("node"===t.type?n=t.num+1:(o=t.num,o===n?(s=i[o-1],o=0):s=i[o-1],n=o+1));for(var l=o;l<n;l++){var a=this._legLength[l]||null;null===a&&(a=L.gmxUtil.distVincenty(s.lng,s.lat,i[l].lng,i[l].lat),this._legLength[l]=a),s=i[l],e+=a}}return e},_setPoint:function(t,e,i){if(this.points){var n=this._getLatLngsArr();"Rectangle"===this.options.type?("edge"===i?(e--,0===e?n[0].lng=n[1].lng=t.lng:1===e?n[1].lat=n[2].lat=t.lat:2===e?n[2].lng=n[3].lng=t.lng:3===e&&(n[0].lat=n[3].lat=t.lat)):(n[e]=t,0===e?(n[3].lat=t.lat,n[1].lng=t.lng):1===e?(n[2].lat=t.lat,n[0].lng=t.lng):2===e?(n[1].lat=t.lat,n[3].lng=t.lng):3===e&&(n[0].lat=t.lat,n[2].lng=t.lng)),this._legLength=[]):(n[e]=t,this._legLength[e]=null,this._legLength[e+1]=null),this.setLatLngs(n)}},addLatLng:function(t,e){if(this._legLength=[],this.points){var i=this._getLatLngsArr(),n=this.options.maxPoints,o=i.length,s=i[o-2],l=!s||!s.equals(t);n&&o>=n&&(this.setEditMode(),this._fireEvent("drawstop"),o--),l&&(e&&(o-=e),this._setPoint(t,o,"node"))}else"addLatLng"in this._obj&&this._obj.addLatLng(t)},setPositionOffset:function(t){L.DomUtil.setPosition(this.points._container,t),L.DomUtil.setPosition(this.fill._container,t),L.DomUtil.setPosition(this.lines._container,t)},setLatLngs:function(t){if(this.points){var e=this.points;this.fill.setLatLngs(t),this.lines.setLatLngs(t),!this.lineType&&"edit"===this.mode&&t.length>2&&(this.lines.addLatLng(t[0]),this.fill.addLatLng(t[0])),e.setLatLngs(t)}else"setLatLngs"in this._obj&&this._obj.setLatLngs(t);this._fireEvent("edit")},_getLatLngsArr:function(){return L.GmxDrawing.utils.isOldVersion?this.points._latlngs:this.points._latlngs[0]},_pointDown:function(t){if(this._map){if((L.Browser.ie||L.gmxUtil&&L.gmxUtil.gtIE11)&&this._map.dragging._draggable._onUp(t),t.originalEvent){var e=t.originalEvent;if(e.shiftKey)return void this._onDragStart(t);if(1!==e.which&&1!==e.button)return}var i=L.GmxDrawing.utils.getDownType.call(this,t,this._map,this._parent),n=i.type,o=this.options;if(this._lastDownTime=Date.now()+100,this.down=i,"edge"===n&&"Rectangle"!==o.type){if(o.disableAddPoints)return;this._legLength=[];var s=i.num,l=this._getLatLngsArr();l.splice(s,0,l[s]),this._setPoint(t.latlng,s,n)}this.downObject=!0,this._parent._disableDrag(),this._map.on("mousemove",this._pointMove,this).on("mouseup",this._mouseupPoint,this)}},_mouseupPoint:function(t){this._fireEvent("editstop"),this._pointUp(t)},_pointMove:function(t){if(this.down&&this._lastDownTime<Date.now()){this.lineType||this._parent.showFill(),this._clearLineAddPoint(),this._moved=!0;var e=t.originalEvent.ctrlKey?L.GmxDrawing.utils.snapPoint(t.latlng,this,this._map):t.latlng;this._setPoint(e,this.down.num,this.down.type),"_showTooltip"in this._parent&&(t.ring=this,this._parent._showTooltip(this.lineType?"Length":"Area",t))}},_pointUp:function(t){if(this.downObject=!1,this._parent._enableDrag(),this.points){if(this._map){this._map.off("mousemove",this._pointMove,this).off("mouseup",this._mouseupPoint,this);var e=t&&t.originalEvent?t.originalEvent.target:null;if(e&&e._leaflet_pos&&/leaflet-marker-icon/.test(e.className)){var i=L.GmxDrawing.utils.getMarkerByPos(e._leaflet_pos,this._map.gmxDrawing.getFeatures());this._setPoint(i,this.down.num,this.down.type)}this._map._skipClick=!0}this._drawstop&&this._fireEvent("drawstop"),this._drawstop=!1,this.down=null;var n=this.options.lineStyle||{};n.fill||this.lineType||this._parent.hideFill()}},_lastPointClickTime:0,_removePoint:function(t){var e=this._getLatLngsArr();e.length>t&&(this._legLength=[],e.splice(t,1),"Rectangle"===this.options.type||e.length<2||e.length<3&&!this.lineType?this._parent.remove(this):this._setPoint(e[0],0))},_clearLineAddPoint:function(){this._lineAddPointID&&clearTimeout(this._lineAddPointID),this._lineAddPointID=null},_pointDblClick:function(t){if(this._clearLineAddPoint(),!this.options.disableAddPoints&&(!this._lastAddTime||Date.now()>this._lastAddTime)){var e=L.GmxDrawing.utils.getDownType.call(this,t,this._map,this._parent);this._removePoint(e.num)}},_pointClick:function(t){if(!t.originalEvent||!t.originalEvent.ctrlKey){var e=Date.now(),i=this._lastPointClickTime;if(this._lastPointClickTime=e+300,this._moved||e<i)return void(this._moved=!1);var n=L.GmxDrawing.utils.getDownType.call(this,t,this._map,this._parent),o=this.mode;if("node"===n.type){var s=n.num;if(n.end){if("add"===o)this._pointUp(),this.setEditMode(),this.lineType&&0===s&&(this._parent.options.type=this.options.type="Polygon",this.lineType=!1,this._removePoint(this._getLatLngsArr().length-1)),this._fireEvent("drawstop"),this._removePoint(s);else if(this.lineType){var l=this,a=function(){l._clearLineAddPoint(),0===s&&l._getLatLngsArr().reverse(),l.points.addLatLng(n.latlng),l.setAddMode(),l._fireEvent("drawstop")};this._lineAddPointID=setTimeout(a,250)}}else"add"===o&&this.addLatLng(t.latlng)}}},_onDragEnd:function(){this._map.off("mouseup",this._onDragEnd,this).off("mousemove",this._onDrag,this),this._parent._enableDrag(),this._fireEvent("dragend")},_onDragStart:function(t){this._dragstartPoint=t.latlng,this._map.on("mouseup",this._onDragEnd,this).on("mousemove",this._onDrag,this),this._parent._disableDrag(),this._fireEvent("dragstart")},_onDrag:function(t){var e=this._dragstartPoint.lat-t.latlng.lat,i=this._dragstartPoint.lng-t.latlng.lng,n=this._getLatLngsArr();n.forEach(function(t){t.lat-=e,t.lng-=i}),this._dragstartPoint=t.latlng,this._legLength=[],this.setLatLngs(n),this._fireEvent("drag")},_fireEvent:function(t){this._parent._fireEvent(t)},_startTouchMove:function(t,e){var i=L.GmxDrawing.utils.getDownType.call(this,t,this._map,this._parent);if("node"===i.type){this._parent._disableDrag(),this.down=i;var n=this,o=function(t){i=L.GmxDrawing.utils.getDownType.call(n,t,n._map,this._parent),1===t.touches.length&&n._pointMove(i)},s=function(){L.DomEvent.off(n._map._container,"touchmove",o,n).off(n._map._container,"touchend",s,n),n._parent._enableDrag(),e&&n._parent.fire("drawstop",{mode:n.options.type,object:n})};L.DomEvent.on(n._map._container,"touchmove",o,n).on(n._map._container,"touchend",s,n)}},_editHandlers:function(t){var e=L.DomEvent.stopPropagation;if(this.touchstart&&L.DomEvent.off(this.points._container,"touchstart",this.touchstart,this),this.touchstartFill&&L.DomEvent.off(this.fill._container,"touchstart",this.touchstartFill,this),this.touchstart=null,this.touchstartFill=null,t)if(this.points.on("dblclick click",e,this).on("dblclick",this._pointDblClick,this).on("click",this._pointClick,this),L.Browser.mobile){this._EditOpacity&&this._parent._setPointsStyle({fillOpacity:this._EditOpacity});var i=this;this.touchstart=function(t){i._startTouchMove(t)},L.DomEvent.on(this.points._container,"touchstart",this.touchstart,this),this.touchstartFill=function(t){var e=L.GmxDrawing.utils.getDownType.call(i,t,i._map,this._parent);if("edge"===e.type&&"Rectangle"!==i.options.type){var n=i.points._latlngs;n.splice(e.num,0,n[e.num]),i._legLength=[],i._setPoint(e.latlng,e.num,e.type)}},L.DomEvent.on(this.fill._container,"touchstart",this.touchstartFill,this)}else this.points.on("mousemove",e).on("mousedown",this._pointDown,this),this.lines.on("mousedown",this._pointDown,this),this.fill.on("dblclick click",e,this).on("mousedown",this._pointDown,this),this._fireEvent("editmode");else this._pointUp(),this.points.off("dblclick click",e,this).off("dblclick",this._pointDblClick,this).off("click",this._pointClick,this),L.Browser.mobile||(this.points.off("mousemove",e).off("mousedown",this._pointDown,this),this.lines.off("mousedown",this._pointDown,this),this.fill.off("dblclick click",e,this).off("mousedown",this._pointDown,this))},_createHandlers:function(t){if(this.points&&this._map){var e=L.DomEvent.stopPropagation;if(t)this._map.contextmenu&&this._map.contextmenu.disable(),this._parent._enableDrag(),this._map.on("dblclick",e).on("mousedown",this._mouseDown,this).on("mouseup",this._mouseUp,this).on("mousemove",this._moseMove,this),this.points.on("click",this._pointClick,this),this._fireEvent("addmode"),this.lineType||this.lines.setStyle({fill:!0});else{this._map&&(this._map.off("dblclick",e).off("mouseup",this._mouseUp,this).off("mousemove",this._moseMove,this),this.points.off("click",this._pointClick,this));var i=this.options.lineStyle||{};this.lineType||i.fill||this.lines.setStyle({fill:!1})}}},setEditMode:function(){return this.options.editable&&(this._editHandlers(!1),this._createHandlers(!1),this._editHandlers(!0),this.mode="edit"),this},setAddMode:function(){
return this.options.editable&&(this._editHandlers(!1),this._createHandlers(!1),this._createHandlers(!0),this.mode="add"),this},removeAddMode:function(){this._createHandlers(!1),this.mode=""},removeEditMode:function(){this._editHandlers(!1),this.mode=""},_moseMove:function(t){if(this.points){var e=this._getLatLngsArr(),i=t.latlng;t.originalEvent.ctrlKey&&(i=L.GmxDrawing.utils.snapPoint(i,this,this._map)),1===e.length&&this._setPoint(i,1),this._setPoint(i,e.length-1),this.toggleTooltip(t,!0,this.lineType?"Length":"Area")}},_mouseDown:function(){this._lastMouseDownTime=Date.now()+200},_mouseUp:function(t){var e=Date.now();if(t.delta||e<this._lastMouseDownTime){this._lastAddTime=e+1e3;var i=this._getLatLngsArr();if(t.originalEvent&&3===t.originalEvent.which&&this.points&&i&&i.length)this.setEditMode(),this._removePoint(i.length-1),this._pointUp(),this._fireEvent("drawstop"),this._map&&this._map.contextmenu&&setTimeout(this._map.contextmenu.enable.bind(this._map.contextmenu),250);else{var n=t._latlng||t.latlng;t.delta&&this.addLatLng(n,t.delta),this.addLatLng(n)}this._parent._parent._clearCreate()}}}),L.GmxDrawing.PointMarkers=L.Polygon.extend({options:{className:"leaflet-drawing-points",noClip:!0,smoothFactor:0,opacity:1,shape:"circle",fill:!0,fillColor:"#ffffff",fillOpacity:1,size:L.Browser.mobile?40:8,weight:2},_convertLatLngs:function(t){return L.Polyline.prototype._convertLatLngs.call(this,t)},getRing:function(){return this._parent},getFeature:function(){return this.getRing()._parent},getPathLatLngs:function(){for(var t,e,i=[],n=this.options.size,o="Rectangle"===this._parent.options.type,s=this._parts[0],l=0,a=s.length;l<a;l++)e=s[l],(0===l||o||Math.abs(t.x-e.x)>n||Math.abs(t.y-e.y)>n)&&(i.push(this._latlngs[l]),t=e);return i},_getPathPartStr:function(t){for(var e,i,n=L.Path.VML,o=this.options.size/2,s="Rectangle"===this._parent.options.type,l="add"!==this._parent.mode||L.Browser.mobile?0:1,a="circle"===this.options.shape,r=0,h=t.length-l,p="";r<h;r++)if(i=t[r],n&&i._round(),0===r||s||Math.abs(e.x-i.x)>this.options.size||Math.abs(e.y-i.y)>this.options.size){if(a)p+="M"+i.x+","+(i.y-o)+" A"+o+","+o+",0,1,1,"+(i.x-.1)+","+(i.y-o)+" ";else{var g=i.x,c=g-o,u=g+o,d=i.y,f=d-o,_=d+o;p+="M"+c+" "+f+"L"+u+" "+f+"L"+u+" "+_+"L"+c+" "+_+"L"+c+" "+f}e=i}return p},_onMouseClick:function(t){this._fireMouseEvent(t)},_updatePath:function(){if(L.GmxDrawing.utils.isOldVersion){if(!this._map)return;this._clipPoints(),this.projectLatlngs();var t=this.getPathString();t!==this._pathStr&&(this._pathStr=t,"inherit"!==this._path.getAttribute("fill-rule")&&this._path.setAttribute("fill-rule","inherit"),this._path.setAttribute("d",this._pathStr||"M0 0"))}else{var e=this._parts.length?this._getPathPartStr(this._parts[0]):"";this._renderer._setPath(this,e)}}}),function(){function t(t){this.options=t||{points:[],lines:[]}}t.prototype={insertItem:function(t,e,i){var n=i||"points";return void 0===e&&(e=this.options[n].length),this.options[n].splice(e,0,t),this},removeItem:function(t,e){for(var i=e||"points",n=0,o=this.options[i].length;n<o;n++)if(this.options[i][n].callback===t.callback){this.options[i].splice(n,1);break}return this},removeAllItems:function(t){return t?"lines"===t?this.options.lines=[]:this.options.points=[]:this.options={points:[],lines:[]},this},getItems:function(){return this.options}},L.GmxDrawingContextMenu=t}(),L.GmxDrawing.utils={snaping:10,isOldVersion:"0.7"===L.version.substr(0,3),defaultStyles:{mode:"",map:!0,editable:!0,holeStyle:{opacity:.5,color:"#003311"},lineStyle:{opacity:1,weight:2,clickable:!1,className:"leaflet-drawing-lines",color:"#0033ff",dashArray:null,lineCap:null,lineJoin:null,fill:!1,fillColor:null,fillOpacity:.2,smoothFactor:0,noClip:!0,stroke:!0},pointStyle:{className:"leaflet-drawing-points",smoothFactor:0,noClip:!0,opacity:1,shape:"circle",fill:!0,fillColor:"#ffffff",fillOpacity:1,size:L.Browser.mobile?40:8,weight:2,clickable:!0,color:"#0033ff",dashArray:null,lineCap:null,lineJoin:null,stroke:!0},markerStyle:{mode:"",editable:!1,title:"Text example",options:{alt:"",clickable:!0,draggable:!1,keyboard:!0,opacity:1,zIndexOffset:0,riseOffset:250,riseOnHover:!1,icon:{className:"",iconUrl:"",iconAnchor:[12,41],iconSize:[25,41],popupAnchor:[1,-34],shadowSize:[41,41]}}}},snapPoint:function(t,e,i){var n=t;if(L.GeometryUtil){var o=i.gmxDrawing.getFeatures().filter(function(t){return t!==e._parent&&t._obj!==e}).map(function(t){return"Point"===t.options.type?t._obj:t}),s=Number(i.options.snaping||L.GmxDrawing.utils.snaping),l=L.GeometryUtil.closestLayerSnap(i,o,t,s,!0);l&&(n=l.latlng)}return n},getNotDefaults:function(t,e){var i={};for(var n in t)if("icon"!==n&&"map"!==n)if("iconAnchor"===n||"iconSize"===n||"popupAnchor"===n||"shadowSize"===n){if(!e[n])continue;e[n][0]===t[n][0]&&e[n][1]===t[n][1]||(i[n]=t[n])}else"lineStyle"===n||"pointStyle"===n||"markerStyle"===n?i[n]=this.getNotDefaults(t[n],e[n]):e&&e[n]===t[n]&&"fill"!==n||(i[n]=t[n]);return i},getShiftLatlng:function(t,e,i){if(i&&e){var n=e.latLngToLayerPoint(t)._add(i);t=e.layerPointToLatLng(n)}return t},getDownType:function(t,e,i){var n=t.layerPoint,o=t.originalEvent,s=!1,l=!1,a=!1,r=t.latlng;if(o&&(s=o.ctrlKey,l=o.shiftKey,a=o.altKey),t.touches&&1===t.touches.length){var h=t.touches[0],p=e.mouseEventToContainerPoint(h);n=e.containerPointToLayerPoint(p),r=e.layerPointToLatLng(n)}var g={type:"",latlng:r,ctrlKey:s,shiftKey:l,altKey:a},c=this.points?this:t.ring||t.relatedEvent,u=c.points._originalPoints||c.points._parts[0]||[],d=u.length;if(0===d)return g;var f=(c.points.options.size||10)/2;f+=1+(c.points.options.weight||2);var _=new L.Bounds(L.point(n.x-f,n.y-f),L.point(n.x+f,n.y+f)),m=u[d-1],y=d-("add"===c.mode?2:1);g={mode:c.mode,layerPoint:t.layerPoint,ctrlKey:s,shiftKey:l,altKey:a,latlng:r};for(var v=0;v<d;v++){var S=u[v];if(i.shiftPixel&&(S=u[v].add(i.shiftPixel)),_.contains(S)){g.type="node",g.num=v,g.end=0===v||v===y;break}var w=L.LineUtil.pointToSegmentDistance(n,m,S);w<f&&(g.type="edge",g.num=0===v?d:v),m=S}return g},_getLastObject:function(t){if(t.getLayers){var e=t.getLayers().shift();return e.getLayers?this._getLastObject(e):t}return t},getMarkerByPos:function(t,e){for(var i=0,n=e.length;i<n;i++){var o=e[i],s=o._obj?o._obj:null,l=s&&s._icon?s._icon._leaflet_pos:null;if(l&&l.x===t.x&&l.y===t.y)return s._latlng}return null},getLocale:function(t){var e=L.gmxLocale?L.gmxLocale.getText(t):null;return e||t}};