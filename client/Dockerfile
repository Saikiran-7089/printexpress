# Production Frontend Next.js Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install standard dependencies
RUN npm ci

# Copy client codebase
COPY . .

# Set Next.js env variables for production build
ENV NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NODE_ENV=production

# Build optimized Next.js application package
RUN npm run build

EXPOSE 3000

# Start Next.js server
CMD ["npm", "start"]
