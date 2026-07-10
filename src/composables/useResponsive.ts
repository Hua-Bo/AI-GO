import { onMounted, onUnmounted, ref } from 'vue'

const MOBILE_MAX = 767

export function useResponsive(breakpoint = MOBILE_MAX) {
  const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false)
  const isTablet = ref(false)

  const update = () => {
    const w = window.innerWidth
    isMobile.value = w <= breakpoint
    isTablet.value = w > breakpoint && w <= 1024
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { isMobile, isTablet }
}
