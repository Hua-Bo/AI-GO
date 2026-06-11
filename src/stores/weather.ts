import {defineStore} from 'pinia'

export const useWeatherStore = defineStore('weather', () => {
  const weather = ref('wind')
  const dragValue = ref([null,null])

  return {
    weather,
    dragValue
  }
})
