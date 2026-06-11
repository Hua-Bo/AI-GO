## POST 数值预报Mfwam点选

POST /api/v1/forecast-mfwam/click

> Body 请求参数

```json
{
  "longitude": -180,
  "latitude": -69.583336,
  "now_ts": 1711854000,
  "forecast_ts": 1711929600
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» longitude|body|integer| 是 | 经度||
|» latitude|body|number| 是 | 纬度||
|» now_ts|body|integer| 是 | 数据时间戳||
|» forecast_ts|body|integer| 是 | 预报时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "datadate": 1711854000,
    "lon": -180,
    "lat": -69.583336,
    "significant_wave_height": 4.26,
    "wave_direction": 315.53998,
    "wave_period": 12.02
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
|» code|integer|true||响应状态码||
|» msg|string|true||响应消息||
|» data|object|true||||
|»» datadate|integer|true||数据时间戳||
|»» lon|integer|true||经度||
|»» lat|number|true||纬度||
|»» significant_wave_height|number|true||海浪有效波高|单位：m|
|»» wave_direction|number|true||海浪波向|单位：°|
|»» wave_period|number|true||海浪波周期|单位：秒|
