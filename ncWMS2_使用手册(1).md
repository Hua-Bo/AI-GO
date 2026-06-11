




# ncWMS2 全球海浪预报 WMS 服务 — 部署与使用手册

## 一、服务概览

| 项目 | 值 |
|------|-----|
| **数据源** | MFWAM 全球海浪模式 (Météo-France) |
| **数据文件** | `mfwamglocep_2026060200_R20260526.nc` (581 MB) |
| **预报日期** | 2026-05-02 ~ 2026-05-03 |
| **时间分辨率** | 3小时 (03:00 / 06:00 / 09:00 / 12:00 / 15:00 / 18:00 / 21:00 UTC) |
| **空间范围** | 经度 -180° ~ 180°，纬度 -80° ~ 90° |
| **WMS 版本** | 1.3.0 |
| **服务地址** | `http://localhost:8080/ncwms2/wms` |
| **管理后台** | `http://localhost:8080/ncwms2/admin/` |
| **认证** | Digest Auth，用户 `admin` / `admin`，角色 `ncWMS-admin` |

---

## 二、Linux 服务器安装部署

本章介绍如何在 Linux 服务器上从零部署 ncWMS2 服务。

### 2.1 环境要求

| 项目 | 最低要求 | 推荐配置 |
|------|---------|---------|
| **Linux 发行版** | CentOS 7/8、Ubuntu 20.04/22.04、Debian 11+ | Ubuntu 22.04 LTS |
| **JDK** | JDK 11 | JDK 17 (OpenJDK) |
| **内存** | 4 GB | 8 GB+ |
| **磁盘** | 50 GB+（需容纳 NC 数据文件） | 100 GB+（SSD） |
| **网络** | 可访问外网（下载依赖） | — |

> 处理大 NC 文件（>500MB）时建议分配 8GB 以上堆内存。

### 2.2 安装 JDK 17

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install openjdk-17-jdk -y

# CentOS / RHEL 7
sudo yum install java-17-openjdk java-17-openjdk-devel -y

# CentOS / RHEL 8+ / Fedora
sudo dnf install java-17-openjdk java-17-openjdk-devel -y
```

验证安装：

```bash
java -version
# 输出示例:
# openjdk version "17.0.9" 2023-10-17
# OpenJDK Runtime Environment (build 17.0.9+9-Ubuntu-122.04)
```

设置 `JAVA_HOME` 环境变量：

```bash
# 查找 JDK 安装路径
readlink -f $(which java) | sed 's:/bin/java::'

# 写入 profile
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' | sudo tee -a /etc/profile
echo 'export PATH=$JAVA_HOME/bin:$PATH' | sudo tee -a /etc/profile
source /etc/profile
```

### 2.3 下载并安装 Jetty

```bash
cd /opt
sudo wget https://repo1.maven.org/maven2/org/eclipse/jetty/jetty-home/9.4.58.v20250814/jetty-home-9.4.58.v20250814.tar.gz
sudo tar -xzf jetty-home-9.4.58.v20250814.tar.gz
sudo mv jetty-home-9.4.58.v20250814 jetty
```

### 2.4 配置 Jetty Base

Jetty 推荐使用 `jetty.base` 与 `jetty.home` 分离的部署模式，便于升级和维护：

```bash
sudo mkdir /opt/jetty-base
cd /opt/jetty-base
sudo java -jar /opt/jetty/start.jar --add-module=server,http,deploy,webapp,resources
```

### 2.5 下载并部署 ncWMS2.war

```bash
cd /opt/jetty-base/webapps
sudo wget -O ncwms2.war https://github.com/Reading-eScience-Centre/ncwms/releases/download/ncwms-2.8.0/ncWMS2.war

# 创建配置文件目录
sudo mkdir -p /root/.ncWMS2
```

### 2.6 配置 ncWMS2

创建主配置文件 `/root/.ncWMS2/config.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config xmlns="http://www.resc.reading.ac.uk/ncwms2-config"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.resc.reading.ac.uk/ncwms2-config ncwms2_config.xsd">
    <server>
        <title>ncWMS2 海浪预报服务</title>
        <allowFeatureInfo>true</allowFeatureInfo>
        <maxImageWidth>2048</maxImageWidth>
        <maxImageHeight>2048</maxImageHeight>
    </server>
</config>
```

> 如需启用 Digest 认证，还需在 `/opt/jetty-base/etc/ncwms2.xml` 中配置安全域，参考本手册后续安全配置相关章节。

### 2.7 配置 Jetty 启动参数（JDK 17 兼容性）

编辑 `/opt/jetty-base/start.ini`，添加以下 JVM 参数：

```ini
--exec
-Xmx4g
--add-opens=java.base/java.lang=ALL-UNNAMED
--add-opens=java.base/java.util=ALL-UNNAMED
--add-opens=java.base/java.lang.reflect=ALL-UNNAMED
--add-opens=java.base/java.text=ALL-UNNAMED
--add-opens=java.base/sun.misc=ALL-UNNAMED
--add-opens=java.desktop/java.awt.font=ALL-UNNAMED
```

> `-Xmx4g` 为堆内存上限，处理大 NC 文件时可调整为 `-Xmx8g` 或更高。

### 2.8 启动服务

**前台启动（测试调试用）：**

```bash
cd /opt/jetty-base
sudo java -jar /opt/jetty/start.jar
```

**后台运行：**

```bash
sudo nohup java -jar /opt/jetty/start.jar > /var/log/ncwms2.log 2>&1 &
```

启动成功后访问 `http://服务器IP:8080/ncwms2/` 验证。

### 2.9 配置 systemd 系统服务（推荐）

创建 `/etc/systemd/system/ncwms2.service`：

```ini
[Unit]
Description=ncWMS2 Web Map Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/jetty-base
ExecStart=/usr/bin/java -jar /opt/jetty/start.jar
Restart=on-failure
RestartSec=10
Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk"

[Install]
WantedBy=multi-user.target
```

启用并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable ncwms2
sudo systemctl start ncwms2
sudo systemctl status ncwms2
```

### 2.10 放行防火墙

```bash
# firewalld (CentOS / RHEL)
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --reload

# ufw (Ubuntu)
sudo ufw allow 8080/tcp
```

### 2.11 放置 NC 数据文件

```bash
sudo mkdir -p /data/ncwms2/data
# 将 MFWAM NC 文件拷贝到此目录
# 修改 config.xml 中的数据路径指向 /data/ncwms2/data/
```

### 2.12 添加数据集

通过 Admin API 注册数据集（需要认证）：

```bash
curl --digest -u admin:admin -X POST \
  "http://localhost:8080/ncwms2/admin/addDataset?dataset=mfwam&location=/data/ncwms2/data/mfwamglocep_2026060200.nc"
```

---

## 三、macOS 开发环境部署

### 3.1 软件栈

```
macOS 26.5
├── OpenJDK 17 (/opt/homebrew/opt/openjdk@17)
├── Jetty 9.4.58 (Servlet 容器)
├── ncWMS2 2.5.2 (WAR 包部署)
└── ncWMS2 配置文件 (~/.ncWMS2/config.xml)
```

### 3.2 JVM 兼容性参数

JDK 17 需添加以下参数：

```
--add-opens java.base/java.lang=ALL-UNNAMED
--add-opens java.base/java.util=ALL-UNNAMED
--add-opens java.base/sun.misc=ALL-UNNAMED
--add-opens java.base/sun.reflect=ALL-UNNAMED
--add-opens java.xml.bind/com.sun.xml.bind.v2.runtime.reflect=ALL-UNNAMED
--add-opens java.xml.bind/com.sun.xml.bind.v2.runtime.reflect.opt=ALL-UNNAMED
```

### 3.3 启动命令

```bash
cd /Users/jiufangkeji/Downloads/marvis/ncserver/jetty
/opt/homebrew/opt/openjdk@17/bin/java \
  --add-opens java.base/java.lang=ALL-UNNAMED \
  --add-opens java.base/java.util=ALL-UNNAMED \
  --add-opens java.base/sun.misc=ALL-UNNAMED \
  --add-opens java.base/sun.reflect=ALL-UNNAMED \
  --add-opens java.xml.bind/com.sun.xml.bind.v2.runtime.reflect=ALL-UNNAMED \
  --add-opens java.xml.bind/com.sun.xml.bind.v2.runtime.reflect.opt=ALL-UNNAMED \
  -jar start.jar &
```

关停：

```bash
pkill -f start.jar
```

---

## 四、可用图层（22个变量）

### 4.1 波高类 (Scalar)

| 图层 | 变量 | 说明 | 量程 |
|------|------|------|------|
| `mfwam/VHM0` | Hm0 | 谱有效波高 | -0.6 ~ 13.0 m |
| `mfwam/VHM0_WW` | Hm0_ww | 风浪有效波高 | — |
| `mfwam/VHM0_SW1` | Hm0_sw1 | 涌浪1有效波高 | — |
| `mfwam/VHM0_SW2` | Hm0_sw2 | 涌浪2有效波高 | — |
| `mfwam/VMXL` | Hmax | 最大波峰高度 | — |
| `mfwam/VCMX` | Hcmax | 最大波谷-波峰高度 | — |

### 4.2 周期类 (Scalar)

| 图层 | 变量 | 说明 |
|------|------|------|
| `mfwam/VTM01_WW` | Tm01_ww | 风浪平均周期 |
| `mfwam/VTM01_SW1` | Tm01_sw1 | 涌浪1平均周期 |
| `mfwam/VTM01_SW2` | Tm01_sw2 | 涌浪2平均周期 |
| `mfwam/VTM02` | Tm02 | 平均过零周期 |
| `mfwam/VTM10` | Tm-10 | 谱矩周期 |
| `mfwam/VTPK` | Tp | 谱峰周期 |

### 4.3 波向类 (Scalar — 标量方向值)

> **重要**：以下变量均为标量方向值（0-360°），不是 U/V 矢量分量对。ncWMS2 的 `default-arrows` 等箭头样式需要 U/V 矢量分量数据，因此对纯标量 VMDR 无法绘制箭头，只能用 `raster`、`colored_contours` 等标量样式渲染。如需矢量箭头，请使用 4.4 节的 VSDX:VSDY 矢量对图层。

| 图层 | 变量 | 说明 |
|------|------|------|
| `mfwam/VMDR` | Mdir | 平均波向 |
| `mfwam/VMDR_WW` | Mdir_ww | 风浪平均波向 |
| `mfwam/VMDR_SW1` | Mdir_sw1 | 涌浪1平均波向 |
| `mfwam/VMDR_SW2` | Mdir_sw2 | 涌浪2平均波向 |
| `mfwam/VPED` | Ped | 谱峰方向 |

### 4.4 Stokes漂流 (Vector)

| 图层 | 变量 | 说明 |
|------|------|------|
| `mfwam/VSDX:VSDY-group` | Stokes | Stokes漂流矢量（复合图层） |
| `mfwam/VSDX:VSDY-mag` | | Stokes漂流矢量幅值 |
| `mfwam/VSDX:VSDY-dir` | | Stokes漂流矢量方向 |
| `mfwam/VSDX` | Ust | Stokes漂流 U 分量 |
| `mfwam/VSDY` | Vst | Stokes漂流 V 分量 |

---

## 五、WMS 请求示例

### 5.1 GetCapabilities（获取服务能力）

```
GET /ncwms2/wms?service=WMS&version=1.3.0&request=GetCapabilities
```

返回 XML，列出全部图层、支持的操作和元数据。

### 5.2 GetMap（获取地图图片）

#### 全球有效波高（raster 渲染）

```
http://localhost:8080/ncwms2/wms?
  service=WMS&version=1.3.0&request=GetMap&
  layers=mfwam/VHM0&styles=raster/default&
  crs=EPSG:4326&bbox=-90,-180,90,180&
  width=1024&height=512&format=image/png
```

#### 亚洲区域有效波高

```
...&bbox=-30,60,70,180&width=960&height=800...
```

#### 指定时间步

```
...&time=2026-06-02T12:00:00Z...
```

#### 不同色板（palette）

`palette=div-RdBu` / `div-Spectral` / `seq-OrRd` 等（见第八章）

```
...&colorscalerange=0,8&palette=div-RdBu...
```

#### 对数色标（LOGSCALE）

```
...&colorscalerange=0.1,12&LOGSCALE=true...
```

#### 色标等值线（colored_contours）

```
...&styles=colored_contours/default&NUMCOLORBANDS=20...
```

#### 矢量箭头图（Stokes漂流 VSDX:VSDY-group）

```
...&layers=mfwam/VSDX:VSDY-group&styles=default-vector/default
   &bbox=-10,100,30,150&width=800&height=640...
```

> 详见「五-A 矢量箭头渲染」章节。

#### 动画 GIF

需要同时指定 `TIME` 时间范围和 `ANIMATION=true`：

```
...&format=image/gif
   &TIME=2026-06-02T00:00:00Z/2026-06-02T18:00:00Z
   &ANIMATION=true&colorscalerange=0,8...
```

### 5.3 扩展参数（ncWMS 特有）

| 参数 | 说明 | 示例 | 已验证 |
|------|------|------|--------|
| `COLORSCALERANGE` | 色标范围 | `0,8` | ✅ |
| `NUMCOLORBANDS` | 色标分段数 | `20` | ✅ |
| `LOGSCALE` | 对数色标 | `true` | ✅ |
| `OPACITY` | 透明度 | `80` | — |
| `ABOVEMAXCOLOR` | 超上限颜色 | `0xFF0000FF` | — |
| `BELOWMINCOLOR` | 低下限颜色 | `0x0000FFFF` | — |
| `ANIMATION` | 动画开关 | `true` | ✅ |
| `TIME` | 时间范围（用于动画） | `2026-06-02T00:00:00Z/2026-06-02T18:00:00Z` | ✅ |
| `palette` | 色板名 | `div-RdBu` | ✅ |

### 5.4 GetFeatureInfo（点查询）

```
http://localhost:8080/ncwms2/wms?
  service=WMS&version=1.3.0&request=GetFeatureInfo&
  layers=mfwam/VHM0&
  crs=EPSG:4326&bbox=-90,-180,90,180&
  width=100&height=50&i=50&j=25&
  query_layers=mfwam/VHM0&info_format=text/xml
```

返回示例：

```xml
<FeatureInfoResponse>
    <longitude>0.9</longitude>
    <latitude>-3.6</latitude>
    <Feature>
        <layer>mfwam/VHM0</layer>
        <FeatureInfo>
            <id>VHM0</id>
            <value>1.1</value>
        </FeatureInfo>
    </Feature>
</FeatureInfoResponse>
```

### 5.5 GetMetadata（获取图层元数据）

**时间步列表：**

```
GET /ncwms2/wms?service=WMS&version=1.3.0&request=GetMetadata
  &item=timesteps&layerName=mfwam/VHM0&day=2026-06-02
```

响应：

```json
{"timesteps": [
  "03:00:00.000Z","06:00:00.000Z","09:00:00.000Z",
  "12:00:00.000Z","15:00:00.000Z","18:00:00.000Z",
  "21:00:00.000Z"
]}
```

**图层详情：**

```
GET /ncwms2/wms?service=WMS&version=1.3.0&request=GetMetadata
  &item=layerDetails&layerName=mfwam/VHM0
```

返回 JSON，包含 `bbox`、`scaleRange`、`palettes`、`datesWithData` 等。

### 5.6 GetLegendGraphic（获取图例）

```
GET /ncwms2/wms?service=WMS&version=1.3.0&request=GetLegendGraphic
  &layer=mfwam/VHM0&palette=default&width=30&height=400
  &numcolorbands=20
```

返回 PNG 格式色条图片。

### 5.7 GetTimeseries（时间序列图）

查询某个经纬度点上变量随时间变化的折线图。参数与 GetFeatureInfo 类似，需指定 `i`/`j` 像素坐标。

**图片格式：**

```
GET /ncwms2/wms?service=WMS&version=1.3.0&request=GetTimeseries&
  layers=mfwam/VHM0&styles=raster/default&
  query_layers=mfwam/VHM0&
  crs=EPSG:4326&latitude=12&longitude=115&
  bbox=-90,-180,90,180&width=800&height=600&
  i=400&j=300&
  time=2026-06-02T00:00:00Z/2026-06-03T00:00:00Z&
  info_format=image/png
```

> **注意**：CSV 格式需要数据集开启 `downloadable=true`，默认仅支持图片输出。

### 5.8 Godiva3 交互式浏览器

ncWMS2 内置 Web 前端，无需写任何代码即可浏览数据：

```
http://localhost:8080/ncwms2/godiva3.html
```

**功能**：
- 选择图层和色板
- 点击地图查询数值
- 时间轴动画播放
- 缩放漫游
- 导出为 PNG / GeoTIFF

### 5.9 Menu API（图层树）

```
GET /ncwms2/wms?service=WMS&version=1.3.0&request=GetMetadata
  &item=menu
```

返回 JSON 格式的图层树结构，含 `id`、`label`、`plottable` 等字段，适合前端动态构建图层选择器。

---

### 五-A 矢量箭头渲染

#### 问题背景

`mfwam/VMDR`（平均波向）及其衍生变量（VMDR_WW、VMDR_SW1、VMDR_SW2）是**标量方向值**（0-360°），不是 U/V 矢量分量对。ncWMS2 的 `default-arrows`、`vector-arrows` 等箭头样式需要 U/V 矢量分量数据，对纯标量 VMDR 无法绘制箭头，只能用 `raster`、`colored_contours` 等标量样式渲染。

![VMDR 标量渲染](</Users/jiufangkeji/Library/Application Support/com.tencent.mac.marvis/MarvisData/User/oAN1i2ToueOJLjcHEzBD-ZcQlwVs/workspace/conv_19ea66a3e28_552088f26ef4/output/vmdr_fixed.png>)

#### 正确的矢量箭头方案

数据集中的 `VSDX`（Stokes drift U 分量）和 `VSDY`（Stokes drift V 分量）是真正的 U/V 矢量分量对。ncWMS2 已自动识别并创建了以下三个派生图层：

| 派生图层 | 说明 |
|----------|------|
| `mfwam/VSDX:VSDY-group` | 矢量复合图层（箭头渲染入口） |
| `mfwam/VSDX:VSDY-dir` | 矢量方向（°） |
| `mfwam/VSDX:VSDY-mag` | 矢量幅值（m/s） |

#### 矢量箭头请求示例

```
http://localhost:8080/ncwms2/wms?
  service=WMS&version=1.3.0&request=GetMap&
  layers=mfwam/VSDX:VSDY-group&styles=default-vector/default&
  crs=EPSG:4326&bbox=-10,100,30,150&
  width=600&height=480&format=image/png
```

#### VSDX:VSDY-group 支持的矢量样式

| Style | 说明 | 预览 |
|-------|------|------|
| `default-vector/default` | 标准矢量箭头 | ![矢量箭头](</Users/jiufangkeji/Library/Application Support/com.tencent.mac.marvis/MarvisData/User/oAN1i2ToueOJLjcHEzBD-ZcQlwVs/workspace/conv_19ea66a3e28_552088f26ef4/output/vsdx_vsdy_vectors.png>) |
| `colored_sized_arrows/default` | 颜色+大小双编码箭头 | ![彩色大小箭头](</Users/jiufangkeji/Library/Application Support/com.tencent.mac.marvis/MarvisData/User/oAN1i2ToueOJLjcHEzBD-ZcQlwVs/workspace/conv_19ea66a3e28_552088f26ef4/output/vsdx_vsdy_colored_sized.png>) |
| `colored_wind_barbs/default` | 风羽图 | ![风羽图](</Users/jiufangkeji/Library/Application Support/com.tencent.mac.marvis/MarvisData/User/oAN1i2ToueOJLjcHEzBD-ZcQlwVs/workspace/conv_19ea66a3e28_552088f26ef4/output/vsdx_vsdy_wind_barbs.png>) |
| `vector_arrows/default` | 矢量箭头 | — |
| `vector_fat_arrows/default` | 粗箭头 | — |
| `sized_arrows` | 大小箭头 | — |
| `colored_sized_meteorological_arrows/default` | 气象箭头 | — |

> **注意**：第八章中列出的 `default-arrows`、`arrows`、`fat_arrows` 等样式仅对 U/V 矢量分量对（如 VSDX:VSDY-group）有效，对纯标量 VMDR 无效。

---

### 五-B KML/KMZ 导出

ncWMS2 支持将地图数据导出为 Google Earth 可识别的 KML/KMZ 格式。KMZ 是 KML 的压缩打包格式，Google Earth 可直接打开并叠加在地球模型上。

**注意**：KML/KMZ 仅作为**输出格式**，不能作为数据源输入。

#### 请求示例

```
http://localhost:8080/ncwms2/wms?
  service=WMS&version=1.3.0&request=GetMap&
  layers=mfwam/VHM0&styles=raster/default&
  crs=EPSG:4326&bbox=-90,-180,90,180&
  width=1024&height=512&
  format=application/vnd.google-earth.kmz
```

在浏览器中访问该 URL，会下载一个 `.kmz` 文件。用 Google Earth 打开即可看到全球有效波高数据叠加在地球模型上。

#### 透明叠加

添加 `&TRANSPARENT=true` 参数可以让数据层透明叠加在 Google Earth 底图上，视觉效果更好：

```
...&format=application/vnd.google-earth.kmz&TRANSPARENT=true
```

---

## 六、功能测试结果总览

| 序号 | 功能 | 状态 | 详情 |
|------|------|------|------|
| 1 | GetCapabilities | ✅ 通过 | 返回 93KB XML 能力文档，22 个图层全部注册，HTTP 200 |
| 2 | GetMap (VHM0 raster 全球) | ✅ 通过 | 全球有效波高标量图，125KB PNG，HTTP 200 |
| 3 | GetMap (VHM0 raster 亚洲) | ✅ 通过 | 东南亚区域 (-10,100,30,150)，101KB PNG，HTTP 200 |
| 4 | GetMap (VSDX:VSDY-group 矢量箭头) | ✅ 通过 | Stokes漂流矢量箭头 default-vector，129KB PNG，HTTP 200 |
| 5 | GetMap (VSDX:VSDY-group 风羽) | ✅ 通过 | colored_wind_barbs 风羽图，26KB PNG，HTTP 200 |
| 6 | GetMap (colored_contours) | ✅ 通过 | VHM0 等值线填色图 NUMCOLORBANDS=20，20KB PNG，HTTP 200 |
| 7 | GetMap (动画 GIF) | ✅ 通过 | ANIMATION=true + TIME 范围 (7帧)，92KB GIF，HTTP 200 |
| 8 | GetFeatureInfo | ✅ 通过 | 点查询 (I=400,J=200)，返回 VHM0=1.06，XML 303B，HTTP 200 |
| 9 | GetMetadata (timesteps) | ✅ 通过 | 返回 7 个 UTC 3小时步 (03:00~21:00)，JSON 127B，HTTP 200 |
| 10 | GetLegendGraphic | ✅ 通过 | 图例色条 PALETTE=default，6.6KB PNG，HTTP 200 |
| 11 | GetTimeseries (图片) | ✅ 通过 | 时间序列折线图 info_format=image/png，33KB PNG，HTTP 200 |
| 12 | GetTimeseries (CSV) | ❌ 不支持 | HTTP 400，LayerNotQueryable："can only be downloaded as an image"，需开启 downloadable=true |
| 13 | GetVerticalProfile | ❌ 不支持 | 海浪数据无垂直维度（2D 表面场） |
| 14 | GetTransect | ❌ 不支持 | 海浪数据无垂直维度 |
| 15 | Godiva3 交互浏览器 | ✅ 通过 | /godiva3.html 可访问，GWT 前端正常加载，HTTP 200 |
| 16 | Menu API | ✅ 通过 | 返回 JSON 图层树，含 22 个变量完整层级结构，HTTP 200 |

> **验证日期**：2026-06-08 | **测试基URL**：`http://localhost:8080/ncwms2/wms` | **CRS**：EPSG:4326 (lat,lon 轴序)
>
> **补充已验证功能**（上次测试通过，本次未重复）：
> - GetMap (对数色标 LOGSCALE) ✅
> - GetMap (多色板 palette) ✅
> - GetMetadata (layerDetails) ✅
> - Admin API (addDataset / removeDataset / datasetStatus) ✅

---

## 七、管理 API

所有管理接口需 Digest 认证（`admin` / `admin`）。

### 7.1 添加数据集

```bash
curl --digest -u admin:admin -X POST \
  -d "id=my_data" \
  -d "title=My Dataset" \
  -d "location=/path/to/data.nc" \
  -d "queryable=true" \
  http://localhost:8080/ncwms2/admin/addDataset
```

### 7.2 移除数据集

```bash
curl --digest -u admin:admin -X POST \
  -d "id=my_data" \
  http://localhost:8080/ncwms2/admin/removeDataset
```

### 7.3 查看数据集状态

```bash
curl --digest -u admin:admin \
  "http://localhost:8080/ncwms2/admin/datasetStatus?dataset=mfwam"
```

---

## 八、可用 Styles（渲染样式）

### Scalar 图层

| Style | 说明 |
|-------|------|
| `default-scalar/default` | 默认标量色图 |
| `raster/default` | 栅格色图 |
| `colored_contours/default` | 彩色等值线 |
| `contours` | 等值线 |

### Vector 图层（波向 / Stokes）

| Style | 说明 |
|-------|------|
| `arrows` | 基础箭头 |
| `default-arrows` | 默认箭头 |
| `fat_arrows` | 粗箭头 |
| `meteorological_arrows` | 气象箭头 |
| `meteorological_fat_arrows` | 气象粗箭头 |
| `meteorological_triangle_arrows` | 气象三角箭头 |
| `triangle_arrows` | 三角箭头 |
| `upstream_dots` | 上游点 |
| `vector_arrows/default` | 矢量箭头 |
| `vector_fat_arrows/default` | 矢量粗箭头 |
| `vector_wind_barbs/default` | 矢量风羽 |
| `colored_sized_arrows/default` | 彩色尺寸箭头 |

---

## 九、可用 Palettes（色板）

```
default, default-inv, div-BrBG, div-BrBG-inv,
div-BuRd, div-BuRd2, div-PRGn, div-PiYG, div-PuOr,
div-RdBu, div-RdGy, div-RdYlBu, div-RdYlGn,
div-Spectral, seq-BuGn, seq-BuPu, seq-GnBu,
seq-Greens, seq-OrRd, seq-PuBu
```

用法：在 GetLegendGraphic 或 GetMap 中指定 `&palette=div-RdBu`

---

## 十、目录结构

```
/Users/jiufangkeji/Downloads/marvis/ncserver/
├── jetty/
│   ├── start.jar              # Jetty 启动器
│   ├── webapps/
│   │   ├── ncWMS2.war         # ncWMS2 WAR 包
│   │   └── ncWMS2.xml         # Context 配置（含 Auth）
│   ├── etc/
│   │   └── realm.properties   # Digest 认证凭据
│   └── ncwms.log              # 运行日志
├── mfwamglocep_2026060200_R20260526.nc  # 海浪预报数据
└── ncWMS2-standalone.jar      # 备用 Standalone 版
```

---

## 十一、Web 客户端集成

### Leaflet 示例

```javascript
const map = L.map('map').setView([20, 120], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

L.tileLayer.wms('http://localhost:8080/ncwms2/wms', {
    layers: 'mfwam/VHM0',
    styles: 'raster/default',
    format: 'image/png',
    transparent: true,
    crs: L.CRS.EPSG4326,
    version: '1.3.0',
    colorscalerange: '0,8',
}).addTo(map);
```

### OpenLayers 示例

```javascript
const layer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
        url: 'http://localhost:8080/ncwms2/wms',
        params: {
            LAYERS: 'mfwam/VHM0',
            STYLES: 'raster/default',
            FORMAT: 'image/png',
            VERSION: '1.3.0',
            COLORSCALERANGE: '0,8',
        },
    }),
});
map.addLayer(layer);
```

---

## 十二、故障排查

| 问题 | 可能原因 | 解决 |
|------|---------|------|
| 503 Service Unavailable | ncWMS 启动失败 | 检查 `ncwms.log` 中 `FAILED` 或 `UNAVAILABLE` |
| 401 Unauthorized | Digest 认证未通过 | 确认 `realm.properties` 及 `ncWMS2.xml` 中 securityHandler 配置 |
| 图片尺寸超限 | 默认最大 1024×1024 | 缩小 width/height，或修改 config.xml 中 `maxImageWidth`/`maxImageHeight` |
| `NcwmsCatalogue` null | JAXB 兼容性问题 | 确保 JDK 17 已添加 `--add-opens` 参数 |
| 数据集加载失败 (at null) | config.xml 格式错误 | 通过 admin API 添加数据集，而非手写 XML |

---

## 十三、生成的地图预览

启动服务后，以下命令可直接生成预览图：

```bash
curl -s -o vhm0_global.png \
  "http://localhost:8080/ncwms2/wms?service=WMS&version=1.3.0&request=GetMap&layers=mfwam/VHM0&styles=raster/default&crs=EPSG:4326&bbox=-90,-180,90,180&width=1024&height=512&format=image/png"
```
*（内容由AI生成，仅供参考）*
*（内容由AI生成，仅供参考）*
*（内容由AI生成，仅供参考）*


---

# 附录：背景知识与快速入门

> 本附录面向完全不了解 ncWMS2 的新用户。如果你已经熟悉 WMS、NetCDF 等概念，可直接跳过。

## 附录A：什么是 ncWMS2？

### 一句话定义

**ncWMS2 是一个开源的 Web 地图服务，能将 NetCDF 格式的海洋/气象科学数据自动转成标准地图图片（PNG/GIF），无需写一行代码。**

### 它解决什么问题？

科学数据的世界里，气象和海洋模型输出的数据通常以 **NetCDF** 或 **GRIB** 格式存储。这些二进制格式对普通人来说门槛极高：

- 无法用图片查看器直接打开
- 需要安装专业软件（如 Panoply、MATLAB、Python xarray）才能读取
- 一个文件动辄几百 MB，下载困难
- 数据是四维的（经度 × 纬度 × 时间 × 变量），需要专业知识才能提取出想要的信息

**ncWMS2 的解决思路**：

1. 把 NetCDF 数据当作地图图层来管理，一个变量就是一个图层
2. 对外提供标准的 WMS 接口，用户只需浏览器（或任何支持 WMS 的客户端）就能看到数据
3. 支持放大缩小、切换时间步、点击地图查询任意位置的数值
4. 所有渲染在服务端完成，客户端只接收 PNG/GIF 图片，无需处理原始数据

### 工作方式

```
用户浏览器 → HTTP 请求（WMS URL）→ ncWMS2 服务 → 读取 NetCDF 文件 → 实时渲染成地图图片 → 返回 PNG/GIF
```

整个流程对用户完全透明：你只需要拼一个 URL，就能在浏览器里看到全球海浪预报图。

### 核心概念

| 概念 | 通俗解释 | 类比 |
|------|---------|------|
| **WMS（Web Map Service）** | OGC 国际标准，定义了"怎么通过 URL 请求一张地图图片"。任何支持 WMS 的软件都能直接接入 ncWMS2 | 相当于地图界的 HTTP 协议 |
| **NetCDF（.nc 文件）** | 科学数据通用格式，是气象海洋模型的标准输出格式。一个 .nc 文件里可以存储多个变量、多个时间步的空间数据 | 相当于科学界的 Excel，但更强大 |
| **图层（Layer）** | NC 文件中的每个变量就是一个图层。本手册配置的 MFWAM 数据有 22 个图层：如有效波高 VHM0、波向 VMDR、风速等 | 相当于 Photoshop 的图层，每层展示一类数据 |
| **样式（Style）** | 同一图层可以用不同方式渲染。标量数据可以用 raster（像素填色）、contours（等值线）；矢量数据可以用 arrows（箭头）、wind_barbs（风羽） | 相当于同一份数据的不同可视化方案 |

---

## 附录B：ncWMS2 能做什么？

以本手册配置的海浪预报数据为例：

| 能力 | 说明 | 示例 |
|------|------|------|
| 查看全球/区域波高图 | 生成有效波高 VHM0 彩色地图 | 全球 PNG |
| 查看波向分布 | 标量方向值 VMDR 的 raster 显示 | 彩色方向图 |
| 查看海流矢量箭头 | Stokes 漂流 VSDX:VSDY 的矢量箭头 | 箭头/风羽图 |
| 点击查询数值 | 任意经纬度点的波高值查询 | "该点波高 1.06m" |
| 时间动画 | 多帧 GIF 动画展示海浪随时间变化 | 7 帧动画 |
| 生成时间序列 | 某点波高随时间变化的折线图 | PNG 折线图 |
| 获取图例 | 色标图例条 | 渐变图例 |
| 嵌入第三方网页 | Leaflet/OpenLayers 地图叠加 | WebGIS 集成 |
| 交互式浏览 | Godiva3 浏览器，鼠标点击探索 | 可视化探索 |
| KML 导出 | 将地图数据导出为 Google Earth 格式 | KMZ 文件 |

---

## 附录C：怎么使用？

ncWMS2 的使用门槛从低到高分为三个层次，你可以根据自己的需求选择：

### C.1 零代码使用：浏览器直接看图

**最低门槛**，只需浏览器和 ncWMS2 服务地址。在地址栏输入 URL 即可获取地图图片。

示例（获取全球有效波高图）：

```
http://服务器IP:8080/ncwms2/wms?service=WMS&version=1.3.0&request=GetMap
  &layers=mfwam/VHM0&styles=raster/default&crs=EPSG:4326
  &bbox=-90,-180,90,180&width=1024&height=512&format=image/png
```

URL 参数速查：
- 换变量：改 `layers`（如 `mfwam/VMDR` 换为波向）
- 换区域：改 `bbox`（格式：`南纬,西经,北纬,东经`，如 `-30,60,70,180` 为亚洲区域）
- 换时间：加 `&time=2026-06-02T12:00:00Z`
- 换渲染：改 `styles`（如 `colored_contours/default`）
- 换色板：加 `&palette=div-RdBu`
- 做动画：加 `&TIME=起始/终止&ANIMATION=true&format=image/gif`
- 导出 KML：设 `&format=application/vnd.google-earth.kmz`，返回 KMZ 文件可用 Google Earth 打开

### C.2 交互式探索：Godiva3 浏览器

在浏览器打开 `http://服务器IP:8080/ncwms2/godiva3.html`，你将看到一个完整的交互式地图界面：

- 鼠标点击地图任意位置，右侧面板显示该点的数值
- 拖动时间轴，数据随时间动态变化
- 切换图层和色板，对比不同变量
- 缩放漫游，探索感兴趣的区域
- 一键导出为 PNG 或 GeoTIFF

Godiva3 是 ncWMS2 内置的纯前端工具，无需安装任何软件。

### C.3 开发者集成

如果你需要将海浪数据嵌入自己的应用：

**前端集成**：把 WMS URL 作为 Leaflet 或 OpenLayers 的 Tile Layer，在你的网页地图上叠加海浪数据。示例代码见本手册第十一章。

**后端调用**：使用 curl 或 Python requests 定时拉取地图图片，用于自动化的报告生成或监控：

```bash
# 每天自动下载最新预报图
curl -o wave_forecast.png \
  "http://localhost:8080/ncwms2/wms?service=WMS&version=1.3.0&request=GetMap&layers=mfwam/VHM0&styles=raster/default&crs=EPSG:4326&bbox=-90,-180,90,180&width=1024&height=512&format=image/png"
```

**移动端**：任何支持 WMS 协议的 App 都可以直接接入，无需二次开发。

---

## 附录D：典型应用场景

| 场景 | 说明 | 使用方式 |
|------|------|----------|
| 海洋预报可视化 | 气象局/海洋局将模式数据发布为在线地图，公众可随时查看 | Godiva3 + WMS API |
| 航运决策 | 船员查看航线上的波高和波向数据，规避恶劣海况 | 移动端 WMS 客户端 |
| 科研分析 | 海洋学者快速浏览 NC 数据，无需下载几百 MB 的文件 | Godiva3 + GetFeatureInfo |
| WebGIS 叠加 | 在地图上叠加海浪图层，与航道、港口等数据一同展示 | Leaflet / OpenLayers |
| 自动化报告 | Python 脚本每天自动拉取最新预报图片并插入报告 | curl + 定时任务 |
| 数据共享 | 机构对外提供数据服务，用户无需下载原始 NC 文件 | 公开 WMS 端点 |
| 实时监控 | 监控特定海域波高是否超标，触发预警 | GetFeatureInfo 定时轮询 |
| 三维地球展示 | 将海浪预报导出 KML 在 Google Earth 中立体展示 | GetMap format=application/vnd.google-earth.kmz |

---

## 附录E：ncWMS2 vs GeoServer 功能对比

先说结论：两者定位不同，互为补充。ncWMS2 专攻科学数据发布，GeoServer 是通用 GIS 服务器。

### E.1 核心定位

| 维度 | ncWMS2 | GeoServer |
|------|--------|-----------|
| 定位 | 环境科学数据 WMS 专用服务 | 通用企业级 GIS 服务器 |
| 目标用户 | 气象/海洋/气候研究人员 | GIS 工程师、空间数据管理员 |
| 设计理念 | 零配置自动识别 NetCDF 变量 | 手动配置图层、样式、数据源 |

### E.2 数据源支持

| 格式 | ncWMS2 | GeoServer |
|------|--------|-----------|
| NetCDF (.nc) | 原生支持，自动识别所有变量 | 需安装 NetCDF 插件，配置复杂 |
| GRIB (.grb) | 原生支持 | 需插件 |
| OPeNDAP | 原生支持 | 不支持 |
| GeoTIFF (.tif) | 不支持 | 原生支持 |
| Shapefile (.shp) | 不支持 | 原生支持 |
| PostGIS | 不支持 | 原生支持 |
| WMS 级联 | 不支持 | 支持 |

### E.3 渲染能力

| 能力 | ncWMS2 | GeoServer |
|------|--------|-----------|
| 标量填色 (raster) | 自动，色标自适应数据范围 | 需手动配置 SLD 样式 |
| 等值线 (contours) | 内置，一行样式名搞定 | 需 SLD 配置 |
| 矢量箭头 | 自动识别 U/V 分量生成 | 不支持（需要预处理） |
| 风羽图 (barbs) | 内置 | 不支持 |
| 时间动画 (GIF) | 内置，一个参数 | 需 WMS-Time + 前端拼接 |
| 时间序列图 | 内置 GetTimeseries | 不支持 |
| 垂直剖面图 | 内置 GetVerticalProfile | 不支持 |
| 图例自动生成 | 内置 GetLegendGraphic | 需手动配置 |
| 自定义色板 | 内置 20+ 种 | SLD 灵活但复杂 |

### E.4 OGC 标准支持

| 标准 | ncWMS2 | GeoServer |
|------|--------|-----------|
| WMS 1.1.1 / 1.3.0 | 支持 | 支持 |
| WFS | 不支持 | 支持 |
| WCS | 不支持 | 支持 |
| WPS | 不支持 | 支持 |
| WMTS | 不支持 | 支持 |

### E.5 性能

| 方面 | ncWMS2 | GeoServer |
|------|--------|-----------|
| NC 大文件读取 | 高效，按需切片读取 | 较差，常需预切片 |
| 渲染速度 | 快（专用优化） | 中等 |
| 内存占用 | 中（4GB 可处理 500MB+ NC） | 较高 |
| 并发能力 | 中等 | 强（支持集群） |

### E.6 部署与运维

| 方面 | ncWMS2 | GeoServer |
|------|--------|-----------|
| 安装 | Jetty/Tomcat + war，简单 | 安装包或 war，中等 |
| 配置 | 几乎零配置，自动识别 | 需逐个配置数据源、图层、样式 |
| 认证 | Jetty Security Realm | 内置用户/角色系统 + LDAP/OAuth |
| 集群 | 不支持 | 支持 |
| 监控 | 基本日志 | 内置监控面板 |

### E.7 适用场景建议

| 场景 | 推荐方案 |
|------|---------|
| 发布 NetCDF/GRIB 气象海洋数据 | ncWMS2 |
| 发布 Shapefile/PostGIS 矢量数据 | GeoServer |
| 发布 GeoTIFF 卫星影像 | GeoServer |
| 需要 WFS/WCS 要素查询下载 | GeoServer |
| 需要矢量箭头/风羽/动画 | ncWMS2 |
| 需要时间序列/剖面分析 | ncWMS2 |
| 两者都需要 | ncWMS2 + GeoServer 混合架构，前端 Leaflet 叠加 |

### E.8 混合架构示例

```
GeoServer 发布：海岸线 Shapefile、港口点、航道
ncWMS2 发布：海浪波高 VHM0（raster）、海流矢量 VSDX:VSDY（arrows）

前端 Leaflet/OpenLayers：
  - 底层：GeoServer WMS 底图（海岸线/港口）
  - 叠加：ncWMS2 WMS 海浪图层
  - 叠加：ncWMS2 KML 导出供 Google Earth 查看
```

---

*（内容由AI生成，仅供参考）*
