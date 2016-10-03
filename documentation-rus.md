# Документация плагина gmxDrawing

## L.Map.gmxDrawing - плагин для рисования линий, полигонов, прямоугольников и точек.

Плагин предоставляет интерфейс управления для рисования линий, полигонов, прямоугольников и точек. Доступен через map.gmxDrawing
### Методы

Метод|Синтаксис|Возвращаемое значение|Описание
------|------|:---------:|-----------
add|`add(<L.Polyline, L.Polygon, L.Rectangle, L.GmxDrawing.Feature, L.MultiPolygon, L.MultiPolyline, L.Marker> object, <Feature options> options? )`|`<L.GmxDrawing.Feature>`| Добавить редактируемый объект.
addGeoJSON|`addGeoJSON(<L.GeoJSON, GeoJSON data> object, <Feature options> options? )`|`<L.GmxDrawing.Feature[]> array`| Добавить редактируемые объекты из `L.GeoJSON` либо из `GeoJSON data`.
create|`create(<string> type, <Feature options> options? )`|| Переход в режим создания редактируемого объекта заданного типа type.
getFeatures|`getFeatures()`|`<L.GmxDrawing.Feature[]> array`| Получить массив редактируемых объектов.
remove|`remove(<L.GmxDrawing.Feature>)`|`<L.GmxDrawing.Feature>`| Удалить редактируемый объект.
saveState|`saveState()`|`<State Options>`| Получить состояние редактируемых объектов в формате [FeatureCollection](http://geojson.org/geojson-spec.html#feature-collection-objects).
loadState|`loadState(<State Options>)`|| Добавить массив редактируемых объектов в формате [FeatureCollection](http://geojson.org/geojson-spec.html#feature-collection-objects).
extendDefaultStyles|`extendDefaultStyles(<Feature options>)`|| Изменить дефолтные настройки стилей редактируемых объектов.

### State Options

Опция|Тип|По умолчанию|Описание
------|------|:---------:|-----------
version | `<String>` | `1.0.0` | Номер версии сохраненного состояния (необходим при восстановлении объектов).
featureCollection | `<FeatureCollection>` | [] | Массив редактируемых объектов в формате [FeatureCollection](http://geojson.org/geojson-spec.html#feature-collection-objects).

### Events

| Type | Property | Description
| --- | --- | ---
| add | `event<Draw Event>` | Добавлен редактируемый объект.
| edit | `event<Draw Event>` | Изменен редактируемый объект.
| optionschange | `event<Draw Event>` | Изменены опции объекта.
| stylechange | `event<Draw Event>` | Изменен cтиль отрисовки объекта.
| remove | `event<Draw Event>` | Удален редактируемый объект.
| addtomap | `event<Draw Event>` | Редактируемый объект добавлен на карту.
| removefrommap | `event<Draw Event>` | Редактируемый объект удален с карты.
| drawstart | `event<Draw Event>` | Переход в режим создания редактируемого объекта.
| drawstop | `event<Draw Event>` | Режим создания редактируемого объекта закончен.
| dragstart | `event<Draw Event>` | Начало перемещения объекта.
| drag | `event<Draw Event>` | Перемещение объекта.
| dragend | `event<Draw Event>` | Окончание перемещения объекта.

## Класс L.GmxDrawing.Feature

Класс `L.GmxDrawing.Feature` предоставляет интерфейс для рисования линий, полигонов, прямоугольников и точек.
Расширяет [L.LayerGroup](http://leafletjs.com/reference.html#layergroup).

### Creation

Factory|Описание
------|-----------
L.GmxDrawing.Feature( `<Polyline, Polygon, Rectangle> object`, <Feature options> options? ) |Создает редактируемый объект.

### Методы
Метод|Синтаксис|Возвращаемое значение|Описание
------|------|:---------:|-----------
remove|`remove()`|`<L.GmxDrawing.Feature>`| Удалить редактируемый объект.
enableEdit|`enableEdit()`|`<L.GmxDrawing.Feature>`| Разрешить редактирование объекта.
disableEdit|`disableEdit()`|`<L.GmxDrawing.Feature>`| Запретить редактирование объекта.
toGeoJSON|`toGeoJSON()`|[Feature Object](http://geojson.org/geojson-spec.html#feature-objects)|Получить GeoJSON по объекту.
setOptions|`setOptions(<`[Feature Options](#feature-options)`>)`|`<L.GmxDrawing.Feature>`|Установить опции объекта.
getType|`getType()`|`<String>`|Получить тип объекта. Возвращаемые типы: `Rectangle`, `Polygon`, `Polyline`, `MultiPolygon`, `MultiPolyline`, `Point`
getStyle|`getStyle()`|`[Feature Options](#feature-options)`|Получить текущий стиль объекта.

### Feature Options

Опция|Тип|По умолчанию|Описание
------|------|:---------:|-----------
type|`<String>`| '' |Тип объекта. Возвращаемые типы: `Rectangle`, `Polygon`, `Polyline`, `MultiPolygon`, `MultiPolyline`, `Point`
editable | `<Bool>` | true | Флаг разрещающий редактирование объекта(При значении `false` объект отображается не редактируемым).
map | `<Bool>` | true | Флаг добавления объекта на карту(При значении `false` объект не добавляется на карту).
lineStyle | `<L.Path options>` | `{opacity:1, weight:2}` | Стиль отрисовки линий объекта. Применяется для всех объектов кроме типа `Point`.
pointStyle | `<Point options>` | `{size:10, opacity:1, weight:2}` | Стиль отрисовки вершин объекта. Применяется для всех объектов кроме типа `Point`. (для `Polygon` и `Rectangle` устанавливается fill = true)
iconUrl | `<String>` | `` | URL иконки. Все остальные опции применяются только для `Point`.
iconSize | `<Point>` | `null` | [iconSize](http://leafletjs.com/reference.html#icon) для иконки.
iconAnchor | `<Point>` | `null` | [iconAnchor](http://leafletjs.com/reference.html#icon) для иконки.
popupAnchor | `<Point>` | `null` | [popupAnchor](http://leafletjs.com/reference.html#icon) для иконки.
shadowSize | `<Point>` | `null` | [shadowSize](http://leafletjs.com/reference.html#icon) для иконки.

### Point options

Опция|Тип|По умолчанию|Описание
------|------|:---------:|-----------
size | <Number> | 10 | Размер отображаемых вершин (в пикселах).
shape | <`square`, `circle`> String | `circle` | Тип отображения вершин (квадрат или окружность).

### Events

| Type | Property | Description
| --- | --- | ---
| add | `event<Draw Event>` | Добавлен редактируемый объект.
| edit | `event<Draw Event>` | Изменен редактируемый объект.
| optionschange | `event<Draw Event>` | Изменены опции объекта.
| stylechange | `event<Draw Event>` | Изменен cтиль отрисовки объекта.
| remove | `event<Draw Event>` | Удален редактируемый объект.
| addtomap | `event<Draw Event>` | Редактируемый объект добавлен на карту.
| removefrommap | `event<Draw Event>` | Редактируемый объект удален с карты.
| drawstart | `event<Draw Event>` | Переход в режим создания редактируемого объекта.
| drawstop | `event<Draw Event>` | Режим создания редактируемого объекта закончен.
| dragstart | `event<Draw Event>` | Начало перемещения объекта.
| drag | `event<Draw Event>` | Перемещение объекта.
| dragend | `event<Draw Event>` | Окончание перемещения объекта.

#### Draw Event

| Property | Type | Description
| --- | --- | ---
| type | `<String>` | Тип события
| object | `<L.GmxDrawing.Feature>` | Редактируемый объект.
| mode | `<String>` | Текущий режим (`add` - режим добавления обьекта, `edit` - режим редактирования обьекта, `` - режим не установлен)
