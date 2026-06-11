## POST era5时间序列

POST /api/v1/era5/time-series

> Body 请求参数

```json
{
  "longitude": 122.34,
  "latitude": 22.15,
  "start_ts": 1638316800,
  "end_ts": 1638416800
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» longitude|body|number| 是 | 经度||
|» latitude|body|number| 是 | 纬度||
|» start_ts|body|integer| 是 | 起始时间戳||
|» end_ts|body|integer| 是 | 结束时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": [
    {
      "datadate": 1638316800,
      "u10": -7.23,
      "v10": -11.51,
      "relative_humidity": 72.58,
      "air_temperature": 21.59,
      "precipitation": 0.79,
      "latitude": 22.15,
      "longitude": 122.34,
      "wind_speed": 13.59,
      "wind_dir": 32.13
    },
    {
      "datadate": 1638403200,
      "u10": -6.18,
      "v10": -7.3,
      "relative_humidity": 68.1,
      "air_temperature": 22.34,
      "precipitation": 0.85,
      "latitude": 22.15,
      "longitude": 122.34,
      "wind_speed": 9.56,
      "wind_dir": 40.25
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
|» code|integer|true||状态码||
|» msg|string|true||响应消息||
|» data|[object]|true||数据||
|»» datadate|integer|true||数据时间|查询的数据时间，格式为Unix时间戳|
|»» u10|number|true||径向风|单位：m/s|
|»» v10|number|true||横向风|单位：m/s|
|»» relative_humidity|number|true||相对湿度|单位：%|
|»» air_temperature|number|true||气温|单位：℃|
|»» precipitation|number|true||降水量|单位：mm|
|»» latitude|number|true||纬度||
|»» longitude|number|true||经度||
|»» wind_speed|number|true||风速|单位：m/s|
|»» wind_dir|number|true||风向|单位：°|
