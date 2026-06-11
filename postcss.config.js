export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    "@minko-fe/postcss-pxtorem": {
      // 换算基数， 默认100  ，这样的话把根标签的字体规定为1rem为50px,这样就可以从设计稿上量出多少个px直接在代码中写多上px了。
      rootValue: 16,
      // 允许REM单位增长到的十进制数字,小数点后保留的位数。
      unitPrecision: 5,
      // propList: ['*', '!font-size'],
      // 默认false，可以（reg）利用正则表达式排除某些文件夹的方法，例如/(node_module)/ 。如果想把前端UI框架内的px也转换成rem，请把此属性设为默认值
      // exclude: /(node_module)/,
      // 要忽略并保留为px的选择器
      // selectorBlackList: ['.radius'],
      // （布尔值）允许在媒体查询中转换px。
      // mediaQuery: false,
      // 设置要替换的最小像素值(3px会被转rem)。 默认 0
      // minPixelValue: 5
    }
  }
}
