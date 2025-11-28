FROM node:alpine
WORKDIR /app
COPY package*.json .
RUN npm install
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . /app
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
#TODO: change to "npm run build" when adding nginx