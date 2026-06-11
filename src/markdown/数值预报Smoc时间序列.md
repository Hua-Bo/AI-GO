## POST 数值预报Smoc时间序列

POST /api/v1/forecast-smoc/time-series

> Body 请求参数

```json
{
  "longitude": -180,
  "latitude": -76.916664,
  "forecast_ts": 1711929600,
  "start_ts": 1711845000,
  "end_ts": 1711945000
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» longitude|body|integer| 是 | 经度||
|» latitude|body|number| 是 | 纬度||
|» forecast_ts|body|integer| 是 | 预报时间戳||
|» start_ts|body|integer| 是 | 起始时间戳||
|» end_ts|body|integer| 是 | 终止时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": [
    {
      "datadate": 1711845000,
      "lon": -180,
      "lat": -76.916664,
      "eastward_current_speed_ocean": -0.149414,
      "northward_current_speed_ocean": 0.027344,
      "water_speed": 0.15189548569669375,
      "water_dir": 280.3708381859301,
      "eastward_current_speed_tide": 0.020508,
      "northward_current_speed_tide": -0.072266,
      "tide_speed": 0.07511958791546547,
      "tide_dir": 164.15685741405582
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
|» code|integer|true||响应状态码||
|» msg|string|true||响应消息||
|» data|[object]|true||数据||
|»» datadate|integer|true||数据时间戳||
|»» lon|integer|true||经度||
|»» lat|number|true||纬度||
|»» eastward_current_speed_ocean|number|true||海流经向流速|单位：m/s|
|»» northward_current_speed_ocean|number|true||海流纬向流速|单位：m/s|
|»» water_speed|number|true||海流流速|单位：m/s|
|»» water_dir|number|true||海流流向|单位：°|
|»» eastward_current_speed_tide|number|true||潮流经向流速|单位：m/s|
|»» northward_current_speed_tide|number|true||潮流纬向流速|单位：m/s|
|»» tide_speed|number|true||潮流流速|单位：m/s|
|»» tide_dir|number|true||潮流流向|单位：°|
