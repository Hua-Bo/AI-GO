## POST 浮标rama框选序列

POST /api/v1/buoy-rama/area/time-series

> Body 请求参数

```json
{
  "now_ts": 743558400,
  "paths": [
    [
      80.5,
      0
    ],
    [
      80.5,
      -10
    ]
  ]
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» now_ts|body|integer| 是 | 查询时间戳||
|» paths|body|[array]| 是 | 左上角和右下角2个点，第一维是经度，第二维是纬度||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "data": {
      "80.500000-0.000000": [
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
|»» data|object|true||||
|»»» 80.500000-0.000000|[object]|true||浮标编号||
|»»»» datadate|integer|false||数据时间||
|»»»» lon|number|false||经度||
|»»»» lat|integer|false||纬度||
|»»»» air_temperature|number|false||气温|单位：℃|
|»»»» relative_humidity|number|false||相对湿度|单位：%|
|»»»» air_pressure|null|false||气压|单位：Pa|
|»»»» eastward_wind_speed|integer|false||东向风速|单位：m/s|
|»»»» northward_wind_speed|number|false||北向风速|单位：m/s|
|»»»» wind_dir|number|false||风向|单位：度|
|»»»» wind_speed|number|false||风速|单位：m/s|
