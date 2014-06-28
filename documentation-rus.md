# Документация плагина gmxDrawing

## L.Map.gmxDrawing - плагин для рисования линий, полигонов, прямоугольников и маркеров.

Плагин предоставляет интерфейс управления для рисования линий, полигонов, прямоугольников и маркеров.

### Методы

Метод|Синтаксис|Возвращаемое значение|Описание
------|------|:---------:|-----------
add|`add(<Polyline, Polygon, Rectangle> object, <options> options? )`|`<L.GmxDrawing.Feature>`| Добавить редактируемый объект.
create|`create(<string> type, <options> options? )`|| Переход в режим создания редактируемого объекта заданного типа type.
getFeatures|`getFeature()`|`<L.GmxDrawing.Feature[]> array`| Получить массив редактируемых объектов.
remove|`remove(<L.GmxDrawing.Feature>)`|`<L.GmxDrawing.Feature>`| Удалить редактируемый объект.

### Options

Опция|Тип|По умолчанию|Описание
------|------|:---------:|-----------
lineStyle | <L.Path options> | {opacity:1, weight:2} | Стиль отрисовки линий объекта.
pointStyle | <Point options> | {size:10, opacity:1, weight:2} | Стиль отрисовки вершин объекта (для `Polygon` и `Rectangle` устанавливается fill = true)

### Point options

Опция|Тип|По умолчанию|Описание
------|------|:---------:|-----------
size | <Number> | 10 | Размер отображаемых вершин (в пикселах).
shape | <`square`, `circle`> String | `square` | Тип отображения вершин (квадрат или окружность).

## Класс L.GmxDrawing.Feature

Класс `L.GmxDrawing.Feature` предоставляет интерфейс для рисования линий, полигонов, прямоугольников и маркеров.

### Creation

Factory|Описание
------|-----------
L.GmxDrawing.Feature( `<Polyline, Polygon, Rectangle> object`, <options> options? ) |Создает редактируемый объект.

### Методы
Метод|Синтаксис|Возвращаемое значение|Описание
------|------|:---------:|-----------
onAdd|`onAdd(<Map> map)`|| Добавить редактируемый объект на карту.
onRemove|`onRemove(<Map> map)`|| Удалить редактируемый объект с карты.
setAddMode|`setAddMode()`|| Установить режим добавления.
removeAddMode|`removeAddMode()`|| Отменить режим добавления.
setEditMode|`setEditMode()`|| Установить режим редактирования.
removeEditMode|`removeEditMode()`|| Отменить режим редактирования.
addLatLng|`addLatLng(<LatLng> latlng)`||Добавить вершину к редактируемогу объекту.
setLatLngs|`setLatLngs(<LatLng[][]> latlngs)`| |Установить массив координат точек объекта.
getLatLngs|`getLatLngs()`|`<LatLng[][]> latlngs`|Получить массив координат точек объекта.
setLinesStyle|`setLinesStyle(<L.Path options>)`||Установить cтиль отрисовки линий объекта.
setPointsStyle|`setPointsStyle(<Point options>)`||Установить cтиль отрисовки вершин объекта.
getType|`getType()`||Получить тип объекта.
toGeoJSON|`toGeoJSON()`||Получить GeoJSON по объекту.

### Events

| Type | Property | Description
| --- | --- | ---
| drawstart | event<Draw Event> | Переход в режим создания редактируемого обьекта.
| drawstop | event<Draw Event> | Режим создания редактируемого обьекта закончен.
| add | event<Draw Event> | Добавлен редактируемый объект.
| edit | event<Draw Event> | Изменен редактируемый объект.
| remove | event<Draw Event> | Удален редактируемый объект.
| dragstart | event<Draw Event> | Начало перемещения обьекта.
| drag | event<Draw Event> | Перемещение обьекта.
| dragend | event<Draw Event> | Окончание перемещения обьекта.

#### Draw Event

| Property | Type | Description
| --- | --- | ---
| mode | String | Текущий режим (`add` - режим добавления обьекта, `edit` - режим редактирования обьекта)
| object | L.GmxDrawing.Feature | Редактируемый объект.



