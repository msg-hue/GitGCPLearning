# FROM node:18-alpine AS build
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm run build

# FROM nginx:alpine
# COPY --from=build /app/build /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 3000
# CMD ["nginx", "-g", "daemon off;"]

# --- Build Stage ---
    FROM node:18-alpine AS build

    WORKDIR /app
    
    # Install dependencies
    COPY package*.json ./
    RUN npm install
    
    # Copy source code and build
    COPY . .
    RUN npm run build
    
    # --- Final Stage (artifact only) ---
    FROM alpine:3.18
    
    WORKDIR /app
    
    # Copy build output
    COPY --from=build /app/build ./build
    
    # This container does NOT run a server.
    CMD ["sh"]