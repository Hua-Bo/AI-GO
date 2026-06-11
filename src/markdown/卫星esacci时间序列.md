## POST 卫星esacci时间序列

POST /api/v1/satellite-esacci/time-series

> Body 请求参数

```json
{
  "longitude": -16.21,
  "latitude": -32.35,
  "start_ts": 1579046400,
  "end_ts": 1625128000
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
      "datadate": 1579046400,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.769035
    },
    {
      "datadate": 1580515200,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.688927
    },
    {
      "datadate": 1581724800,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.723255
    },
    {
      "datadate": 1583020800,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.75555
    },
    {
      "datadate": 1584230400,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.670284
    },
    {
      "datadate": 1585699200,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.6212
    },
    {
      "datadate": 1586908800,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.66527
    },
    {
      "datadate": 1588291200,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.635246
    },
    {
      "datadate": 1589500800,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.599335
    },
    {
      "datadate": 1590969600,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.651928
    },
    {
      "datadate": 1592179200,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.72208
    },
    {
      "datadate": 1593561600,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.76523
    },
    {
      "datadate": 1594771200,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.77735
    },
    {
      "datadate": 1596240000,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.849136
    },
    {
      "datadate": 1597449600,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.89905
    },
    {
      "datadate": 1598918400,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.79678
    },
    {
      "datadate": 1600128000,
      "lon": -16.210375,
      "lat": -32.352364,
      "salinity": 35.764896
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
|»» salinity|number|true||盐度|单位：‰|
