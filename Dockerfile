FROM node:20-slim
WORKDIR /app
# sharp + onnxruntime-node need these at runtime
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
