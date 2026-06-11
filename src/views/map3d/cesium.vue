<script setup lang="ts">
import {Cartesian3} from "cesium";

const {initMap} = useCesium()

const golbalView = {
  destination: new Cartesian3(
      -348799.7885726379,
      12676398.436741129,
      6879319.478105708
  ),
  orientation: {
    heading: 0.35425981779954085,
    pitch: -1.5068271772653787,
    roll: 0.0168474505784193,
  },
}


onMounted(async () => {
  await initMap('map', golbalView)

  // 色斑图测试
  // let time = dayjs('2024-06-15')
  // await addColorMap(`http://cfdt.ninecosmos.cn/meteo-open/s01/${time.format('YYYY/MM/DD')}/003/wind-surface-4326.png`, Factor.Wind)
})

</script>

<template>
  <div id="map" class="w-full h-full"/>
</template>
