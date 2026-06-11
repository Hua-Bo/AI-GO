# 声明镜像来源为node
FROM node:14.19 AS build
# 声明工作目录
WORKDIR /frontend
# 拷贝web项目到当前工作目录
COPY . .
RUN rm -rf /frontend/node_modules
# 安装依赖
# RUN npm i --registry=https://registry.npm.taobao.org
# RUN npm install -g pnpm
# RUN pnpm install
# 打包
# RUN pnpm build

FROM nginx

COPY --from=build /frontend/dist/ /usr/share/nginx/html/
COPY --from=build /frontend/nginx.conf /etc/nginx/nginx.conf
