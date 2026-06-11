## POST 卫星avisiossh点选

POST /api/v1/satellite-avisiossh/click

> Body 请求参数

```json
{
  "longitude": -179.875,
  "latitude": -69.375,
  "now_ts": 1575158400
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» longitude|body|number| 是 | 经度||
|» latitude|body|number| 是 | 纬度||
|» now_ts|body|integer| 是 | 当前查询时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "datadate": 1575158400,
    "lon": -179.875,
    "lat": -69.375,
    "sea_surface_height": -1.2094,
    "sea_surface_height_anomaly": 0.0908
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
|»» lon|number|true||经度||
|»» lat|number|true||纬度||
|»» sea_surface_height|number|true||海面高|单位：m|
|»» sea_surface_height_anomaly|number|true||海面高度异常|单位：m|
