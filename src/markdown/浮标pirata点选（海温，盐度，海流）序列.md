## POST 浮标pirata点选（海温，盐度，海流）序列

POST /api/v1/buoy-pirata-depth/click/time-series

> Body 请求参数

```json
{
  "start_ts": 1714521600,
  "end_ts": 1714708000,
  "station_no": "-10---10",
  "factor": "salinity"
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 |||
|» start_ts|body|integer| 是 | 开始时间戳|                                                      |
|» end_ts|body|integer| 是 | 结束时间戳|                                                      |
|» station_no|body|string| 是 | 站点编码|                                                      |
|» factor|body|string| 是 | 要素名称|salinity,water,,sea_temperature;表示盐度，海流和海温|

> 返回示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "data": {
      "1.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 1,
          "salinity": null,
          "sea_temperature": 28.59,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 1,
          "salinity": null,
          "sea_temperature": 28.42,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 1,
          "salinity": null,
          "sea_temperature": 28.35,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "10.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 10,
          "salinity": null,
          "sea_temperature": 28.56,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 10,
          "salinity": null,
          "sea_temperature": 28.42,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 10,
          "salinity": null,
          "sea_temperature": 28.36,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "100.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 100,
          "salinity": null,
          "sea_temperature": 19.35,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 100,
          "salinity": null,
          "sea_temperature": 19.48,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 100,
          "salinity": null,
          "sea_temperature": 19.32,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "120.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 120,
          "salinity": null,
          "sea_temperature": 16.7,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 120,
          "salinity": null,
          "sea_temperature": 16.98,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 120,
          "salinity": null,
          "sea_temperature": 16.28,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "13.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 13,
          "salinity": null,
          "sea_temperature": null,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 13,
          "salinity": null,
          "sea_temperature": null,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 13,
          "salinity": null,
          "sea_temperature": null,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "140.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 140,
          "salinity": null,
          "sea_temperature": 14.88,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 140,
          "salinity": null,
          "sea_temperature": 14.83,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 140,
          "salinity": null,
          "sea_temperature": 14.4,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "180.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 180,
          "salinity": null,
          "sea_temperature": 12.62,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 180,
          "salinity": null,
          "sea_temperature": 12.3,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 180,
          "salinity": null,
          "sea_temperature": 12.36,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "20.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 20,
          "salinity": null,
          "sea_temperature": 28.55,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 20,
          "salinity": null,
          "sea_temperature": 28.41,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 20,
          "salinity": null,
          "sea_temperature": 28.35,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "300.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 300,
          "salinity": null,
          "sea_temperature": 9.43,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 300,
          "salinity": null,
          "sea_temperature": 9.52,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 300,
          "salinity": null,
          "sea_temperature": 9.42,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "40.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 40,
          "salinity": null,
          "sea_temperature": 28.26,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 40,
          "salinity": null,
          "sea_temperature": 28,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 40,
          "salinity": null,
          "sea_temperature": 28.01,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "5.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 5,
          "salinity": null,
          "sea_temperature": 28.58,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 5,
          "salinity": null,
          "sea_temperature": 28.42,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 5,
          "salinity": null,
          "sea_temperature": 28.36,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "500.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 500,
          "salinity": null,
          "sea_temperature": 7.54,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 500,
          "salinity": null,
          "sea_temperature": 7.49,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 500,
          "salinity": null,
          "sea_temperature": 7.53,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "60.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 60,
          "salinity": null,
          "sea_temperature": 26.29,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 60,
          "salinity": null,
          "sea_temperature": 26.29,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 60,
          "salinity": null,
          "sea_temperature": 26.55,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        }
      ],
      "80.000000": [
        {
          "datadate": 1714521600,
          "lon": -10,
          "lat": -10,
          "depth": 80,
          "salinity": null,
          "sea_temperature": 22.32,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714608000,
          "lon": -10,
          "lat": -10,
          "depth": 80,
          "salinity": null,
          "sea_temperature": 22.48,
          "eastward_current_speed": null,
          "northward_current_speed": null,
          "water_speed": null,
          "water_dir": null
        },
        {
          "datadate": 1714694400,
          "lon": -10,
          "lat": -10,
          "depth": 80,
          "salinity": null,
          "sea_temperature": 22.25,
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
|» code|integer|true||响应编码||
|» msg|string|true||响应消息||
|» data|object|true||响应数据||
|»» data|object|true||||
|»»» 1.000000|[object]|true||深度|1m|
|»»»» datadate|integer|true||数据日期||
|»»»» lon|integer|true||经度||
|»»»» lat|integer|true||纬度||
|»»»» depth|integer|true||深度|单位：m|
|»»»» salinity|number|true||盐度|单位：‰|
|»»»» sea_temperature|null|true||海水温度|单位：℃|
|»»»» eastward_current_speed|null|true||东向海流速度|单位：m/s|
|»»»» northward_current_speed|null|true||北向海流速度|单位：m/s|
|»»»» water_speed|null|true||海流速度|单位：m/s|
|»»»» water_dir|null|true||海流方向|单位：度|
|»»» 10.000000|[object]|true||深度|10m|
|»»»» datadate|integer|true||||
|»»»» lon|integer|true||||
|»»»» lat|integer|true||||
|»»»» depth|integer|true||||
|»»»» salinity|number|true||||
|»»»» sea_temperature|null|true||||
|»»»» eastward_current_speed|null|true||||
|»»»» northward_current_speed|null|true||||
|»»»» water_speed|null|true||||
|»»»» water_dir|null|true||||
|»»» 100.000000|[object]|true||深度|100m|
|»»»» datadate|integer|true||||
|»»»» lon|integer|true||||
|»»»» lat|integer|true||||
|»»»» depth|integer|true||||
|»»»» salinity|null|true||||
|»»»» sea_temperature|null|true||||
|»»»» eastward_current_speed|null|true||||
|»»»» northward_current_speed|null|true||||
|»»»» water_speed|null|true||||
|»»»» water_dir|null|true||||
|»»» 120.000000|[object]|true||深度|120m|
|»»»» datadate|integer|true||||
|»»»» lon|integer|true||||
|»»»» lat|integer|true||||
|»»»» depth|integer|true||||
|»»»» salinity|number|true||||
|»»»» sea_temperature|null|true||||
|»»»» eastward_current_speed|null|true||||
|»»»» northward_current_speed|null|true||||
|»»»» water_speed|null|true||||
|»»»» water_dir|null|true||||
|»»» 20.000000|[object]|true||深度|20m|
|»»»» datadate|integer|true||||
|»»»» lon|integer|true||||
|»»»» lat|integer|true||||
|»»»» depth|integer|true||||
|»»»» salinity|number|true||||
|»»»» sea_temperature|null|true||||
|»»»» eastward_current_speed|null|true||||
|»»»» northward_current_speed|null|true||||
|»»»» water_speed|null|true||||
|»»»» water_dir|null|true||||
|»»» 40.000000|[object]|true||深度|40m|
|»»»» datadate|integer|true||||
|»»»» lon|integer|true||||
|»»»» lat|integer|true||||
|»»»» depth|integer|true||||
|»»»» salinity|number|true||||
|»»»» sea_temperature|null|true||||
|»»»» eastward_current_speed|null|true||||
|»»»» northward_current_speed|null|true||||
|»»»» water_speed|null|true||||
|»»»» water_dir|null|true||||
|»»» 5.000000|[object]|true||深度|5m|
|»»»» datadate|integer|true||||
|»»»» lon|integer|true||||
|»»»» lat|integer|true||||
|»»»» depth|integer|true||||
|»»»» salinity|number|true||||
|»»»» sea_temperature|null|true||||
|»»»» eastward_current_speed|null|true||||
|»»»» northward_current_speed|null|true||||
|»»»» water_speed|null|true||||
|»»»» water_dir|null|true||||
|»»» 60.000000|[object]|true||深度|60m|
|»»»» datadate|integer|true||||
|»»»» lon|integer|true||||
|»»»» lat|integer|true||||
|»»»» depth|integer|true||||
|»»»» salinity|number|true||||
|»»»» sea_temperature|null|true||||
|»»»» eastward_current_speed|null|true||||
|»»»» northward_current_speed|null|true||||
|»»»» water_speed|null|true||||
|»»»» water_dir|null|true||||
|»»» 80.000000|[object]|true||深度|80m|
|»»»» datadate|integer|true||||
|»»»» lon|integer|true||||
|»»»» lat|integer|true||||
|»»»» depth|integer|true||||
|»»»» salinity|number|true||||
|»»»» sea_temperature|null|true||||
|»»»» eastward_current_speed|null|true||||
|»»»» northward_current_speed|null|true||||
|»»»» water_speed|null|true||||
|»»»» water_dir|null|true||||
