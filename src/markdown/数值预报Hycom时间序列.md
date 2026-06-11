## POST 数值预报Hycom时间序列

POST /api/v1/forecast-hycom/time-series

> Body 请求参数

```json
{
  "longitude": -179.76,
  "latitude": -77.84,
  "forecast_ts": 1711929600,
  "start_ts": 1711929600,
  "end_ts": 1721929600
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» longitude|body|number| 是 | 经度||
|» latitude|body|number| 是 | 纬度||
|» forecast_ts|body|integer| 是 | 预报时间戳||
|» start_ts|body|integer| 是 | 起始时间戳||
|» end_ts|body|integer| 是 | 终止时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": [
    {
      "datadate": 1711929600,
      "sea_temperature": -1.856001,
      "salinity": 34.365,
      "speed_sound": 1441.5156,
      "water_u": -0.010999999,
      "water_v": 0.065,
      "water_speed": 0.06592419637929199,
      "water_dir": 350.39479634839137,
      "sea_surface_height": -1.754
    },
    {
      "datadate": 1711940400,
      "sea_temperature": -1.857001,
      "salinity": 34.356,
      "speed_sound": 1441.5011,
      "water_u": -0.015,
      "water_v": 0.038,
      "water_speed": 0.0408533951719766,
      "water_dir": 338.45902388963106,
      "sea_surface_height": -1.761
    }
  ]
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
|» data|[object]|true||数据||
|»» datadate|integer|true||数据时间戳||
|»» sea_temperature|number|true||海温	|单位：℃|
|»» salinity|number|true||盐度	|单位：‰|
|»» speed_sound|number|true||声速	|单位：m/s|
|»» water_u|number|true||经向流速	|单位：m/s|
|»» water_v|number|true||纬向流速|单位：m/s|
|»» water_speed|number|true||海流流速|单位：m/s|
|»» water_dir|number|true||海流流向|单位：°|
|»» sea_surface_height|number|true||海面高|单位：m|
