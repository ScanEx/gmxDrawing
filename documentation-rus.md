# Документация плагина gmxDrawing

gmxDrawing - плагин для рисования линий, полигонов, прямоугольников и маркеров.

### Events

#### Event

| Property | Type | Description
| --- | --- | ---
| mode | String | Текущий режим (`add` - режим добавления обьекта, `edit` - режим редактирования обьекта)
| object | L.GmxDrawing.Feature | Редактируемый объект.

L.GmxDrawing

| Type | Property | Description
| --- | --- | ---
| createstart | {mode: String} ('add', 'edit') | Начало режима создания редактируемого обьекта.
| createend | {mode: String} ('add', 'edit') | Окончание режима создания редактируемого обьекта.
| add | L.GmxDrawing.Feature | Добавлен редактируемый объект.
| removed | {mode: String, object: L.GmxDrawing.Feature} | Удален редактируемый объект.
| editstart | {mode: String, object: L.GmxDrawing.Feature} | Перед началом изменения.
| edit | {mode: String, object: L.GmxDrawing.Feature} | Изменен редактируемый объект.
| editend | {mode: String, object: L.GmxDrawing.Feature} | После окончания изменения.
| add | L.GmxDrawing.Feature | Переход в режим создания редактируемого обьекта.
| dragstart | {mode: String, object: L.GmxDrawing.Feature} | Начало перемещения обьекта.
| drag | {mode: String, object: L.GmxDrawing.Feature} | Перемещение обьекта.
| dragend | {mode: String, object: L.GmxDrawing.Feature} | Окончание перемещения обьекта.
| created | {mode: String, object: L.GmxDrawing.Feature} | Создан редактируемый объект.


