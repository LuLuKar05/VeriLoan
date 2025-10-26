#!/usr/bin/env node

/**
 * VeriLoan Backend Development Startup Script
 * Automatically starts MongoDB Docker and then the backend
 */

import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

const log = {
    info: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}${msg}${colors.reset}`),
};

// MongoDB container configuration
const CONTAINER_NAME = 'veriloan-mongodb';
const MONGO_PORT = 27017;
const VOLUME_NAME = 'mongodb_veriloan_data';

/**
 * Check if Docker is running
 */
function isDockerRunning() {
    try {
        execSync('docker info', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Check if port is in use by another container
 */
function checkPortConflict() {
    try {
        const result = execSync(`docker ps --format "{{.Names}} {{.Ports}}"`, { encoding: 'utf8' });
        const lines = result.split('\n').filter(line => line.trim());

        for (const line of lines) {
            if (line.includes(`:${MONGO_PORT}->`) && !line.startsWith(CONTAINER_NAME)) {
                const containerName = line.split(' ')[0];
                return containerName;
            }
        }
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Check if container exists
 */
function containerExists() {
    try {
        const result = execSync(`docker ps -a --format "{{.Names}}"`, { encoding: 'utf8' });
        return result.split('\n').includes(CONTAINER_NAME);
    } catch (error) {
        return false;
    }
}

/**
 * Check if container is running
 */
function isContainerRunning() {
    try {
        const result = execSync(`docker ps --format "{{.Names}}"`, { encoding: 'utf8' });
        return result.split('\n').includes(CONTAINER_NAME);
    } catch (error) {
        return false;
    }
}

/**
 * Start existing container
 */
function startContainer() {
    try {
        execSync(`docker start ${CONTAINER_NAME}`, { stdio: 'inherit' });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Create and start new container
 */
function createContainer() {
    try {
        // First, check if there's a port conflict
        const conflictingContainer = checkPortConflict();
        if (conflictingContainer) {
            log.error(`❌ Port ${MONGO_PORT} is already in use by container: ${conflictingContainer}`);
            log.warning(`\n💡 To fix this, run one of these commands:`);
            log.warning(`   1. Stop the conflicting container: docker stop ${conflictingContainer}`);
            log.warning(`   2. Remove it if not needed: docker rm ${conflictingContainer}`);
            log.warning(`   3. Or use that container instead by renaming it: docker rename ${conflictingContainer} ${CONTAINER_NAME}`);
            return false;
        }

        const cmd = `docker run -d --name ${CONTAINER_NAME} -p ${MONGO_PORT}:27017 -v ${VOLUME_NAME}:/data/db mongo:latest`;
        execSync(cmd, { stdio: 'inherit' });
        return true;
    } catch (error) {
        log.error(`❌ Failed to create container: ${error.message}`);
        return false;
    }
}

/**
 * Wait for MongoDB to be ready
 */
async function waitForMongoDB() {
    log.warning('⏳ Waiting for MongoDB to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        execSync(`docker exec ${CONTAINER_NAME} mongosh --eval "db.version()"`, { stdio: 'ignore' });
        log.success('✅ MongoDB is ready');
        return true;
    } catch (error) {
        log.warning('⚠️  MongoDB container is running but might need more time to initialize');
        return true;
    }
}

/**
 * Start the backend server
 */
function startBackend() {
    log.info('');
    log.success('🚀 Starting VeriLoan Backend...');
    log.info('');

    // Use tsx watch to start the backend
    const backend = spawn('npx', ['tsx', 'watch', 'src/index.ts'], {
        stdio: 'inherit',
        shell: false,
    });

    backend.on('error', (error) => {
        log.error(`❌ Failed to start backend: ${error.message}`);
        process.exit(1);
    });

    backend.on('close', (code) => {
        if (code !== 0) {
            log.error(`❌ Backend exited with code ${code}`);
            process.exit(code);
        }
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
        log.warning('\n🛑 Shutting down backend...');
        backend.kill('SIGINT');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        log.warning('\n🛑 Shutting down backend...');
        backend.kill('SIGTERM');
        process.exit(0);
    });
}

/**
 * Main execution
 */
async function main() {
    log.warning('🔄 Starting MongoDB Docker container...');

    // Check if Docker is running
    if (!isDockerRunning()) {
        log.error('❌ Docker is not running. Please start Docker first.');
        log.info('   • Windows/Mac: Start Docker Desktop');
        log.info('   • Linux: sudo systemctl start docker');
        process.exit(1);
    }

    // Check for port conflicts first
    const conflictingContainer = checkPortConflict();
    if (conflictingContainer && !containerExists()) {
        log.error(`❌ Port ${MONGO_PORT} is already in use by container: ${conflictingContainer}`);
        log.warning(`\n💡 Options to fix this:`);
        log.warning(`   1. Use the existing container: docker rename ${conflictingContainer} ${CONTAINER_NAME}`);
        log.warning(`   2. Stop it: docker stop ${conflictingContainer}`);
        log.warning(`   3. Remove it: docker stop ${conflictingContainer} && docker rm ${conflictingContainer}`);
        log.warning(`\nThen run 'npm run dev' again.`);
        process.exit(1);
    }

    // Check if container exists
    if (containerExists()) {
        // Container exists, check if it's running
        if (isContainerRunning()) {
            log.success('✅ MongoDB container is already running');
        } else {
            log.warning('🔄 Starting existing MongoDB container...');
            if (startContainer()) {
                log.success('✅ MongoDB container started');
            } else {
                log.error('❌ Failed to start MongoDB container');
                process.exit(1);
            }
        }
    } else {
        // Container doesn't exist, create and start it
        log.warning('🔄 Creating new MongoDB container...');
        if (createContainer()) {
            log.success('✅ MongoDB container created and started');
            log.success(`   - Container name: ${CONTAINER_NAME}`);
            log.success(`   - Port: ${MONGO_PORT}`);
            log.success(`   - Volume: ${VOLUME_NAME}`);
        } else {
            log.error('❌ Failed to create MongoDB container');
            process.exit(1);
        }
    }

    // Wait for MongoDB to be ready
    await waitForMongoDB();

    // Start the backend
    startBackend();
}

// Run the script
main().catch((error) => {
    log.error(`❌ Error: ${error.message}`);
    process.exit(1);
});
