import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { registerIpcHandlers } from './ipc/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  console.log('Current NODE_ENV:', process.env.NODE_ENV);
  console.log('__dirname:', __dirname);
  console.log('app.isPackaged:', app.isPackaged);
  
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    const indexPath = join(__dirname, '../renderer/index.html');
    console.log('Loading file:', indexPath);
    console.log('File exists:', existsSync(indexPath));
    console.log('__dirname:', __dirname);
    
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load file:', err);
    });
  }
}

app.whenReady().then(() => {
  // Register IPC handlers
  // We need a base directory for config. In dev, it might be project root. In prod, userData.
  // For now let's use app.getPath('userData') for config storage, or process.cwd() as per previous implementation logic?
  // ConfigService used `baseDir`.
  // Let's use `process.cwd()` for dev ease, or `app.getPath('userData')` for production correctness.
  // The prompt implies we are building a tool that manages local files.
  // Previous `ConfigService` used `baseDir`. `PlatformService` used `baseDir/config/platforms`.
  // If we run from source, `process.cwd()` is project root.
  // Let's use `process.cwd()` for now to match `ConfigService` expectation in tests, or `app.getPath('userData')`.
  // Wait, `ConfigService` tests used a mock base dir.
  // In `main.ts`, we should determine the base dir.
  // Let's use `app.getPath('userData')` so it persists across runs properly in installed app.
  // BUT for `presets`, they are in `resources/presets`. `ConfigService` looks at `process.cwd()/resources/presets`.
  // This might break in prod if `process.cwd()` is not where resources are.
  // In prod, resources are in `process.resourcesPath`.
  // Let's stick to `process.cwd()` for now as it seems to be the assumption, or improve it later.
  // Actually, let's use `app.getPath('userData')` for USER DATA (config, rules), and handle presets separately if needed.
  // Check `ConfigService`: `this.configDir = path.join(baseDir, 'config');`
  // And `getPresets`: `path.join(process.cwd(), 'resources', 'presets')`.
  // So `baseDir` is for user references.
  
  registerIpcHandlers(app.getPath('userData'));
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
