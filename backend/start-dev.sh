#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Starting MongoDB Docker container...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# MongoDB container name
CONTAINER_NAME="veriloan-mongodb"
MONGO_PORT=27017

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    # Container exists, check if it's running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${GREEN}✅ MongoDB container is already running${NC}"
    else
        echo -e "${YELLOW}🔄 Starting existing MongoDB container...${NC}"
        docker start ${CONTAINER_NAME}
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ MongoDB container started${NC}"
        else
            echo -e "${RED}❌ Failed to start MongoDB container${NC}"
            exit 1
        fi
    fi
else
    # Container doesn't exist, create and start it
    echo -e "${YELLOW}🔄 Creating new MongoDB container...${NC}"
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${MONGO_PORT}:27017 \
        -v mongodb_veriloan_data:/data/db \
        mongo:latest
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ MongoDB container created and started${NC}"
        echo -e "${GREEN}   - Container name: ${CONTAINER_NAME}${NC}"
        echo -e "${GREEN}   - Port: ${MONGO_PORT}${NC}"
        echo -e "${GREEN}   - Volume: mongodb_veriloan_data${NC}"
    else
        echo -e "${RED}❌ Failed to create MongoDB container${NC}"
        exit 1
    fi
fi

# Wait a moment for MongoDB to be ready
echo -e "${YELLOW}⏳ Waiting for MongoDB to be ready...${NC}"
sleep 2

# Verify MongoDB is accessible
if docker exec ${CONTAINER_NAME} mongosh --eval "db.version()" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB is ready${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB container is running but might need more time to initialize${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Starting VeriLoan Backend...${NC}"
echo ""

# Start the backend with tsx watch
tsx watch src/index.ts
