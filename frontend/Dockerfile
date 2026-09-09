# Multi-stage build for Railway deployment
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_MOCK

# Set environment variables for the build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MOCK=$VITE_MOCK

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install serve package
RUN npm install -g serve

# Copy built application
COPY --from=builder /app/dist ./dist

# Built application is ready to serve

# Expose port (Railway sets PORT env var)
EXPOSE $PORT
