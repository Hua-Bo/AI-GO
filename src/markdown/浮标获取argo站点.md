## POST 浮标获取argo站点

POST /api/v1/buoy-argo/points

> Body 请求参数

```json
{
  "start_ts": 1714521600,
  "end_ts": 1714608000
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» start_ts|body|integer| 是 | 开始时间戳||
|» end_ts|body|integer| 是 | 结束时间戳||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "result": [
      {
        "lat": -37.62349,
        "lon": 131.36128,
        "station_no": "5906395"
      },
      {
        "lat": -42.49081,
        "lon": 58.6002,
        "station_no": "6904118"
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
|»»» lat|number|true||纬度||
|»»» lon|number|true||经度||
|»»» station_no|string|true||站点编号||
