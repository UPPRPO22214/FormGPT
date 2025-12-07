FROM node:alpine as build-stage
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . /app
RUN npm run build

FROM nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]