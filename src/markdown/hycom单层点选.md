## POST hycom单层点选

POST /api/v1/sea-temp-salt/point

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
|» depth_idx|body|string| 是 | 深度层|范围：1~40|

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "datadate": 1357084800,
    "sea_temperature": 10.591713,
    "salinity": 32.957085,
    "speed_sound": 1488.2919,
    "depth": 0,
    "depth_idx": 1,
    "water_u": -0.009271669,
    "water_v": -0.25008744,
    "water_speed": 0.2502592485853056,
    "water_dir": 182.12319471592147,
    "sea_surface_height": -0.0014455984
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
|» code|integer|true||状态码||
|» msg|string|true||响应消息||
|» data|object|true||数据||
|»» datadate|integer|true||数据时间|查询的数据时间，为Unix时间戳|
|»» sea_temperature|number|true||海温|单位：℃|
|»» salinity|number|true||盐度|单位：‰|
|»» speed_sound|number|true||声速|单位：m/s|
|»» depth|integer|true||深度|单位：m|
|»» depth_idx|integer|true||深度层|1-40层|
|»» water_u|number|true||经向流速|单位：m/s|
|»» water_v|number|true||纬向流速|单位：m/s|
|»» water_speed|number|true||海流流速|单位：m/s|
|»» water_dir|number|true||海流流向|单位：°|
|»» sea_surface_height|number|true||海面高|单位：m|
