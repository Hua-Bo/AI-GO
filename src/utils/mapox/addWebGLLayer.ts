// src/utils/mapbox/addWebGLLayer.ts
import mapboxgl from 'mapbox-gl'

export interface WebGLLayerOptions {
  id?: string
  image: HTMLImageElement
  colorStops: [number, string][]
  bounds: [[number, number], [number, number]] // [[minLng, minLat], [maxLng, maxLat]]
}

export function getColorRamp(colors: [number, string][]) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 256, 1)

  colors.forEach(([offset, color]) => {
    gradient.addColorStop(offset / 255, color)
  })
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 1)

  return {
    canvas,
    data: ctx.getImageData(0, 0, 256, 1).data,
  }
}

export function addWebGLLayer(map: mapboxgl.Map, options: WebGLLayerOptions) {
  const { image, colorStops, bounds, id = 'custom-layer' } = options
  const colorRamp = getColorRamp(colorStops)

  const layer = {
    id,
    type: 'custom',
    renderingMode: '2d',
    onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
      const vertexSource = `
        uniform mat4 u_matrix;
        attribute vec2 a_pos;
        attribute vec2 textureCoordinates;
        varying vec2 v_textureCoordinates;
        void main() {
          gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
          v_textureCoordinates = textureCoordinates;
        }
      `
      const fragmentSource = `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform sampler2D u_color;
        varying vec2 v_textureCoordinates;
        void main() {
          vec4 texColor = texture2D(u_texture, vec2(v_textureCoordinates.x, 1.0 - v_textureCoordinates.y));
          float f = texColor.r == 0.0 ? 0.0 : 1.0;
          vec4 color = texture2D(u_color, vec2(texColor.r, 0.5)) * f;
          gl_FragColor = color;
        }
      `

      function compileShader(type: number, source: string) {
        const shader = gl.createShader(type)!
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        return shader
      }

      const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource)
      const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource)
      const program = gl.createProgram()!
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)

      const aPos = gl.getAttribLocation(program, 'a_pos')
      const texCoord = gl.getAttribLocation(program, 'textureCoordinates')
      const uTexture = gl.getUniformLocation(program, 'u_texture')
      const uColor = gl.getUniformLocation(program, 'u_color')

      const [minLngLat, maxLngLat] = bounds
      const ld = mapboxgl.MercatorCoordinate.fromLngLat({ lng: minLngLat[0], lat: minLngLat[1] })
      const rd = mapboxgl.MercatorCoordinate.fromLngLat({ lng: maxLngLat[0], lat: minLngLat[1] })
      const lu = mapboxgl.MercatorCoordinate.fromLngLat({ lng: minLngLat[0], lat: maxLngLat[1] })
      const ru = mapboxgl.MercatorCoordinate.fromLngLat({ lng: maxLngLat[0], lat: maxLngLat[1] })

      const vertexBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        ld.x, ld.y,
        rd.x, rd.y,
        lu.x, lu.y,
        ru.x, ru.y,
      ]), gl.STATIC_DRAW)

      const coordBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        1, 1,
      ]), gl.STATIC_DRAW)

      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

      const colorTex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, colorTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, colorRamp.canvas)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

      this.render = function (gl: WebGLRenderingContext, matrix: number[]) {
        gl.useProgram(program)
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_matrix'), false, matrix)

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
        gl.enableVertexAttribArray(aPos)
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer)
        gl.enableVertexAttribArray(texCoord)
        gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 0, 0)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.uniform1i(uTexture, 0)

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, colorTex)
        gl.uniform1i(uColor, 1)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
    },

    render: () => {} // 会在 onAdd 中被覆盖
  }

  map.addLayer(layer as any)
}