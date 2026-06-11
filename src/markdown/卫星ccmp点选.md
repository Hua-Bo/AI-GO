## POST 卫星ccmp点选

POST /api/v1/satellite-ccmp/click

> Body 请求参数

```json
{
  "longitude": 103.125,
  "latitude": 54.125,
  "now_ts": 1669852800
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» longitude|body|number| 是 | 经度||
|» latitude|body|number| 是 | 纬度||
|» now_ts|body|integer| 是 | 当前查询时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "datatime": 1669852800,
    "lon": 103.125,
    "lat": 54.125,
    "uwnd": 4.413376,
    "vwnd": 0.235336,
    "wind_speed": 4.42,
    "wind_dir": 266.95
  }
}
```

### 返回结果

|状态码|状态码含义|说明|
|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|http状态码|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true||响应状态码||
|» msg|string|true||响应消息||
|» data|object|true||数据||
|»» lon|number|true||经度||
|»» lat|number|true||纬度||
|»» uwnd|number|true||经向风速|单位：m/s|
|»» vwnd|number|true||纬向风速|单位：m/s|
|»» wind_speed|number|true||风速|单位：m/s|
|»» wind_dir|number|true||风向|单位：°|
|»» datadate|integer|true||数据时间戳||
