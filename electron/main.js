const { app, BrowserWindow, Notification, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess;

const isDev = process.env.NODE_ENV === 'development';
const BACKEND_PORT = 5069;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

function getBackendExePath() {
  if (isDev) return null; // dev modda backend ayrı çalışır
  // Packaged app: backend exe resources klasöründe
  const resourcesPath = process.resourcesPath;
  return path.join(resourcesPath, 'backend', 'Ajandam.API.exe');
}

function startBackend() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      resolve(); // dev modda backend zaten çalışıyor varsayılır
      return;
    }

    const exePath = getBackendExePath();
    console.log('Starting backend:', exePath);

    backendProcess = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      env: {
        ...process.env,
        ASPNETCORE_ENVIRONMENT: 'Production',
        ASPNETCORE_URLS: BACKEND_URL,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend] ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data}`);
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });

    backendProcess.on('exit', (code) => {
      console.log(`Backend exited with code ${code}`);
      backendProcess = null;
    });

    // Wait for backend to be ready
    waitForBackend(30000)
      .then(resolve)
      .catch(reject);
  });
}

function waitForBackend(timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error('Backend startup timeout'));
        return;
      }

      http.get(`${BACKEND_URL}/api/auth/profile`, (res) => {
        // Any response means the server is up (even 401)
        resolve();
      }).on('error', () => {
        setTimeout(check, 500);
      });
    };
    check();
  });
}

function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend...');
    backendProcess.kill('SIGTERM');
    // Force kill after 5 seconds
    setTimeout(() => {
      if (backendProcess) {
        backendProcess.kill('SIGKILL');
        backendProcess = null;
      }
    }, 5000);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Ajandam',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: true,
    backgroundColor: '#f9fafb',
    show: false, // Show after loaded
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from backend server (which serves React build)
    mainWindow.loadURL(BACKEND_URL);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (err) {
    dialog.showErrorBox(
      'Ajandam Başlatılamadı',
      `Backend sunucusu başlatılamadı:\n${err.message}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Desktop notification support
function showNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
}

module.exports = { showNotification };
