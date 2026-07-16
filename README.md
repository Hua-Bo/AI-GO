# 地图类前端工程模板

## 目录
```
├── public
    └── ...         公共资源
├── src
    └── assets      静态资源
    └── components  组件（复用组件）
    └── composables 组合（复用有状态逻辑）
    └── modules     模块（注册插件）
    └── routers      路由配置
    └── stores       状态管理
    └── utils       工具（复用无状态逻辑）
    └── views       视图
├── build.sh        容器部署脚本
├── Dockerfile      docker配置
├── nginx.conf      niginx配置
```

## 编码规范
参考阿里巴巴
https://github.com/alibaba/f2e-spec/blob/main/docs/coding/3.javascript-style-guide.md

## 特性

- ⚡️ [Vue 3](https://cn.vuejs.org/guide/introduction.html), [Vite](https://cn.vitejs.dev/guide/why.html), [pnpm](https://pnpm.io/zh/motivation), [esbuild](https://esbuild.github.io/) - 就是快！
- 📦 [组件自动化加载](https://github.com/unplugin/unplugin-vue-components)
- 🍍 [使用 Pinia 的状态管理](https://pinia.vuejs.org/zh/introduction.html)
- 🎨 [Tailwindcss](https://github.com/unocss/unocss) - 快速构建现代网站，而不离开你的 HTML
- ⚡️ [Lightningcss](https://lightningcss.dev/docs.html) - 一个非常快非常小的 CSS 解析器、转换器、打包器。
- 😃 Element Plus Icon
- 🔥 使用 [新的 `<script setup>` 语法](https://cn.vuejs.org/api/sfc-script-setup.html)
- 📥 [API 自动加载](https://github.com/unplugin/unplugin-auto-import) - 直接使用 Composition API 无需引入
- 🦾 TypeScript

## 预配置

### UI 框架

- [Element Plus](https://element-plus.org/zh-CN/component/button.html) - 基于 Vue 3，面向设计师和开发者的组件库
- [Tailwindcss](https://tailwindcss.com/docs/installation) - 快速构建现代网站，而不离开你的 HTML

### Icons

- Element Plus Icon

### 插件

- [Vue Router](https://github.com/vuejs/router)
- [Pinia](https://pinia.vuejs.org/zh/introduction.html) - 直接的, 类型安全的, 使用 Composition API 的轻便灵活的 Vue 状态管理
- [`unplugin-vue-components`](https://github.com/unplugin/unplugin-vue-components) - 自动加载组件
- [`unplugin-auto-import`](https://github.com/unplugin/unplugin-auto-import) - 直接使用 Composition API 等，无需导入
- [`vite-plugin-lightningcss`](https://lightningcss.dev/docs.html) - 通过 lightningcss 支持嵌套 CSS 草案，最小化 CSS
- [`vite-plugin-vue-devtools`](https://github.com/webfansplz/vite-plugin-vue-devtools) - 旨在增强 Vue 开发者体验的 Vite 插件
- [`vite-plugin-checker`](https://vite-plugin-checker.netlify.app/introduction/introduction.html) - 可以在工作线程中运行TypeScript、VLS、vue-tsc、ESLint、Stylelint，为Vite添加类型检查和检测支持

### 编码风格

- 使用 Composition API [`<script setup>` SFC 语法](https://cn.vuejs.org/api/sfc-script-setup.html)
- [ESLint](https://eslint.org/) 配置为 [eslint-config-alloy](https://github.com/AlloyTeam/eslint-config-alloy)
- [Prettier](https://prettier.io/docs/en/) 配置为 [eslint-config-alloy/.prettierrc.js](https://github.com/AlloyTeam/eslint-config-alloy)

### 开发工具

- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.js.org/) - 快, 节省磁盘空间的包管理器
- [critters](https://github.com/GoogleChromeLabs/critters) - 关键 CSS 生成器
- [Netlify](https://www.netlify.com/) - 零配置的部署
- [VS Code 扩展](./.vscode/extensions.json)
  - [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) - Vue 3 `<script setup>` IDE 支持
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?esbenp.prettier-vscode)
  - [TailWind CSS IntelliSense](https://marketplace.visualstudio.com/items?bradlc.vscode-tailwindcss)

## 开始运行

> 需要 Node.js 16+。然而，有些模板需要依赖更高的 Node 版本才能正常运行，当你的包管理器发出警告时，请注意升级你的 Node 版本。

**npm**

```
npx degit https://gitee.com/wuxi_jiufang/gis-map-project-template my-app
cd my-app
npm i
```

**pnpm**

```
pnpm dlx degit https://gitee.com/wuxi_jiufang/gis-map-project-template my-app
cd my-app
pnpm i
```

由于该项目集成了`lightningcss`，我们可以不借助任何其他 CSS 预处理器而使用[CSS Nesting](https://drafts.csswg.org/css-nesting/)这一项草案了！`lightningcss`最后会编译成目前现有的浏览器所支持的语法。

```css
.a {
  .b {
    padding-left: 2rem;
    padding-right: 2rem;
    padding-bottom: 4rem;
    padding-top: 4rem;
  }
}
```

将编译为：

```css
.a .b {
  padding: 4rem 2rem;
}
```

### 自动导入

项目默认配置`src/apis`、`src/composables`、`src/stores`，`src/utils`作为默认导入，也就是说这些目录下都会通过`unplugin-auto-import`自动导入，为了避免变量名称重复，请确保每个变量前都使用了前缀。如果你不想使用该特性，可以在`vite.config.ts`进行关闭。

```ts
AutoImport({
  dts: 'src/auto-imports.d.ts',
  imports: ['vue', 'vue-router', 'vue-i18n'],
  dirs: ['src/apis/*', 'src/composables/*', 'src/stores/*', 'src/utils/*'], // 去掉这一行！
  resolvers: [ElementPlusResolver()],
  eslintrc: {
    enabled: true,
    globalsPropValue: 'readonly',
  },
})
```



## AI 农业种植助手

详见 [docs/agri-assistant.md](./docs/agri-assistant.md)

本地访问：`http://localhost:5173/#/agri-assistant`
