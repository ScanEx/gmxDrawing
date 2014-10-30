# Документация плагина gmxDrawing

## L.Map.gmxDrawing - плагин для рисования линий, полигонов, прямоугольников и маркеров.

Плагин предоставляет интерфейс управления для рисования линий, полигонов, прямоугольников и маркеров.

### Методы

Метод|Синтаксис|Возвращаемое значение|Описание
------|------|:---------:|-----------
add|`add(<L.Polyline, L.Polygon, L.Rectangle, L.GmxDrawing.Feature, L.MultiPolygon, L.MultiPolyline, L.Marker> object, <options> options? )`|`<L.GmxDrawing.Feature>`| Добавить редактируемый объект.
create|`create(<string> type, <options> options? )`|| Переход в режим создания редактируемого объекта заданного типа type.
getFeatures|`getFeatures()`|`<L.GmxDrawing.Feature[]> array`| Получить массив редактируемых объектов.
remove|`remove(<L.GmxDrawing.Feature>)`|`<L.GmxDrawing.Feature>`| Удалить редактируемый объект.

### Options

Опция|Тип|По умолчанию|Описание
------|------|:---------:|-----------
editable | `<Bool>` | true | Флаг разрещающий редактирование объекта(При значении `false` объект отображается не редактируемым).
lineStyle | `<L.Path options>` | `{opacity:1, weight:2}` | Стиль отрисовки линий объекта.
pointStyle | `<Point options>` | `{size:10, opacity:1, weight:2}` | Стиль отрисовки вершин объекта (для `Polygon` и `Rectangle` устанавливается fill = true)

### Point options

Опция|Тип|По умолчанию|Описание
------|------|:---------:|-----------
size | <Number> | 10 | Размер отображаемых вершин (в пикселах).
shape | <`square`, `circle`> String | `square` | Тип отображения вершин (квадрат или окружность).

### Events

| Type | Property | Description
| --- | --- | ---
| add | `event<Draw Event>` | Добавлен редактируемый объект.
| edit | `event<Draw Event>` | Изменен редактируемый объект.
| remove | `event<Draw Event>` | Удален редактируемый объект.
| addtomap | `event<Draw Event>` | Редактируемый объект добавлен на карту.
| removefrommap | `event<Draw Event>` | Редактируемый объект удален с карты.
| drawstart | `event<Draw Event>` | Переход в режим создания редактируемого объекта.
| drawstop | `event<Draw Event>` | Режим создания редактируемого объекта закончен.
| dragstart | `event<Draw Event>` | Начало перемещения объекта.
| drag | `event<Draw Event>` | Перемещение объекта.
| dragend | `event<Draw Event>` | Окончание перемещения объекта.

## Класс L.GmxDrawing.Feature

Класс `L.GmxDrawing.Feature` предоставляет интерфейс для рисования линий, полигонов, прямоугольников и маркеров.
Расширяет [L.LayerGroup](http://leafletjs.com/reference.html#layergroup).

### Creation

Factory|Описание
------|-----------
L.GmxDrawing.Feature( `<Polyline, Polygon, Rectangle> object`, <options> options? ) |Создает редактируемый объект.

### Методы
Метод|Синтаксис|Возвращаемое значение|Описание
------|------|:---------:|-----------
remove|`remove()`|`<L.GmxDrawing.Feature>`| Удалить редактируемый объект.
enableEdit|`enableEdit()`|| Разрешить редактирование объекта.
disableEdit|`disableEdit()`|| Запретить редактирование объекта.
toGeoJSON|`toGeoJSON()`||Получить GeoJSON по объекту.
setLinesStyle|`setLinesStyle(<L.Path options>)`||Установить cтиль отрисовки линий объекта.
getLinesStyle|`getLinesStyle()`|`<L.Path options>`|Получить cтиль отрисовки линий объекта.
setPointsStyle|`setPointsStyle(<Point options>)`||Установить cтиль отрисовки вершин объекта.
getPointsStyle|`getPointsStyle()`|`<L.Path options>`|Получить cтиль отрисовки вершин объекта.
getType|`getType()`||Получить тип объекта.

### Events

| Type | Property | Description
| --- | --- | ---
| add | `event<Draw Event>` | Добавлен редактируемый объект.
| edit | `event<Draw Event>` | Изменен редактируемый объект.
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



