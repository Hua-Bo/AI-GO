## POST 40层hycom表格

POST /api/v1/sea-temp-salt/click

> Body 请求参数

```json
{
  "latitude": 32.1,
  "longitude": 123.2,
  "now_ts": 1357084800
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» latitude|body|number| 是 | 纬度||
|» longitude|body|number| 是 | 经度||
|» now_ts|body|integer| 是 | 当前查询时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "data": [
      {
        "datadate": 1356998400,
        "sea_temperature": 25.824068,
        "salinity": 33.828156,
        "speed_sound": 1532.8895,
        "depth": 0,
        "depth_idx": 1,
        "water_u": -0.08336477,
        "water_v": -0.03382941,
        "water_speed": 0.08996729295913605,
        "water_dir": 247.91269404267092,
        "sea_surface_height": 0.44783324
      },
      {
        "datadate": 1356998400,
        "sea_temperature": 25.840025,
        "salinity": 33.828136,
        "speed_sound": 1532.9622,
        "depth": 2,
        "depth_idx": 2,
        "water_u": -0.046310518,
        "water_v": -0.0018596799,
        "water_speed": 0.046347842248017745,
        "water_dir": 267.7004231933403,
        "sea_surface_height": null
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
|» code|integer|true||响应状态码|              |
|» msg|string|true||响应消息|接口响应消息|
|» data|object|true||数据结构体|              |
|»» data|[object]|true||||
|»»» datadate|integer|true||数据时间戳|              |
|»»» sea_temperature|number¦null|true||海温|单位：℃|
|»»» salinity|number¦null|true||盐度|单位：‰|
|»»» speed_sound|number¦null|true||声速|单位：m/s|
|»»» depth|integer|true||深度|单位：m|
|»»» depth_idx|integer|true||深度层|范围：1~40|
|»»» water_u|number¦null|true||经向流速|单位：m/s|
|»»» water_v|number¦null|true||纬向流速|单位：m/s|
|»»» water_speed|number¦null|true||海流流速|单位：m/s|
|»»» water_dir|number¦null|true||海流流向|单位：°|
|»»» sea_surface_height|number¦null|true||海面高|单位：m|
