# ������������ ������� gmxDrawing

gmxDrawing - ������ ��� ��������� �����, ���������, ��������������� � ��������.

### Events

#### Event

| Property | Type | Description
| --- | --- | ---
| mode | String | ������� ����� (`add` - ����� ���������� �������, `edit` - ����� �������������� �������)
| object | L.GmxDrawing.Feature | ������������� ������.

L.GmxDrawing

| Type | Property | Description
| --- | --- | ---
| createstart | {mode: String} ('add', 'edit') | ������ ������ �������� �������������� �������.
| createend | {mode: String} ('add', 'edit') | ��������� ������ �������� �������������� �������.
| add | L.GmxDrawing.Feature | �������� ������������� ������.
| removed | {mode: String, object: L.GmxDrawing.Feature} | ������ ������������� ������.
| editstart | {mode: String, object: L.GmxDrawing.Feature} | ����� ������� ���������.
| edit | {mode: String, object: L.GmxDrawing.Feature} | ������� ������������� ������.
| editend | {mode: String, object: L.GmxDrawing.Feature} | ����� ��������� ���������.
| add | L.GmxDrawing.Feature | ������� � ����� �������� �������������� �������.
| dragstart | {mode: String, object: L.GmxDrawing.Feature} | ������ ����������� �������.
| drag | {mode: String, object: L.GmxDrawing.Feature} | ����������� �������.
| dragend | {mode: String, object: L.GmxDrawing.Feature} | ��������� ����������� �������.
| created | {mode: String, object: L.GmxDrawing.Feature} | ������ ������������� ������.


