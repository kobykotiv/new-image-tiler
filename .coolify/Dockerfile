FROM node:18-alpine AS build

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and lock files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with --no-frozen-lockfile to address CI issues
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the files
COPY . .

# Build the app
RUN pnpm build

# Serve with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY .coolify/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built app from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
