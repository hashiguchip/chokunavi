FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
RUN npm ci
COPY apps/web/ ./apps/web/
CMD ["npm", "run", "dev", "-w", "apps/web"]
