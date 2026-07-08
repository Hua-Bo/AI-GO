import path from 'node:path'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import lightningcss from 'vite-plugin-lightningcss'
// import checker from 'vite-plugin-checker'
import VueDevTools from 'vite-plugin-vue-devtools'
import cesiumjs from 'vite-plugin-cesiumjs';
import Markdown from 'vite-plugin-md';
import vueJsx from '@vitejs/plugin-vue-jsx'

const repoName = process.env.GITHUB_REPOSITORY
  ? process.env.GITHUB_REPOSITORY.split('/')[1]
  : ''

export default defineConfig({
  base: process.env.GITHUB_ACTIONS && repoName
    ? `/${repoName}/`
    : './',
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/],  // 让 Vue 识别 .md 文件
    }),
    vueJsx(),
    Markdown(),  // 添加 Markdown 支持
    cesiumjs(),
    // checker({
    //   typescript: true,
    //   eslint: {
    //     lintCommand: 'eslint "./src/**/*.{vue,ts}"',
    //   },
    // }),
    Components({
      dts: 'src/components.d.ts',
      resolvers: [ElementPlusResolver()],
      version: 3,
      types: [
        {
          from: 'vue-router',
          names: ['RouterLink', 'RouterView'],
        },
      ],
    }),
    AutoImport({
      dts: 'src/auto-imports.d.ts',
      imports: ['vue', 'vue-router', 'vue-i18n'],
      dirs: ['src/apis/*', 'src/composables/*', 'src/stores/*', 'src/utils/*'],
      resolvers: [ElementPlusResolver()],
      eslintrc: {
        enabled: true,
        globalsPropValue: 'readonly',
      },
    }),
    // TODO: 如果后续Vite支持lightningcss作为css引擎变为稳定版本，需要更改一套写法，目前css引擎还是基于postcss，该插件只能优化bundle
    lightningcss({
      browserslist: '>= 0.25%',
      minify: true,
      drafts: {
        nesting: true,
      },
      nonStandard: {
        deepSelectorCombinator: true,
      },
    }),
    VueDevTools(),
  ],
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
  optimizeDeps: {
    include: ['leaflet', 'proj4', 'proj4leaflet'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/geoserver': {
        target: 'http://192.168.1.17:8081',
        changeOrigin: true,
      },
      '/ncwms2': {
        // 公网 ncWMS：路径必须是大写 ncWMS2，小写 /ncwms2 会 404
        target: 'http://58.215.121.62:8984',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ncwms2/i, '/ncWMS2'),
      },
      '/api/longcat': {
        target: 'https://api.longcat.chat',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/longcat/, ''),
      },
    },
  },
})
