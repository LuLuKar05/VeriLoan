# VeriLoan Backend Development Startup Script
# Automatically starts MongoDB Docker and then the backend

Write-Host "🔄 Starting MongoDB Docker container..." -ForegroundColor Yellow

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# MongoDB container configuration
$CONTAINER_NAME = "veriloan-mongodb"
$MONGO_PORT = 27017

# Check if container exists
$containerExists = docker ps -a --format "{{.Names}}" | Select-String -Pattern "^$CONTAINER_NAME$" -Quiet

if ($containerExists) {
    # Container exists, check if it's running
    $containerRunning = docker ps --format "{{.Names}}" | Select-String -Pattern "^$CONTAINER_NAME$" -Quiet
    
    if ($containerRunning) {
        Write-Host "✅ MongoDB container is already running" -ForegroundColor Green
    } else {
        Write-Host "🔄 Starting existing MongoDB container..." -ForegroundColor Yellow
        docker start $CONTAINER_NAME
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MongoDB container started" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start MongoDB container" -ForegroundColor Red
            exit 1
        }
    }
} else {
    # Container doesn't exist, create and start it
    Write-Host "🔄 Creating new MongoDB container..." -ForegroundColor Yellow
    docker run -d `
        --name $CONTAINER_NAME `
        -p ${MONGO_PORT}:27017 `
        -v mongodb_veriloan_data:/data/db `
        mongo:latest
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB container created and started" -ForegroundColor Green
        Write-Host "   - Container name: $CONTAINER_NAME" -ForegroundColor Green
        Write-Host "   - Port: $MONGO_PORT" -ForegroundColor Green
        Write-Host "   - Volume: mongodb_veriloan_data" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create MongoDB container" -ForegroundColor Red
        exit 1
    }
}

# Wait a moment for MongoDB to be ready
Write-Host "⏳ Waiting for MongoDB to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Verify MongoDB is accessible
try {
    docker exec $CONTAINER_NAME mongosh --eval "db.version()" | Out-Null
    Write-Host "✅ MongoDB is ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️  MongoDB container is running but might need more time to initialize" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting VeriLoan Backend..." -ForegroundColor Green
Write-Host ""

# Start the backend with tsx watch
npx tsx watch src/index.ts
