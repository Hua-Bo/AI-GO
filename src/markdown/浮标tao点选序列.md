## POST 浮标tao点选序列

POST /api/v1/buoy-tao/click/time-series

> Body 请求参数

```json
{
  "start_ts": 743558400,
  "end_ts": 743558400,
  "station_no": "-8.000000---110.000000"
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
        "lon": -110,
        "lat": -8,
        "air_temperature": 25.39,
        "relative_humidity": 84,
        "air_pressure": null,
        "eastward_wind_speed": -8.5,
        "northward_wind_speed": 0.7,
        "wind_dir": 8.528774823109748,
        "wind_speed": 94.70785216455835
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
|»»» datadate|integer|false||数据日期||
|»»» lon|integer|false||经度||
|»»» lat|integer|false||纬度||
|»»» air_temperature|number|false||气温|单位：℃|
|»»» relative_humidity|integer|false||相对湿度|单位：%|
|»»» air_pressure|null|false||气压|单位：hPa|
|»»» eastward_wind_speed|number|false||经向风速|单位：m/s|
|»»» northward_wind_speed|number|false||纬向风速|单位：m/s|
|»»» wind_dir|number|false||风向|单位：°|
|»»» wind_speed|number|false||风速|单位：m/s|
