# 可视化

## POST 卫星clsssh点选

POST /api/v1/satellite-clsssh/click

> Body 请求参数

```json
{
  "longitude": 133.875,
  "latitude": 29.625,
  "now_ts": 1654041600
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
    "datadate": 1654041600,
    "lon": 133.875,
    "lat": 29.625,
    "sea_surface_height": 1.9393,
    "sea_surface_height_anomaly": 0.4819
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
|» data|object|true||数据||
|»» datadate|integer|true||数据时间戳||
|»» lon|number|true||经度||
|»» lat|number|true||纬度||
|»» sea_surface_height|number|true||海面高|单位：m|
|»» sea_surface_height_anomaly|number|true||海面高度异常|单位：m|
