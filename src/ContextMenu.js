import L from 'leaflet';

class GmxDrawingContextMenu {
	constructor(options = {points: [], lines: [], fill: []}) {
		this.options = options;
	}
	insertItem(obj, index, type) {
		var optKey = type || 'points';
		if (index === undefined) { index = this.options[optKey].length; }
		this.options[optKey].splice(index, 0, obj);
		return this;
	}
	removeItem (obj, type) {
		var optKey = type || 'points';
		for (var i = 0, len = this.options[optKey].length; i < len; i++) {
			if (this.options[optKey][i].callback === obj.callback) {
				this.options[optKey].splice(i, 1);
				break;
			}
		}
		return this;
	}
	removeAllItems(type) {
		if (!type) {
			this.options = {points: [], lines: []};
		} else if (type === 'lines') {
			this.options.lines = [];
		} else {
			this.options.points = [];
		}
		return this;
	}
	getItems() {
		return this.options;
	}
}

L.GmxDrawingContextMenu = GmxDrawingContextMenu;

export default L.GmxDrawingContextMenu;