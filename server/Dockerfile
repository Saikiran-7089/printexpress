# Production Backend Dockerfile
FROM node:18-slim

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install standard dependencies
RUN npm ci

# Copy server codebase and prisma schema
COPY . .

# Generate Prisma Client code mapping
RUN npx prisma generate

EXPOSE 5000

# Run migrations and then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
