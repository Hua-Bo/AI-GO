## POST hycom单层

POST /api/v1/sea-temp-salt/time-series

> Body 请求参数

```json
{
  "latitude": 32.1,
  "longitude": 123.2,
  "start_ts": 1357084800,
  "end_ts": 1357776000,
  "depth_idx": 1
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» latitude|body|number| 是 | 纬度||
|» longitude|body|number| 是 | 经度||
|» start_ts|body|integer| 是 | 起始时间戳||
|» end_ts|body|integer| 是 | 结束时间戳||
|» depth_idx|body|integer| 是 | 深度层|范围：1~40|

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": [
    {
      "datadate": 1356998400,
      "sea_temperature": 25.392,
      "salinity": 34.079002,
      "speed_sound": 1532.3552,
      "depth": 10,
      "depth_idx": 6,
      "water_u": -0.124,
      "water_v": 0.289,
      "water_speed": 0.3144789374755112,
      "water_dir": 336.77748707126347,
      "sea_surface_height": null
    },
    {
      "datadate": 1357084800,
      "sea_temperature": 26.128,
      "salinity": 33.737,
      "speed_sound": 1533.6609,
      "depth": 10,
      "depth_idx": 6,
      "water_u": 0.026,
      "water_v": 0.063,
      "water_speed": 0.06815423798684954,
      "water_dir": 22.425862013254232,
      "sea_surface_height": null
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
|» data|[object]|true||数据|返回的数据|
|»» datadate|integer|true||数据时间|格式是Unix时间戳|
|»» sea_temperature|number|true||海温|单位：℃|
|»» salinity|number|true||盐度|单位：‰|
|»» speed_sound|number|true||声速|单位：m/s|
|»» depth|integer|true||深度|单位：m|
|»» depth_idx|integer|true||深度层|范围：1-40层|
|»» water_u|number|true||经向流速|单位：m/s|
|»» water_v|number|true||纬向流速|单位：m/s|
|»» water_speed|number|true||海流流速|单位：m/s|
|»» water_dir|number|true||海流流向|单位：°|
|»» sea_surface_height|null|true||海面高|单位：m|
