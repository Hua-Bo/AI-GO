import { defineStore } from 'pinia'

export const useStore = defineStore('default', () => {
  const msg = ref('Hello World')

  return {
    msg,
  }
})
