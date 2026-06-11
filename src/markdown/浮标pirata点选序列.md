## POST 浮标pirata点选序列

POST /api/v1/buoy-pirata/click/time-series

> Body 请求参数

```json
{
  "start_ts": 1714521600,
  "end_ts": 1714708000,
  "station_no": "-10.000000---10.000000"
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» start_ts|body|integer| 是 | 开始时间戳||
|» end_ts|body|integer| 是 | 结束时间戳||
|» station_no|body|string| 是 | 站点编号||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "data": [
      {
        "datadate": 1714521600,
        "lon": -10,
        "lat": -10,
        "air_temperature": 26.7,
        "relative_humidity": 63.8,
        "air_pressure": 1011.6,
        "eastward_wind_speed": -2.1,
        "northward_wind_speed": 3.8,
        "wind_direction": 4.341658581355811,
        "wind_speed": 151.07357496190377
      },
      {
        "datadate": 1714608000,
        "lon": -10,
        "lat": -10,
        "air_temperature": 26.6,
        "relative_humidity": 66.1,
        "air_pressure": 1011.50006,
        "eastward_wind_speed": -4.6,
        "northward_wind_speed": 4.1,
        "wind_direction": 6.161980066553827,
        "wind_speed": 131.71075724955463
      }
    ]
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
|» code|integer|true||响应编码||
|» msg|string|true||响应消息||
|» data|object|true||响应数据||
|»» data|[object]|true||||
|»»» datadate|integer|true||数据日期||
|»»» lon|integer|true||经度||
|»»» lat|integer|true||纬度||
|»»» air_temperature|number|true||海温|单位：℃|
|»»» relative_humidity|number|true||相对湿度|单位：%|
|»»» air_pressure|number|true||气压|单位：hPa|
|»»» eastward_wind_speed|number|true||经向风速|单位：m/s|
|»»» northward_wind_speed|number|true||纬向风速|单位：m/s|
|»»» wind_dir|number|true||风向|单位：°|
|»»» wind_speed|number|true||风速|单位：m/s|
