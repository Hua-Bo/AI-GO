## POST 浮标argo框选

POST /api/v1/buoy-argo/area/time-series

> Body 请求参数

```json
{
  "now_ts": 1714521600,
  "paths": [
    [
      60,
      -20
    ],
    [
      69,
      -27
    ]
  ]
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» now_ts|body|integer| 是 | 请求时间戳||
|» paths|body|[array]| 是 | 左上角和右下角2个点，第一维是经度，第二维是纬度||

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "data": {
      "68.166000--26.830400": [
        {
          "datadate": 1714521600,
          "platform_number": "1901759",
          "lon": 68.166,
          "lat": -26.8304,
          "sea_temperature": 24.447,
          "salinity": 35.396,
          "pressure": 4.36
        },
        {
          "datadate": 1714521600,
          "platform_number": "1901759",
          "lon": 68.166,
          "lat": -26.8304,
          "sea_temperature": 24.452,
          "salinity": 35.397,
          "pressure": 6.06
        }
      ]
    }
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
|»» data|object|true||||
|»»» 68.166000--26.830400|[object]|true||点位字符串||
|»»»» datadate|integer|true||数据日期||
|»»»» platform_number|string|true||站点编号||
|»»»» lon|number|true||经度||
|»»»» lat|number|true||纬度||
|»»»» sea_temperature|number¦null|true||海温|单位：℃|
|»»»» salinity|number¦null|true||盐度|单位：‰|
|»»»» pressure|number¦null|true||压强|单位：hPa|
