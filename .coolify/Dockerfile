# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Copy package files first for better layer caching
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies without frozen lockfile
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build the app with explicit base path
RUN VITE_BASE_URL="/" pnpm build

# Production stage with Nginx
FROM nginx:alpine

# Copy nginx config
COPY .coolify/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create a simple healthcheck page
RUN echo "OK" > /usr/share/nginx/html/health

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
