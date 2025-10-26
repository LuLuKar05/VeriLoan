# ✅ MongoDB Auto-Start Setup Complete!

## What Changed

Your `npm run dev` command now **automatically starts MongoDB Docker** before launching the backend!

---

## 🚀 How to Use

### Simple Command
```bash
cd backend
npm run dev
```

**That's it!** The script will:
1. ✅ Check if Docker is running
2. ✅ Start MongoDB Docker container (or create if needed)
3. ✅ Wait for MongoDB to be ready
4. ✅ Start your backend server

---

## 📁 Files Created

1. **`start-dev.js`** - Cross-platform Node.js startup script
2. **`start-dev.sh`** - Bash script (Linux/Mac alternative)
3. **`start-dev.ps1`** - PowerShell script (Windows alternative)
4. **`MONGODB_AUTO_START.md`** - Comprehensive documentation

---

## 📋 Updated package.json

### New Scripts

```json
{
  "scripts": {
    "dev": "node start-dev.js",              // 🆕 Auto-starts MongoDB + Backend
    "dev:direct": "tsx watch src/index.ts",   // Direct start (manual MongoDB)
    "mongodb:start": "...",                   // Start MongoDB only
    "mongodb:stop": "...",                    // Stop MongoDB
    "mongodb:logs": "...",                    // View logs
    "mongodb:shell": "..."                    // Open MongoDB shell
  }
}
```

---

## 🐳 MongoDB Container Details

- **Container Name:** `veriloan-mongodb`
- **Port:** `27017`
- **Volume:** `mongodb_veriloan_data` (persistent storage)
- **Image:** `mongo:latest`

---

## 💡 Usage Examples

### Start Development (MongoDB + Backend)
```bash
npm run dev
```

### MongoDB Management
```bash
# View MongoDB logs
npm run mongodb:logs

# Open MongoDB shell
npm run mongodb:shell

# Stop MongoDB
npm run mongodb:stop

# Start MongoDB
npm run mongodb:start
```

### Direct Backend Start (No MongoDB Auto-Start)
```bash
npm run dev:direct
```

---

## 📊 Expected Output

```
🔄 Starting MongoDB Docker container...
✅ MongoDB container is already running
⏳ Waiting for MongoDB to be ready...
✅ MongoDB is ready

🚀 Starting VeriLoan Backend...

🔄 Initializing MongoDB connection...
✅ MongoDB connected successfully
   Database: veriloan
   Collection: pairings

🚀 VeriLoan Backend running on http://localhost:8000
```

---

## ⚠️ Prerequisites

**Docker must be installed and running:**

- **Windows/Mac:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux:** `sudo apt-get install docker.io`

**Check Docker:**
```bash
docker --version
docker ps
```

---

## 🔧 Troubleshooting

### "Docker is not running"
- **Windows/Mac:** Start Docker Desktop
- **Linux:** `sudo systemctl start docker`

### Port 27017 Already in Use
```bash
# Check what's using the port
# Linux/Mac
lsof -i :27017

# Windows
netstat -ano | findstr :27017

# Stop conflicting MongoDB
```

### Container Issues
```bash
# View all containers
docker ps -a

# Remove old container
docker stop veriloan-mongodb
docker rm veriloan-mongodb

# Start fresh
npm run dev
```

---

## 🎯 Daily Workflow

### Morning
```bash
npm run dev
# MongoDB auto-starts + Backend starts
```

### During Development
- Backend auto-reloads on file changes
- MongoDB stays running

### Evening
```bash
# Press Ctrl+C to stop backend
# MongoDB keeps running (optional)

# To stop MongoDB:
npm run mongodb:stop
```

---

## 📚 Documentation

See **`MONGODB_AUTO_START.md`** for:
- Detailed troubleshooting
- Advanced configuration
- Manual MongoDB management
- Data persistence info

---

## ✨ Benefits

✅ **One Command:** `npm run dev` does everything  
✅ **No Manual Setup:** MongoDB starts automatically  
✅ **Data Persists:** Volume ensures data survival  
✅ **Cross-Platform:** Works on Windows, Mac, Linux  
✅ **Easy Management:** npm scripts for common tasks  

---

## 🆘 Need Help?

1. **Check Docker:** `docker ps`
2. **View Logs:** `npm run mongodb:logs`
3. **Test Connection:** `npm run mongodb:shell`
4. **Read Docs:** `MONGODB_AUTO_START.md`

---

## 🎉 You're All Set!

Just run:
```bash
cd backend
npm run dev
```

MongoDB will start automatically and your backend will launch! 🚀
