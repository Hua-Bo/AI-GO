## POST 浮标获取tao站点

POST /api/v1/buoy-tao/points

> Body 请求参数

```json
{
  "start_ts": 873936000,
  "end_ts": 874022400
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» start_ts|body|integer| 是 | 起始时间戳||
|» end_ts|body|integer| 是 | 结束时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "result": [
      {
        "lat": -8,
        "lon": -110,
        "station_no": "-8.000000---110.000000"
      },
      {
        "lat": 5,
        "lon": 137,
        "station_no": "5.000000--137.000000"
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
|» code|integer|true||响应编码||
|» msg|string|true||响应消息||
|» data|object|true||响应数据||
|»» result|[object]|true||结果集||
|»»» lat|integer|true||纬度||
|»»» lon|integer|true||经度||
|»»» station_no|string|true||站点编号||
