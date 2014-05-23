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
| addmode | {mode: String} | Переход в режим создания редактируемого обьекта.
| editmode | L.GmxDrawing.Feature | Начало режима изменения редактируемого обьекта.
| createstart | {mode: String} | Режим создания редактируемого обьекта закончен.
| createend | {mode: String} | Режим создания редактируемого обьекта закончен.
| edit | {mode: String, object: L.GmxDrawing.Feature} | Изменен редактируемый объект.
| dragstart | {mode: String, object: L.GmxDrawing.Feature} | Начало перемещения обьекта.
| drag | {mode: String, object: L.GmxDrawing.Feature} | Перемещение обьекта.
| dragend | {mode: String, object: L.GmxDrawing.Feature} | Окончание перемещения обьекта.
| add | L.GmxDrawing.Feature | Добавлен редактируемый объект.
| addend | {mode: String} ('add', 'edit') | Окончание режима создания редактируемого обьекта.
| removed | {mode: String, object: L.GmxDrawing.Feature} | Удален редактируемый объект.
| editstart | {mode: String, object: L.GmxDrawing.Feature} | Перед началом изменения.
| editend | {mode: String, object: L.GmxDrawing.Feature} | После окончания изменения.
| editmode | L.GmxDrawing.Feature | Переход в режим создания редактируемого обьекта.
| created | {mode: String, object: L.GmxDrawing.Feature} | Создан редактируемый объект.
