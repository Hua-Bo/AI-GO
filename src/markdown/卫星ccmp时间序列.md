## POST 卫星ccmp时间序列

POST /api/v1/satellite-ccmp/time-series

> Body 请求参数

```json
{
  "longitude": 93.375,
  "latitude": 18.125,
  "start_ts": 1670191200,
  "end_ts": 1670338800
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
      "datatime": 1669852800,
      "lon": -179.875,
      "lat": -69.375,
      "uwnd": -0.680234,
      "vwnd": -2.049948,
      "wind_speed": 2.16,
      "wind_dir": 18.36
    },
    {
      "datatime": 1669874400,
      "lon": -179.875,
      "lat": -69.375,
      "uwnd": -0.4417,
      "vwnd": -3.535284,
      "wind_speed": 3.56,
      "wind_dir": 7.12
    },
    {
      "datatime": 1669896000,
      "lon": -179.875,
      "lat": -69.375,
      "uwnd": 0.482908,
      "vwnd": -4.264004,
      "wind_speed": 4.29,
      "wind_dir": 353.54
    },
    {
      "datatime": 1669917600,
      "lon": -179.875,
      "lat": -69.375,
      "uwnd": -2.768298,
      "vwnd": -4.773261,
      "wind_speed": 5.52,
      "wind_dir": 30.11
    },
    {
      "datatime": 1669939200,
      "lon": -179.875,
      "lat": -69.375,
      "uwnd": -4.280531,
      "vwnd": -6.458479,
      "wind_speed": 7.75,
      "wind_dir": 33.54
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
|» data|[object]|true||||
|»» datadate|integer|true||数据时间戳||
|»» lon|number|true||经度||
|»» lat|number|true||纬度||
|»» uwnd|number|true||经向风速|单位：m/s|
|»» vwnd|number|true||纬向风速|单位：m/s|
|»» wind_speed|number|true||风速|单位：m/s|
|»» wind_dir|number|true||风向|单位：°|
