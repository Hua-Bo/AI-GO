## POST 浮标rama点选序列

POST /api/v1/buoy-rama/click/time-series

> Body 请求参数

```json
{
  "start_ts": 743558400,
  "end_ts": 743558400,
  "station_no": "0.000000--80.500000"
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» start_ts|body|integer| 是 | 起始时间戳||
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
        "datadate": 743558400,
        "lon": 80.5,
        "lat": 0,
        "air_temperature": 27.46,
        "relative_humidity": 80.7,
        "air_pressure": null,
        "eastward_wind_speed": 6,
        "northward_wind_speed": 0.6,
        "wind_dir": 6.029925375044888,
        "wind_speed": 264.2894066370816
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
|»»» datadate|integer|false||数据时间||
|»»» lon|number|false||经度||
|»»» lat|integer|false||纬度||
|»»» air_temperature|number|false||气温|单位：℃|
|»»» relative_humidity|number|false||相对湿度|单位：%|
|»»» air_pressure|null|false||气压|单位：hPa|
|»»» eastward_wind_speed|integer|false||经向风速|单位：m/s|
|»»» northward_wind_speed|number|false||纬向风速|单位：m/s|
|»»» wind_dir|number|false||风向|单位：°|
|»»» wind_speed|number|false||风速|单位：m/s|
