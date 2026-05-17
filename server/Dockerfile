# Production Backend Dockerfile
FROM node:18-alpine

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

# Start server
CMD ["npm", "start"]
