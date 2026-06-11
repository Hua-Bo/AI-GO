## POST 浮标tao点选（海温，盐度，海流）序列

POST /api/v1/buoy-tao-depth/click/time-series

> Body 请求参数

```json
{
  "start_ts": 743558400,
  "end_ts": 743558400,
  "station_no": "-8.000000---110.000000",
  "factor": "sea_temperature"
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» start_ts|body|integer| 是 | 起始时间戳||
|» end_ts|body|integer| 是 | 结束时间戳||
|» station_no|body|string| 是 | 站点编号||
|» factor|body|string| 是 | 要素|salinity,water,,sea_temperature;表示盐度，海流和海温|

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "data": {
      "1.000000": [
        {
          "datadate": 743558400,
          "lon": -110,
          "lat": -8,
          "depth": 1,
          "salinity": null,
          "sea_temperature": 25.85,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "100.000000": [
        {
          "datadate": 743558400,
          "lon": -110,
          "lat": -8,
          "depth": 100,
          "salinity": null,
          "sea_temperature": 21.56,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "120.000000": [
        {
          "datadate": 743558400,
          "lon": -110,
          "lat": -8,
          "depth": 120,
          "salinity": null,
          "sea_temperature": 19.6,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "140.000000": [
        {
          "datadate": 743558400,
          "lon": -110,
          "lat": -8,
          "depth": 140,
          "salinity": null,
          "sea_temperature": 17.21,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "180.000000": [
        {
          "datadate": 743558400,
          "lon": -110,
          "lat": -8,
          "depth": 180,
          "salinity": null,
          "sea_temperature": 13.45,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "20.000000": [
        {
          "datadate": 743558400,
          "lon": -110,
          "lat": -8,
          "depth": 20,
          "salinity": null,
          "sea_temperature": 25.85,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "300.000000": [
        {
          "datadate": 743558400,
          "lon": -110,
          "lat": -8,
          "depth": 300,
          "salinity": null,
          "sea_temperature": 11.18,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "40.000000": [
        {
          "datadate": 743558400,
          "lon": -110,
          "lat": -8,
          "depth": 40,
          "salinity": null,
          "sea_temperature": 25.84,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "500.000000": [
        {
          "datadate": 743558400,
          "lon": -110,
          "lat": -8,
          "depth": 500,
          "salinity": null,
          "sea_temperature": 8.91,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "60.000000": [
        {
          "datadate": 743558400,
          "lon": -110,
          "lat": -8,
          "depth": 60,
          "salinity": null,
          "sea_temperature": 25.84,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "80.000000": [
        {
          "datadate": 743558400,
          "lon": -110,
          "lat": -8,
          "depth": 80,
          "salinity": null,
          "sea_temperature": 24.17,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
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
|» code|integer|true||响应编码 ||
|» msg|string|true||响应消息||
|» data|object|true||响应数据||
|»» data|object|true||||
|»»» 1.000000|[object]|true||海水深度|1m|
|»»»» datadate|integer|false||数据日期||
|»»»» lon|integer|false||经度||
|»»»» lat|integer|false||纬度||
|»»»» depth|integer|false||深度||
|»»»» salinity|null|false||盐度|单位：‰|
|»»»» sea_temperature|number|false||海水温度|单位：℃|
|»»»» eastward_current_speed|null|false||东向洋流速度|单位：m/s|
|»»»» northward_current_speed|null|false||北向洋流速度|单位：m/s|
|»»»» water_speed|null|false||海流速度|单位：m/s|
|»»»» water_dir|null|false||海流方向|单位：度|
|»»» 100.000000|[object]|true||海水深度|100m|
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» depth|integer|false||||
|»»»» salinity|null|false||||
|»»»» sea_temperature|number|false||||
|»»»» eastward_current_speed|null|false||||
|»»»» northward_current_speed|null|false||||
|»»»» water_speed|null|false||||
|»»»» water_dir|null|false||||
|»»» 120.000000|[object]|true||海水深度|120m|
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» depth|integer|false||||
|»»»» salinity|null|false||||
|»»»» sea_temperature|number|false||||
|»»»» eastward_current_speed|null|false||||
|»»»» northward_current_speed|null|false||||
|»»»» water_speed|null|false||||
|»»»» water_dir|null|false||||
|»»» 140.000000|[object]|true||海水深度|140m|
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» depth|integer|false||||
|»»»» salinity|null|false||||
|»»»» sea_temperature|number|false||||
|»»»» eastward_current_speed|null|false||||
|»»»» northward_current_speed|null|false||||
|»»»» water_speed|null|false||||
|»»»» water_dir|null|false||||
|»»» 180.000000|[object]|true||海水深度|180m|
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» depth|integer|false||||
|»»»» salinity|null|false||||
|»»»» sea_temperature|number|false||||
|»»»» eastward_current_speed|null|false||||
|»»»» northward_current_speed|null|false||||
|»»»» water_speed|null|false||||
|»»»» water_dir|null|false||||
|»»» 20.000000|[object]|true||海水深度|20m|
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» depth|integer|false||||
|»»»» salinity|null|false||||
|»»»» sea_temperature|number|false||||
|»»»» eastward_current_speed|null|false||||
|»»»» northward_current_speed|null|false||||
|»»»» water_speed|null|false||||
|»»»» water_dir|null|false||||
|»»» 300.000000|[object]|true||海水深度|300m|
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» depth|integer|false||||
|»»»» salinity|null|false||||
|»»»» sea_temperature|number|false||||
|»»»» eastward_current_speed|null|false||||
|»»»» northward_current_speed|null|false||||
|»»»» water_speed|null|false||||
|»»»» water_dir|null|false||||
|»»» 40.000000|[object]|true||海水深度|40m|
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» depth|integer|false||||
|»»»» salinity|null|false||||
|»»»» sea_temperature|number|false||||
|»»»» eastward_current_speed|null|false||||
|»»»» northward_current_speed|null|false||||
|»»»» water_speed|null|false||||
|»»»» water_dir|null|false||||
|»»» 500.000000|[object]|true||海水深度|500m|
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» depth|integer|false||||
|»»»» salinity|null|false||||
|»»»» sea_temperature|number|false||||
|»»»» eastward_current_speed|null|false||||
|»»»» northward_current_speed|null|false||||
|»»»» water_speed|null|false||||
|»»»» water_dir|null|false||||
|»»» 60.000000|[object]|true||海水深度|60m|
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» depth|integer|false||||
|»»»» salinity|null|false||||
|»»»» sea_temperature|number|false||||
|»»»» eastward_current_speed|null|false||||
|»»»» northward_current_speed|null|false||||
|»»»» water_speed|null|false||||
|»»»» water_dir|null|false||||
|»»» 80.000000|[object]|true||海水深度|80m|
|»»»» datadate|integer|false||||
|»»»» lon|integer|false||||
|»»»» lat|integer|false||||
|»»»» depth|integer|false||||
|»»»» salinity|null|false||||
|»»»» sea_temperature|number|false||||
|»»»» eastward_current_speed|null|false||||
|»»»» northward_current_speed|null|false||||
|»»»» water_speed|null|false||||
|»»»» water_dir|null|false||||
