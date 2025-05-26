const { app, BrowserWindow, BrowserView, ipcMain, dialog } = require('electron');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');

let mainWindow;
let webView;
let selectedExcelFile = null; // 存储用户选择的Excel文件路径

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
    
    // 显示文件选择对话框
    showFileSelectDialog();
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
  });
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle loading URL in BrowserView
ipcMain.handle('load-url', async (event, url) => {
  try {
    if (webView && url) {
      await webView.webContents.loadURL(url);
      return { success: true };
    }
    return { success: false, error: 'No URL provided' };
  } catch (error) {
    console.error('Error loading URL:', error);
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

// Handle selecting new Excel file
ipcMain.handle('select-excel-file', async () => {
  await showFileSelectDialog();
  return { success: true };
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
      } else if (headerStr.includes('link') && !headerStr.includes('thumbnail')) {
        columns.link = index;
      } else if (headerStr.includes('image') || headerStr.includes('thumbnail')) {
        columns.image = index;
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
    if (columns.link === undefined) columns.link = 1;
    if (columns.image === undefined) columns.image = 2;
    if (columns.result === undefined) columns.result = 3;
    if (columns.issue === undefined) columns.issue = 4;
    if (columns.screenshot === undefined) columns.screenshot = headers.length;
    
    console.log('Columns detected:', columns);
    console.log('First few rows:', data.slice(0, 3));
    
    return { data, columns, filename: path.basename(selectedExcelFile) };
  } catch (error) {
    console.error('Error loading Excel file:', error);
    throw error;
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
    throw error;
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

// Handle reading screenshot file
ipcMain.handle('read-screenshot', async (event, filepath) => {
  try {
    const fullPath = path.join(__dirname, filepath);
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath);
      return { success: true, screenshot: buffer.toString('base64') };
    } else {
      return { success: false, error: 'File not found' };
    }
  } catch (error) {
    console.error('Error reading screenshot:', error);
    return { success: false, error: error.message };
  }
});

// 显示文件选择对话框
async function showFileSelectDialog() {
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
      
      // 通知前端文件已选择
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('excel-file-selected', {
          filepath: selectedExcelFile,
          filename: path.basename(selectedExcelFile)
        });
      }
    } else {
      // 用户取消选择，显示默认消息
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('excel-file-cancelled');
      }
    }
  } catch (error) {
    console.error('Error showing file dialog:', error);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('excel-file-error', error.message);
    }
  }
} 