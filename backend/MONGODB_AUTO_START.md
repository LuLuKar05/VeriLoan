# MongoDB Auto-Start Configuration

The backend now automatically starts MongoDB Docker when you run `npm run dev`!

## 🚀 Quick Start

Just run:
```bash
cd backend
npm run dev
```

**That's it!** The script will:
1. ✅ Check if Docker is running
2. ✅ Start MongoDB Docker container (or create if doesn't exist)
3. ✅ Wait for MongoDB to be ready
4. ✅ Start the backend server

---

## 📋 Available Commands

### Development Commands

```bash
# Start backend with auto MongoDB startup (recommended)
npm run dev

# Start backend directly (MongoDB must be running)
npm run dev:direct

# Build production version
npm run build

# Start production server
npm start
```

### MongoDB Management Commands

```bash
# Start MongoDB container
npm run mongodb:start

# Stop MongoDB container
npm run mongodb:stop

# View MongoDB logs
npm run mongodb:logs

# Open MongoDB shell
npm run mongodb:shell
```

---

## 🐳 Docker Container Details

The auto-start script creates/manages a MongoDB Docker container with:

- **Container Name:** `veriloan-mongodb`
- **Port:** `27017` (mapped to host)
- **Volume:** `mongodb_veriloan_data` (persistent data storage)
- **Image:** `mongo:latest`

---

## 📝 What Happens on `npm run dev`

```
🔄 Starting MongoDB Docker container...

Case 1: Container already running
  ✅ MongoDB container is already running
  🚀 Starting VeriLoan Backend...

Case 2: Container exists but stopped
  🔄 Starting existing MongoDB container...
  ✅ MongoDB container started
  ⏳ Waiting for MongoDB to be ready...
  ✅ MongoDB is ready
  🚀 Starting VeriLoan Backend...

Case 3: Container doesn't exist
  🔄 Creating new MongoDB container...
  ✅ MongoDB container created and started
     - Container name: veriloan-mongodb
     - Port: 27017
     - Volume: mongodb_veriloan_data
  ⏳ Waiting for MongoDB to be ready...
  ✅ MongoDB is ready
  🚀 Starting VeriLoan Backend...
```

---

## ⚠️ Prerequisites

### 1. Docker Must Be Installed and Running

**Windows/Mac:**
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Make sure Docker Desktop is running (check system tray icon)

**Linux:**
```bash
# Install Docker
sudo apt-get update
sudo apt-get install docker.io

# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect
```

### 2. Verify Docker is Working

```bash
docker --version
docker ps
```

---

## 🔧 Troubleshooting

### Error: "Docker is not running"

**Solution:**
- **Windows/Mac:** Start Docker Desktop application
- **Linux:** `sudo systemctl start docker`

### Error: "Failed to create MongoDB container"

**Possible causes:**
1. Port 27017 already in use
2. Docker daemon not running
3. Insufficient permissions

**Solutions:**
```bash
# Check if port 27017 is in use
# Windows
netstat -ano | findstr :27017

# Linux/Mac
lsof -i :27017

# If another MongoDB is running, stop it or change the port
```

### MongoDB Container Issues

```bash
# View container status
docker ps -a

# View MongoDB logs
npm run mongodb:logs

# Stop and remove container
docker stop veriloan-mongodb
docker rm veriloan-mongodb

# Remove volume (⚠️ deletes all data)
docker volume rm mongodb_veriloan_data

# Start fresh
npm run dev
```

### Backend Can't Connect to MongoDB

1. **Check if MongoDB is running:**
   ```bash
   docker ps
   ```

2. **Check MongoDB logs:**
   ```bash
   npm run mongodb:logs
   ```

3. **Test MongoDB connection:**
   ```bash
   npm run mongodb:shell
   # Then in mongosh:
   db.version()
   exit
   ```

4. **Check your `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=veriloan
   ```

---

## 🔄 Manual MongoDB Management

If you prefer to manage MongoDB manually:

### Start MongoDB
```bash
docker start veriloan-mongodb
```

### Stop MongoDB
```bash
docker stop veriloan-mongodb
```

### Remove MongoDB Container
```bash
docker stop veriloan-mongodb
docker rm veriloan-mongodb
```

### Access MongoDB Shell
```bash
docker exec -it veriloan-mongodb mongosh
```

### View Database Contents
```bash
docker exec -it veriloan-mongodb mongosh veriloan --eval "db.pairings.find().pretty()"
```

---

## 📊 Data Persistence

Your MongoDB data is stored in a Docker volume named `mongodb_veriloan_data`. This means:

✅ **Data persists** even if you:
- Stop the container
- Remove the container
- Restart your computer

⚠️ **Data is lost** only if you:
- Explicitly delete the volume: `docker volume rm mongodb_veriloan_data`

### View Volume Information
```bash
# List all volumes
docker volume ls

# Inspect volume
docker volume inspect mongodb_veriloan_data
```

---

## 🎯 Development Workflow

### Daily Development

```bash
# Start everything (MongoDB + Backend)
npm run dev

# Backend will auto-reload on file changes
# MongoDB stays running in the background
```

### When Done for the Day

```bash
# Press Ctrl+C to stop backend

# MongoDB keeps running (optional)
# To stop MongoDB:
npm run mongodb:stop
```

### Next Day

```bash
# Just run dev again
npm run dev

# MongoDB will auto-start if stopped
```

---

## 🔍 Advanced Usage

### Custom MongoDB Configuration

If you need custom MongoDB settings, edit `start-dev.js`:

```javascript
// Change port
const MONGO_PORT = 27018;

// Add authentication
const cmd = `docker run -d 
  --name ${CONTAINER_NAME} 
  -p ${MONGO_PORT}:27017 
  -e MONGO_INITDB_ROOT_USERNAME=admin 
  -e MONGO_INITDB_ROOT_PASSWORD=password 
  -v ${VOLUME_NAME}:/data/db 
  mongo:latest`;
```

Then update your `.env`:
```env
MONGODB_URI=mongodb://admin:password@localhost:27018
```

---

## 📚 Additional Resources

- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check Docker is running: `docker ps`
2. View MongoDB logs: `npm run mongodb:logs`
3. Test MongoDB: `npm run mongodb:shell`
4. Check backend logs for connection errors

---

## ✨ Summary

- ✅ `npm run dev` → Auto-starts MongoDB + Backend
- ✅ Data persists across restarts
- ✅ No manual Docker commands needed
- ✅ Works on Windows, Mac, and Linux
- ✅ Easy MongoDB management with npm scripts

**Happy coding!** 🚀
