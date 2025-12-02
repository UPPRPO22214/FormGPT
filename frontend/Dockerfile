FROM node:alpine as build-stage
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . /app
RUN npm run build

FROM nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]