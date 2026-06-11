## POST 数值预报Ecmwf时间序列

POST /api/v1/forecast-ecmwf/time-series

> Body 请求参数

```json
{
  "longitude": -180,
  "latitude": -90,
  "forecast_ts": 1711929600,
  "start_ts": 1711929600,
  "end_ts": 1711989600
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» longitude|body|integer| 是 | 经度||
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
      "lon": -180,
      "lat": -90,
      "air_pressure": 999.22437,
      "air_temperature": -51.62288,
      "uwind": -4.591202,
      "vwind": 0.179489,
      "wind_speed": 4.59,
      "wind_dir": 92.24
    },
    {
      "datadate": 1711940400,
      "lon": -180,
      "lat": -90,
      "air_pressure": 998.75995,
      "air_temperature": -50.635056,
      "uwind": -4.840393,
      "vwind": 0.359161,
      "wind_speed": 4.85,
      "wind_dir": 94.24
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
|»» lon|integer|true||经度||
|»» lat|integer|true||纬度||
|»» air_pressure|number|true||气压|单位：hPa|
|»» air_temperature|number|true||气温|单位：℃|
|»» uwind|number|true||经向风速|单位：m/s|
|»» vwind|number|true||纬向风速|单位：m/s|
|»» wind_speed|number|true||风速|单位：m/s|
|»» wind_dir|number|true||风向|单位：°|
