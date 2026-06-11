const baseSize = 16

function setRem() {
  const scale = document.documentElement.clientWidth / 1920
  document.documentElement.style.fontSize = `${baseSize * Math.min(scale, 1)}px`
}

setRem()

window.onresize = () => {
  setRem()
}

// function px2rem(px: string) {
//   if (/%/gi.test(px)) {
//     return px
//   } else {
//     return parseFloat(px) / 192 + 'rem'
//   }
// }
