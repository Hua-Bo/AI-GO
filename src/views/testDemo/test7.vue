<template>
    <div class="home">
      <img id="img1" alt="Vue logo" src="@/assets/区域风空间分布图.png" style="width: 400px" />
      <img id="img2" alt="Vue logo" src="@/assets/浪玫瑰图.png" style="width: 400px" />
      <button @click="toGif">导出</button>
      <div v-if="gifImage">
        <img :src="gifImage" alt="Generated GIF" style="width: 400px" />
        <a :href="gifImage" download="generated.gif">下载 GIF</a>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import gifshot from 'gifshot'
  
  // 使用 `import` 语法引入图片
  import img1 from '@/assets/区域风空间分布图.png'
  import img2 from '@/assets/浪玫瑰图.png'
  
  const images = [img1, img2]
  const gifImage = ref(null)
  
  const toGif = () => {
    gifshot.createGIF(
      {
        images: images,
        interval: 0.5, // 增加每帧的时间间隔，单位是秒
        gifWidth: 800,  // 设置输出 GIF 的宽度
        gifHeight: 600, // 设置输出 GIF 的高度
      },
      (obj) => {
        if (!obj.error) {
          console.log(obj.image);
          gifImage.value = obj.image;
        }
      },
    )
  }

  
  </script>