FROM node:20-slim

WORKDIR /app

COPY server/package*.json ./
RUN npm install --omit=dev

COPY server/ .

CMD ["node", "index.js"]
