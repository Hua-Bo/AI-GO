import html2canvas from 'html2canvas'

// 图片下载
export const downloadImg = (url: string, title = 'img') => {
  const x = new XMLHttpRequest()
  x.open('GET', url, true)
  x.responseType = 'blob'
  x.onload = function () {
    const url = window.URL.createObjectURL(x.response)
    const a = document.createElement('a')
    a.href = url
    a.download = title
    a.click()
  }
  x.send()
}

// Dom -> Png
export const downloadDom = (dom: HTMLElement, name = 'file', options?: any) => {
  if (dom) {
    html2canvas(dom, options).then((canvas) => {
      const base64 = canvas.toDataURL('image/png')
      const myBlob = dataURLtoBlob(base64)
      const myUrl = URL.createObjectURL(myBlob)
      
      downloadFile(myUrl, name)
    })
  }
}

const dataURLtoBlob = (dataurl: string) => {
  const arr: any[] = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)

  return new Blob([u8arr], { type: mime })
}

const downloadFile = (url: string, name: string) => {
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', name)
  a.setAttribute('target', '_blank')
  const clickEvent = document.createEvent('MouseEvents')
  clickEvent.initEvent('click', true, true)
  a.dispatchEvent(clickEvent)
}
