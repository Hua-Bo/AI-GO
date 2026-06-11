import type {Viewer} from 'cesium'
import {
  Cartesian2, Cartesian3, Cartographic, Color, CallbackProperty, LagrangePolynomialApproximation,
  PolylineGlowMaterialProperty, ImageMaterialProperty, SampledPositionProperty, JulianDate, ClockRange,
  Math as CesiumMath
} from 'cesium'
import type {ShallowRef} from 'Vue'

export default function useParabola(viewerRef: ShallowRef<Viewer | null>) {

  const renderParabolaLayer = (center: [number, number], stationList: [number, number][]) => {
    const circleConfig: [number, number, number] = [2000, 10000, 200]

    stationList.forEach((s) => {
      const t = Math.random()
      const color = t > 0.3 ? 'green' : 'red'
      circlePos(s, color, circleConfig)
      outputLine(s, center)
    })
    circlePos(center, 'green', circleConfig)

    // setInterval(turningStat(), 3000)
  }

  const outputLine = function (startPoint: [number, number], stopPoint: [number, number]) {
    const viewer = viewerRef.value
    if (!viewer) {
      return;
    }

    const startLon = startPoint[0]
    const startLat = startPoint[1]

    const [stopLon, stopLat] = stopPoint

    viewer.clock.clockRange = ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 30000;
    // const startTime = viewer.clock.startTime;
    const startTime = JulianDate.addSeconds(viewer.clock.startTime, 0, new JulianDate());
    const midTime = JulianDate.addSeconds(startTime, 43200, new JulianDate());
    const stopTime = JulianDate.addSeconds(startTime, 86400, new JulianDate());

    // Create a straight-line path.
    let property = new SampledPositionProperty();
    const startPosition = Cartesian3.fromDegrees(startLon, startLat, 0);
    property.addSample(startTime, startPosition);
    const stopPosition = Cartesian3.fromDegrees(stopLon, stopLat, 0);
    property.addSample(stopTime, stopPosition);

    // Find the midpoint of the straight path, and raise its altitude.
    const midCer = property.getValue(midTime)
    if (!midCer) {
      return
    }
    const midPoint = Cartographic.fromCartesian(midCer);
    midPoint.height = CesiumMath.nextRandomNumber() * 500 + 25000;
    const midPosition = viewer.scene.globe.ellipsoid
      .cartographicToCartesian(midPoint, new Cartesian3());

    // Redo the path to be the new arc.
    property = new SampledPositionProperty();
    property.addSample(startTime, startPosition);
    property.addSample(midTime, midPosition);
    property.addSample(stopTime, stopPosition);
    property.setInterpolationOptions({
      interpolationDegree: 5,
      interpolationAlgorithm: LagrangePolynomialApproximation
    });

    const color = Color.fromRandom({
      alpha: 1.0
    });

    viewer.entities.add({
      position: property,
      path: {
        resolution: 1200,
        material: new PolylineGlowMaterialProperty({
          glowPower: 0.16,
          taperPower: 0.25,
          color: color
        }),
        width: 10,
        leadTime: 0,
        trailTime: 1e10
      }
    });

  }

  const circlePos = function (point: number[], type: ('red' | 'green') = 'red',
                              param: [number, number, number]) {
    const viewer = viewerRef.value
    if (!viewer) {
      return
    }

    // 最小半径,最大半径,每次增加的大小
    const [minR, maxR, deviationR] = param

    function changeR1() {
      let r = minR
      return function () {
        r += deviationR;
        if (r >= maxR) {
          r = minR;
        }
        return r;
      }
    }

    function color() {
      let x = 1 - minR / maxR;
      return Color.WHITE.withAlpha(x);
    }

    if (type === 'red') {
      viewer.entities.add({
        position: Cartesian3.fromDegrees(point[0], point[1]),
        ellipse: {
          semiMinorAxis: new CallbackProperty(changeR1(), false),
          semiMajorAxis: new CallbackProperty(changeR1(), false),
          material: new ImageMaterialProperty({
            image: '/redcircle.png',
            repeat: new Cartesian2(1.0, 1.0),
            transparent: true,
            color: new CallbackProperty(color, false)
          }),
          outlineColor: Color.RED
        }
      });
    }else if (type === 'green') {
      viewer.entities.add({
        position: Cartesian3.fromDegrees(point[0], point[1]),
        ellipse: {
          semiMinorAxis: new CallbackProperty(changeR1(), false),
          semiMajorAxis: new CallbackProperty(changeR1(), false),
          material: new ImageMaterialProperty({
            image: '/greencircle.png',
            repeat: new Cartesian2(1.0, 1.0),
            transparent: true,
            color: new CallbackProperty(color, false)
          }),
          outlineColor: Color.GREEN
        }
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const turningStat = function () {
    const viewer = viewerRef.value
    if (!viewer) {
      return
    }

    const stationList = [
      {
        position: [122.456346, 30.718493],
        destination: [-3070388.1790400655, 4787463.782178679, 3217612.9139340436],
        orientation: {
          heading: 6.015189431996281,
          pitch: -0.9727925734020664,
          roll: 6.28314870348159,
        },
      },
      {
        position: [121.961961, 27.357407],
        destination: [-3109824.273467356, 4969926.650282877, 2903644.6534169177],
        orientation: {
          heading: 6.015176098689406,
          pitch: -0.9728256475785573,
          roll: 6.283164836311119,
        },
      },
      {
        position: [120.346971, 27.834493],
        destination: [-2993524.031225894, 5055231.1600088095, 2948540.366229247],
        orientation: {
          heading: 6.015179979787709,
          pitch: -0.9728160206704874,
          roll: 6.283160140357066,
        },
      },
      {
        position: [122.709031, 29.883787],
        destination: [-3251245.7360828877, 5020201.466525553, 3119392.753582092],
        orientation: {
          heading: 6.015209998284338,
          pitch: -0.9727415493252165,
          roll: 6.283123818287831,
        },
      },
      {
        position: [122.335496, 29.559393],
        destination: [-3134635.807790987, 4894350.7310296, 3094257.0729669672],
        orientation: {
          heading: 6.015180104500555,
          pitch: -0.972815711319551,
          roll: 6.283159989459612,
        },
      },
      {
        position: [121.570573, 28.094063],
        destination: [-3140253.7611503447, 5130915.004756578, 2963105.0845069643],
        orientation: {
          heading: 6.015179605266244,
          pitch: -0.972816949670988,
          roll: 6.2831605935125205,
        },
      },
      {
        position: [119.323869, 29.354621],
        destination: [-2917893.3424463463, 5072327.670093378, 3057900.090681321],
        orientation: {
          heading: 6.015201377786225,
          pitch: -0.9727629375919764,
          roll: 6.283134249189639,
        },
      },
      {
        position: [118.700395, 27.640929],
        destination: [-2897855.559787853, 5183930.808535264, 2933455.6400149157],
        orientation: {
          heading: 6.0151437465866575,
          pitch: -0.9729058822259145,
          roll: 0.00001867252078113779,
        },
      },
      {
        position: [118.843217, 26.370927],
        destination: [-2980887.330287051, 5292481.8148659365, 2764170.189297376],
        orientation: {
          heading: 6.015123729217997,
          pitch: -0.9729555141694619,
          roll: 0.00004289082302655345,
        },
      },
      {
        position: [119.057451, 25.665018],
        destination: [-2972898.973129501, 5241964.906712402, 2697725.1094626994],
        orientation: {
          heading: 6.015108068976102,
          pitch: -0.9729943364586018,
          roll: 0.00006183702193496288,
        },
      },
      {
        position: [119.057451, 25.665018],
        destination: [-3021671.405912864, 5061241.187608142, 2934407.395443582],
        orientation: {
          heading: 6.015172647839631,
          pitch: -0.9728342069824327,
          roll: 6.283169011658132,
        },
      },
    ]

    let index = 0

    return function () {

      if (index === stationList.length - 1) {
        index = 0
      }
      viewer.camera.flyTo({
        // 镜头的经纬度、高度。镜头默认情况下，在指定经纬高度俯视（pitch=-90）地球
        destination: new Cartesian3(
          // x: -2334554.2621502546, y: 5508038.885029052, z: 2356698.1743977778}
          ...stationList[index].destination
        ),
        orientation: {
          // 0.234695797831165 -1.2098597149776076 6.283091865723642
          heading: stationList[index].orientation.heading,
          pitch: stationList[index].orientation.pitch,
          roll: stationList[index].orientation.roll,
        },
      });

      index = index + 1
    }
  }

  return {
    renderParabolaLayer,
    turningStat
  }
}
