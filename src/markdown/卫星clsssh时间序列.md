## POST 卫星clsssh时间序列

POST /api/v1/satellite-clsssh/time-series

> Body 请求参数

```json
{
  "longitude": 133.875,
  "latitude": 29.625,
  "start_ts": 1654041600,
  "end_ts": 1654051600
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» longitude|body|number| 是 | 经度||
|» latitude|body|number| 是 | 纬度||
|» start_ts|body|integer| 是 | 起始时间戳||
|» end_ts|body|integer| 是 | 终止时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": [
    {
      "datadate": 1575158400,
      "lon": 103.125,
      "lat": 54.125,
      "sea_surface_height": null,
      "sea_surface_height_anomaly": null
    },
    {
      "datadate": 1575244800,
      "lon": 103.125,
      "lat": 54.125,
      "sea_surface_height": null,
      "sea_surface_height_anomaly": null
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
|»» datadate|integer|false||数据时间戳||
|»» lon|number|false||经度||
|»» lat|number|false||维度||
|»» sea_surface_height|number|false||海面高|单位：m|
|»» sea_surface_height_anomaly|number|false||海面高度异常|单位：m|
