FROM node:18-alpine
RUN apk add --no-cache curl openssl bash
RUN curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 && \
    chmod 700 get_helm.sh && ./get_helm.sh
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY ../charts /app/charts 
CMD ["node", "server.js"]