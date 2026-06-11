## POST 卫星oisst时间序列

POST /api/v1/satellite-oisst/time-series

> Body 请求参数

```json
{
  "longitude": -179.875,
  "latitude": -70.875,
  "start_ts": 1609286400,
  "end_ts": 1609386400
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
      "datadate": 1609286400,
      "lon": -179.875,
      "lat": -70.875,
      "sea_temperature": -1.799988
    },
    {
      "datadate": 1609372800,
      "lon": -179.875,
      "lat": -70.875,
      "sea_temperature": -1.799988
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
|»» lon|number|true||经度||
|»» lat|number|true||纬度||
|»» sea_temperature|number|true||海温|单位：℃|
