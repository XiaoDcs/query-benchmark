const { app, BrowserWindow, BrowserView, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');

let mainWindow;
let webView;
let selectedExcelFile = null; // 存储用户选择的Excel文件路径
let preloadCache = new Map(); // 预加载缓存

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  // Create BrowserView for web content
  webView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  mainWindow.setBrowserView(webView);
  
  // Position the BrowserView
  const setBounds = () => {
    const bounds = mainWindow.getBounds();
    
    // Updated calculation based on new CSS layout:
    // Body padding: 15px
    // Container padding: 15px  
    // Header height ≈ 24px (compressed)
    // Controls height ≈ 50px (compressed)
    // Progress bar ≈ 20px (compressed)
    // Total top offset ≈ 124px
    
    const webViewBounds = {
      x: 30,  // body(15) + container(15) 
      y: 124, // header + controls + progress + margins (reduced)
      width: Math.max(600, bounds.width - 350),  // full width - sidebar(320) - gaps(30)
      height: Math.max(500, bounds.height - 150) // full height - top offset - minimal bottom margin
    };
    
    console.log('Window bounds:', bounds);
    console.log('BrowserView bounds:', webViewBounds);
    
    webView.setBounds(webViewBounds);
  };
  
  setBounds();
  mainWindow.on('resize', setBounds);
  
  mainWindow.on('closed', function () {
    mainWindow = null;
    webView = null;
    preloadCache.clear();
  });
}

app.whenReady().then(() => {
  createWindow();
  
  // 注册全局快捷键
  registerGlobalShortcuts();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  // 取消注册所有全局快捷键
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

// 注册全局快捷键函数
function registerGlobalShortcuts() {
  // 上箭头键 - Pass
  globalShortcut.register('Up', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-shortcut', 'pass');
    }
  });
  
  // 下箭头键 - Fail
  globalShortcut.register('Down', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-shortcut', 'fail');
    }
  });
  
  // Ctrl+S - Save
  globalShortcut.register('CommandOrControl+S', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-shortcut', 'save');
    }
  });
  
  // F5 - Reload
  globalShortcut.register('F5', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-shortcut', 'reload');
    }
  });
  
  // 左箭头键 - Previous
  globalShortcut.register('Left', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-shortcut', 'previous');
    }
  });
  
  // 右箭头键 - Next
  globalShortcut.register('Right', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-shortcut', 'next');
    }
  });
  
  // Ctrl+1~9 - Tags
  for (let i = 1; i <= 9; i++) {
    globalShortcut.register(`CommandOrControl+${i}`, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-shortcut', 'tag', i);
      }
    });
  }
  
  // Ctrl+0 - Clear tags
  globalShortcut.register('CommandOrControl+0', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-shortcut', 'clear-tags');
    }
  });
}

// Handle loading URL in BrowserView
ipcMain.handle('load-url', async (event, url) => {
  try {
    if (webView && url && url.trim() && url.startsWith('http')) {
      await webView.webContents.loadURL(url);
      return { success: true };
    }
    return { success: false, error: 'Invalid or empty URL provided' };
  } catch (error) {
    console.error('Error loading URL:', error);
    return { success: false, error: error.message };
  }
});

// Handle preloading URL (for performance optimization)
ipcMain.handle('preload-url', async (event, url) => {
  try {
    if (!url) {
      return { success: false, error: 'No URL provided' };
    }
    
    // Check if already cached
    if (preloadCache.has(url)) {
      return { success: true, cached: true };
    }
    
    // Create a hidden BrowserView for preloading
    const preloadView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        show: false
      }
    });
    
    try {
      await preloadView.webContents.loadURL(url);
      
      // Cache the preloaded page
      preloadCache.set(url, {
        view: preloadView,
        timestamp: Date.now()
      });
      
      // Clean up old cache entries (keep only 20 most recent)
      if (preloadCache.size > 20) {
        const sortedEntries = Array.from(preloadCache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Remove oldest entries
        for (let i = 0; i < 5; i++) {
          const [oldUrl, oldEntry] = sortedEntries[i];
          if (oldEntry.view) {
            oldEntry.view.webContents.destroy();
          }
          preloadCache.delete(oldUrl);
        }
      }
      
      return { success: true, cached: false };
    } catch (error) {
      preloadView.webContents.destroy();
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error('Error preloading URL:', error);
    return { success: false, error: error.message };
  }
});

// Handle adjusting BrowserView position
ipcMain.handle('adjust-browser-view', async (event, elementBounds) => {
  try {
    if (webView && elementBounds) {
      // Use the exact element bounds from the frontend
      webView.setBounds({
        x: Math.round(elementBounds.x),
        y: Math.round(elementBounds.y),
        width: Math.round(elementBounds.width),
        height: Math.round(elementBounds.height)
      });
      console.log('BrowserView adjusted to:', elementBounds);
      return { success: true };
    }
    return { success: false, error: 'No bounds provided' };
  } catch (error) {
    console.error('Error adjusting BrowserView:', error);
    return { success: false, error: error.message };
  }
});

// Handle hiding BrowserView
ipcMain.handle('hide-browser-view', async () => {
  try {
    if (webView) {
      webView.setBounds({ x: -10000, y: -10000, width: 1, height: 1 });
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Error hiding BrowserView:', error);
    return { success: false, error: error.message };
  }
});

// Handle showing BrowserView
ipcMain.handle('show-browser-view', async () => {
  try {
    if (webView) {
      // BrowserView will be repositioned by the next adjust call
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Error showing BrowserView:', error);
    return { success: false, error: error.message };
  }
});

// Handle file selection
ipcMain.handle('select-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Excel File',
      defaultPath: __dirname,
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      selectedExcelFile = result.filePaths[0];
      console.log('Selected Excel file:', selectedExcelFile);
      return { 
        success: true, 
        filepath: selectedExcelFile,
        filename: path.basename(selectedExcelFile)
      };
    } else {
      return { success: false, error: 'File selection cancelled' };
    }
  } catch (error) {
    console.error('Error showing file dialog:', error);
    return { success: false, error: error.message };
  }
});

// Handle Excel file loading
ipcMain.handle('load-excel', async () => {
  try {
    if (!selectedExcelFile) {
      throw new Error('No Excel file selected. Please select a file first.');
    }
    
    if (!fs.existsSync(selectedExcelFile)) {
      throw new Error(`Excel file not found: ${selectedExcelFile}`);
    }
    
    const workbook = xlsx.readFile(selectedExcelFile);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    if (!data || data.length === 0) {
      throw new Error('No data found in Excel file');
    }
    
    // Find column indices
    const headers = data[0];
    let columns = {};
    
    headers.forEach((header, index) => {
      const headerStr = String(header).toLowerCase();
      if (headerStr.includes('description') || headerStr.includes('query')) {
        columns.description = index;
        columns.query = index; // 添加query别名
      } else if (headerStr.includes('link') && !headerStr.includes('thumbnail')) {
        columns.link = index;
      } else if (headerStr.includes('image') || headerStr.includes('thumbnail')) {
        columns.thumbnail_link = index;
      } else if (headerStr.includes('result')) {
        columns.result = index;
      } else if (headerStr.includes('issue')) {
        columns.issue = index;
      } else if (headerStr.includes('screenshot')) {
        columns.screenshot = index;
      }
    });
    
    // Set default indices if not found
    if (columns.description === undefined) columns.description = 0;
    if (columns.query === undefined) columns.query = 0;
    if (columns.link === undefined) columns.link = 1;
    if (columns.thumbnail_link === undefined) columns.thumbnail_link = 2;
    if (columns.result === undefined) columns.result = 3;
    if (columns.issue === undefined) columns.issue = 4;
    if (columns.screenshot === undefined) columns.screenshot = headers.length;
    
    console.log('Columns detected:', columns);
    console.log('First few rows:', data.slice(0, 3));
    
    return { 
      success: true,
      data, 
      columns, 
      filename: path.basename(selectedExcelFile) 
    };
  } catch (error) {
    console.error('Error loading Excel file:', error);
    return { success: false, error: error.message };
  }
});

// Handle Excel file saving
ipcMain.handle('save-excel', async (event, data) => {
  try {
    if (!selectedExcelFile) {
      throw new Error('No Excel file selected. Cannot save data.');
    }
    
    const worksheet = xlsx.utils.aoa_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    xlsx.writeFile(workbook, selectedExcelFile);
    
    console.log('Excel file saved successfully to:', selectedExcelFile);
    return { success: true, filepath: selectedExcelFile };
  } catch (error) {
    console.error('Error saving Excel file:', error);
    return { success: false, error: error.message };
  }
});

// Handle taking screenshot
ipcMain.handle('take-screenshot', async () => {
  try {
    if (webView) {
      const image = await webView.webContents.capturePage();
      const buffer = image.toPNG();
      
      // Create screenshots directory if it doesn't exist
      const screenshotsDir = path.join(__dirname, 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
      }
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot_${timestamp}.png`;
      const filepath = path.join(screenshotsDir, filename);
      
      // Save screenshot to file
      fs.writeFileSync(filepath, buffer);
      
      // Return both base64 for immediate display and filepath for Excel
      return { 
        success: true, 
        screenshot: buffer.toString('base64'),
        filepath: `screenshots/${filename}` // Relative path for Excel
      };
    } else {
      const image = await mainWindow.capturePage();
      const buffer = image.toPNG();
      
      // Create screenshots directory if it doesn't exist
      const screenshotsDir = path.join(__dirname, 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
      }
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot_${timestamp}.png`;
      const filepath = path.join(screenshotsDir, filename);
      
      // Save screenshot to file
      fs.writeFileSync(filepath, buffer);
      
      return { 
        success: true, 
        screenshot: buffer.toString('base64'),
        filepath: `screenshots/${filename}` // Relative path for Excel
      };
    }
  } catch (error) {
    console.error('Error taking screenshot:', error);
    return { success: false, error: error.message };
  }
});

// Handle loading screenshot file
ipcMain.handle('load-screenshot', async (event, filepath) => {
  try {
    const fullPath = path.join(__dirname, filepath);
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath);
      return { success: true, data: buffer.toString('base64') };
    } else {
      return { success: false, error: 'File not found' };
    }
  } catch (error) {
    console.error('Error loading screenshot:', error);
    return { success: false, error: error.message };
  }
});

// Handle downloading sample Excel template
ipcMain.handle('download-sample-excel', async () => {
  try {
    const { createSampleExcel } = require('./script/create_sample_excel.js');
    
    // 先创建样例文件（如果不存在）
    const samplePath = path.join(__dirname, 'public', 'sample_template.xlsx');
    if (!fs.existsSync(samplePath)) {
      createSampleExcel();
    }
    
    // 让用户选择保存位置
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Sample Excel Template',
      defaultPath: 'web_page_scorer_template.xlsx',
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      // 复制样例文件到用户选择的位置
      fs.copyFileSync(samplePath, result.filePath);
      
      console.log('Sample Excel template saved to:', result.filePath);
      return { 
        success: true, 
        filePath: result.filePath,
        fileName: path.basename(result.filePath)
      };
    } else {
      return { success: false, error: 'Save cancelled by user' };
    }
  } catch (error) {
    console.error('Error downloading sample Excel template:', error);
    return { success: false, error: error.message };
  }
}); 