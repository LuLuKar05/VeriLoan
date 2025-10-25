# MongoDB Setup Guide for VeriLoan

This guide will help you set up MongoDB locally to store wallet pairings.

## Option 1: Install MongoDB Locally (Recommended for Development)

### Windows Installation

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows x64
   - Download the `.msi` installer

2. **Install MongoDB**
   - Run the installer
   - Choose "Complete" installation
   - **Important**: Check "Install MongoDB as a Service"
   - **Important**: Check "Install MongoDB Compass" (GUI tool)
   - Complete the installation

3. **Verify Installation**
   Open PowerShell and run:
   ```powershell
   mongod --version
   ```
   You should see the MongoDB version information.

4. **Start MongoDB Service**
   MongoDB should start automatically. To check:
   ```powershell
   Get-Service MongoDB
   ```
   
   If it's not running, start it:
   ```powershell
   Start-Service MongoDB
   ```

5. **Test Connection**
   ```powershell
   mongosh
   ```
   You should see the MongoDB shell. Type `exit` to quit.

## Option 2: Use MongoDB Atlas (Cloud - Free Tier Available)

1. Visit https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a free cluster
4. Get your connection string
5. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   DB_NAME=veriloan
   ```

## Option 3: Use Docker (If you have Docker installed)

```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Configuration

The backend is configured to connect to MongoDB at:
- **URI**: `mongodb://localhost:27017` (default)
- **Database**: `veriloan`
- **Collection**: `pairings`

These can be changed in `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=veriloan
```

## Verify Setup

1. Start MongoDB (if not running)
2. Start the backend:
   ```powershell
   cd backend
   npm run dev
   ```

3. You should see:
   ```
   🔄 Initializing MongoDB connection...
   ✅ MongoDB connected successfully
      Database: veriloan
      Collection: pairings
   ✅ Database initialized successfully
   ```

## MongoDB Compass (GUI Tool)

MongoDB Compass is a visual tool to view and manage your database:

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Browse to database: `veriloan`
4. View collection: `pairings`

You'll be able to see all wallet pairings stored in the database!

## Troubleshooting

### MongoDB Service Not Running
```powershell
# Check status
Get-Service MongoDB

# Start service
Start-Service MongoDB

# Restart service
Restart-Service MongoDB
```

### Connection Refused Error
- Make sure MongoDB service is running
- Check if port 27017 is available
- Verify MONGODB_URI in `.env` file

### Database Not Initialized
- The backend will automatically create the database and collection on first use
- Check backend console for error messages

## Data Persistence

- **Local MongoDB**: Data persists across server restarts
- **Docker**: Use volumes to persist data
  ```powershell
  docker run -d -p 27017:27017 -v mongodb_data:/data/db --name mongodb mongo:latest
  ```

## Useful Commands

### View all pairings via API
```powershell
curl http://localhost:3001/api/stats
```

### View specific pairing
```powershell
# By Concordium address
curl http://localhost:3001/api/pairing/YOUR_CONCORDIUM_ADDRESS

# By EVM address  
curl http://localhost:3001/api/pairing/0xYOUR_EVM_ADDRESS
```

### MongoDB Shell Commands
```javascript
// Connect to database
use veriloan

// View all pairings
db.pairings.find().pretty()

// Count pairings
db.pairings.count()

// Find by Concordium address
db.pairings.find({concordiumAddress: "YOUR_ADDRESS"})

// Delete all pairings (be careful!)
db.pairings.deleteMany({})
```

## Security Notes

For production:
1. Enable authentication in MongoDB
2. Use strong passwords
3. Configure network access restrictions
4. Use environment variables for credentials
5. Enable SSL/TLS connections
