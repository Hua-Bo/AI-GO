## POST 数值预报Tuvssh点选

POST /api/v1/forecast-tuvssh/click

> Body 请求参数

```json
{
  "longitude": -180,
  "latitude": -76.916664,
  "now_ts": 1711845000,
  "forecast_ts": 1711929600
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» longitude|body|integer| 是 | 经度||
|» latitude|body|number| 是 | 纬度||
|» now_ts|body|integer| 是 | 数据时间戳||
|» forecast_ts|body|integer| 是 | 预报时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "datadate": 1711845000,
    "lon": -180,
    "lat": -76.916664,
    "sea_temperature": -1.845728,
    "salinity": 33.76318,
    "sea_surface_height": -1.682487,
    "eastward_current_speed_ocean": -0.169726,
    "northward_current_speed_ocean": 0.099755,
    "water_speed": 0.19687045020245023,
    "water_dir": 300.4445169435797
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
|»» datadate|integer|true||数据时间||
|»» lon|integer|true||经度||
|»» lat|number|true||纬度||
|»» sea_temperature|number|true||海温|单位：℃|
|»» salinity|number|true||盐度|‰|
|»» sea_surface_height|number|true||海面高|单位：m|
|»» eastward_current_speed_ocean|number|true||海流经向流速|单位：m/s|
|»» northward_current_speed_ocean|number|true||海流纬向流速|单位：m/s|
|»» water_speed|number|true||海流流速|单位：m/s|
|»» water_dir|number|true||海流流向|单位：°|
