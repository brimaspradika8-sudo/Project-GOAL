FROM node:20-alpine AS builder

ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx expo export --platform web


FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]