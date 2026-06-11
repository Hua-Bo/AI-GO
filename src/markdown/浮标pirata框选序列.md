## POST 浮标pirata框选序列

POST /api/v1/buoy-pirata/area/time-series

> Body 请求参数

```json
{
  "now_ts": 1714521600,
  "paths": [
    [
      -10,
      0
    ],
    [
      -10,
      -10
    ]
  ]
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» now_ts|body|integer| 是 | 请求时间戳||
|» paths|body|[array]| 是 | 左上角和右下角2个点，第一维是经度，第二维是纬度||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "data": {
      "-10.000000--10.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "air_temperature": 26.7,
          "relative_humidity": 63.8,
          "air_pressure": 1011.6,
          "eastward_wind_speed": -2.1,
          "northward_wind_speed": 3.8,
          "wind_dir": 4.341658581355811,
          "wind_speed": 151.07357496190377
        }
      ],
      "-10.000000--6.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -6,
          "air_temperature": 28.5,
          "relative_humidity": 76.3,
          "air_pressure": null,
          "eastward_wind_speed": -2.1,
          "northward_wind_speed": 6.2,
          "wind_dir": 6.5459909283732225,
          "wind_speed": 161.28826237993647
        }
      ],
      "-10.000000-0.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": 0,
          "air_temperature": 28.91,
          "relative_humidity": 84.4,
          "air_pressure": null,
          "eastward_wind_speed": 0.7,
          "northward_wind_speed": 5.3,
          "wind_dir": 5.3460267493812905,
          "wind_speed": 187.5238200443135
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
|»»» -10.000000--10.000000|[object]|true||浮标编码||
|»»»» datadate|integer|false||数据时间||
|»»»» lon|integer|false||经度||
|»»»» lat|integer|false||纬度||
|»»»» air_temperature|number|false||海温|单位：℃|
|»»»» relative_humidity|number|false||相对湿度|单位：%|
|»»»» air_pressure|number|false||气压|单位：pa|
|»»»» eastward_wind_speed|number|false||风u|单位：m/s|
|»»»» northward_wind_speed|number|false||风v|单位：m/s|
|»»»» wind_dir|number|false||风向|单位：度|
|»»»» wind_speed|number|false||风速|单位：m/s|
|»»» -10.000000--6.000000|[object]|true||浮标编码||
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» air_temperature|number|false||||
|»»»» relative_humidity|number|false||||
|»»»» air_pressure|null|false||||
|»»»» eastward_wind_speed|number|false||||
|»»»» northward_wind_speed|number|false||||
|»»»» wind_dir|number|false||||
|»»»» wind_speed|number|false||||
|»»» -10.000000-0.000000|[object]|true||||
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» air_temperature|number|false||||
|»»»» relative_humidity|number|false||||
|»»»» air_pressure|null|false||||
|»»»» eastward_wind_speed|number|false||||
|»»»» northward_wind_speed|number|false||||
|»»»» wind_dir|number|false||||
|»»»» wind_speed|number|false||||
