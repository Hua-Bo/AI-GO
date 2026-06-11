## POST 卫星smossss点选

POST /api/v1/satellite-smossss/click

> Body 请求参数

```json
{
  "longitude": -41.628,
  "latitude": -66.322,
  "now_ts": 1536192000
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» longitude|body|number| 是 | 经度||
|» latitude|body|number| 是 | 纬度||
|» now_ts|body|integer| 是 | 查询时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "datadate": 1536192000,
    "lon": -41.628242,
    "lat": -66.32231,
    "salinity": 34.47376
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
|»» salinity|number|true||盐度|单位：‰|
