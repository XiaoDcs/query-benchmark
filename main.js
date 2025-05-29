const { app, BrowserWindow, BrowserView, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');

let mainWindow;
let webView;
let selectedExcelFile = null; // 存储用户选择的Excel文件路径
let preloadCache = new Map(); // 预加载缓存：URL -> {view, timestamp, pageIndex}
let currentPageIndex = 1; // 当前页面索引
let maxCacheSize = 10; // 最大缓存数量

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
  webView = createSafeBrowserView();
  
  if (!webView) {
    console.error('Failed to create initial BrowserView');
    return;
  }
  
  mainWindow.setBrowserView(webView);
  
  // Position the BrowserView
  const setBounds = () => {
    const bounds = mainWindow.getBounds();
    const webViewBounds = {
      x: 30,  // 左边距
      y: 124, // header + controls + progress + margins (reduced)
      width: Math.max(600, bounds.width - 350),  // full width - sidebar(320) - gaps(30)
      height: Math.max(500, bounds.height - 150) // full height - top offset - minimal bottom margin
    };
    
    console.log('Window bounds:', bounds);
    console.log('BrowserView bounds:', webViewBounds);
    
    if (webView && typeof webView.setBounds === 'function') {
      try {
        webView.setBounds(webViewBounds);
      } catch (error) {
        console.error('Error setting BrowserView bounds:', error);
      }
    }
  };
  
  setBounds();
  mainWindow.on('resize', setBounds);
  
  mainWindow.on('closed', function () {
    // Clean up all BrowserViews
    try {
      safeBrowserViewDestroy(webView);
      
      // Clean up all cached preload views
      for (const [url, entry] of preloadCache.entries()) {
        safeBrowserViewDestroy(entry.view);
      }
      preloadCache.clear();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
    
    mainWindow = null;
    webView = null;
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
  
  // Clean up all BrowserViews before quitting
  try {
    safeBrowserViewDestroy(webView);
    
    // Clean up all cached preload views
    for (const [url, entry] of preloadCache.entries()) {
      safeBrowserViewDestroy(entry.view);
    }
    preloadCache.clear();
  } catch (error) {
    console.error('Error during app cleanup:', error);
  }
  
  webView = null;
  
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

// Helper function to safely check if a BrowserView is valid
function isValidBrowserView(browserView) {
  try {
    if (!browserView) {
      return false;
    }
    
    // Check if webContents exists and is not null
    if (!browserView.webContents) {
      return false;
    }
    
    // Check if isDestroyed method exists
    if (typeof browserView.webContents.isDestroyed !== 'function') {
      return false;
    }
    
    // Finally check if it's not destroyed
    return !browserView.webContents.isDestroyed();
  } catch (error) {
    console.error('Error checking BrowserView validity:', error);
    return false;
  }
}

// Helper function to safely destroy a BrowserView
function safeBrowserViewDestroy(browserView) {
  try {
    if (!browserView) {
      return;
    }
    
    // Multiple safety checks
    if (browserView.webContents && 
        typeof browserView.webContents.destroy === 'function') {
      
      // Check if already destroyed before attempting to destroy
      if (typeof browserView.webContents.isDestroyed === 'function' && 
          !browserView.webContents.isDestroyed()) {
        browserView.webContents.destroy();
      }
    }
  } catch (error) {
    console.error('Error safely destroying BrowserView:', error);
    // Don't re-throw, just log the error
  }
}

// Helper function to safely create a BrowserView
function createSafeBrowserView(options = {}) {
  try {
    const defaultOptions = {
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        plugins: false,
        experimentalFeatures: false,
        ...options.webPreferences
      },
      ...options
    };
    
    const browserView = new BrowserView(defaultOptions);
    
    // Set user agent if webContents is available
    if (browserView && browserView.webContents && 
        typeof browserView.webContents.setUserAgent === 'function') {
      browserView.webContents.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }
    
    return browserView;
  } catch (error) {
    console.error('Error creating BrowserView:', error);
    return null;
  }
}

// Handle loading URLs in the BrowserView
ipcMain.handle('load-url', async (event, url) => {
  try {
    // Validate URL first
    if (!url || typeof url !== 'string' || !url.trim()) {
      return { success: false, error: 'Invalid URL provided' };
    }
    
    // Create new BrowserView or reuse existing one
    if (!isValidBrowserView(webView)) {
      // Safely destroy the old webView if it exists but is invalid
      if (webView) {
        safeBrowserViewDestroy(webView);
        webView = null;
      }
      
      try {
        webView = createSafeBrowserView();
        
        if (!webView) {
          return { success: false, error: 'Failed to create BrowserView' };
        }
        
        if (mainWindow && webView) {
          mainWindow.setBrowserView(webView);
        }
      } catch (createError) {
        console.error('Error creating BrowserView:', createError);
        return { success: false, error: 'Failed to create BrowserView: ' + createError.message };
      }
    }
    
    // Validate webView again before loading URL
    if (!isValidBrowserView(webView)) {
      return { success: false, error: 'BrowserView is invalid after creation' };
    }
    
    await webView.webContents.loadURL(url);
    return { success: true };
  } catch (error) {
    console.error('Error loading URL:', error);
    
    // If first attempt fails, try one retry with complete recreation
    try {
      // Clean up and recreate everything
      if (webView) {
        safeBrowserViewDestroy(webView);
        webView = null;
      }
      
      webView = createSafeBrowserView();
      
      if (!webView) {
        return { success: false, error: 'Failed to create BrowserView on retry' };
      }
      
      if (mainWindow && webView) {
        mainWindow.setBrowserView(webView);
      }
      
      if (isValidBrowserView(webView)) {
        await webView.webContents.loadURL(url);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to create valid BrowserView on retry' };
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      return { success: false, error: retryError.message };
    }
  }
});

// Handle refreshing current page
ipcMain.handle('refresh-current-page', async (event, url) => {
  try {
    // Validate URL first
    if (!url || typeof url !== 'string' || !url.trim() || !url.startsWith('http')) {
      return { success: false, error: 'Invalid URL provided for refresh' };
    }
    
    if (isValidBrowserView(webView)) {
      try {
        // First try to reload the current page
        await webView.webContents.reload();
        return { success: true };
      } catch (reloadError) {
        console.error('Error during reload:', reloadError);
        // Fall through to recreation logic
      }
    }
    
    // If webView is destroyed or reload failed, recreate it and load the URL
    if (webView) {
      safeBrowserViewDestroy(webView);
      webView = null;
    }
    
    try {
      webView = createSafeBrowserView();
      
      if (!webView) {
        return { success: false, error: 'Failed to create BrowserView for refresh' };
      }
      
      if (mainWindow && webView) {
        mainWindow.setBrowserView(webView);
      }
      
      if (isValidBrowserView(webView)) {
        await webView.webContents.loadURL(url);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to create valid BrowserView for refresh' };
      }
    } catch (createError) {
      console.error('Error creating BrowserView for refresh:', createError);
      return { success: false, error: 'Failed to recreate BrowserView: ' + createError.message };
    }
  } catch (error) {
    console.error('Error refreshing page:', error);
    return { success: false, error: error.message };
  }
});

// Handle dynamic preloading around current page
ipcMain.handle('dynamic-preload', async (event, { currentIndex, excelData, columns, maxPreloadPages = 5 }) => {
  try {
    currentPageIndex = currentIndex;
    const totalPages = excelData.length - 1; // 排除标题行
    
    // Calculate preload range based on maxPreloadPages
    const preloadBefore = Math.floor(maxPreloadPages * 0.3); // 30% for previous pages
    const preloadAfter = maxPreloadPages - preloadBefore; // 70% for next pages
    
    // Calculate which pages to preload
    const pagesToPreload = [];
    
    // Preload previous pages (for quick back navigation)
    for (let i = Math.max(1, currentIndex - preloadBefore); i < currentIndex; i++) {
      pagesToPreload.push(i);
    }
    
    // Preload next pages (for quick forward navigation)
    for (let i = currentIndex + 1; i <= Math.min(totalPages, currentIndex + preloadAfter); i++) {
      pagesToPreload.push(i);
    }
    
    let preloadCount = 0;
    let errorCount = 0;
    
    // Clean up cache entries that are outside our range
    const validIndices = new Set([...pagesToPreload, currentIndex]);
    for (const [url, entry] of preloadCache.entries()) {
      if (!validIndices.has(entry.pageIndex)) {
        safeBrowserViewDestroy(entry.view);
        preloadCache.delete(url);
      }
    }
    
    // Preload pages
    for (const pageIndex of pagesToPreload) {
      try {
        if (pageIndex >= 1 && pageIndex <= totalPages) {
          const rowData = excelData[pageIndex];
          const url = rowData && rowData[columns.link];
          
          if (url && url.trim() && url.startsWith('http')) {
            // Check if already cached
            if (!preloadCache.has(url)) {
              // Create a hidden BrowserView for preloading
              const preloadView = createSafeBrowserView({
                webPreferences: {
                  show: false
                }
              });
              
              if (!preloadView) {
                errorCount++;
                continue; // Skip this URL if BrowserView creation failed
              }
              
              // Set initial bounds for the preload view (reasonable size, positioned off-screen)
              preloadView.setBounds({ x: -2000, y: -2000, width: 1200, height: 800 });
              
              try {
                await preloadView.webContents.loadURL(url);
                
                // Double-check that the view is still valid after loading
                if (isValidBrowserView(preloadView)) {
                  // Cache the preloaded page
                  preloadCache.set(url, {
                    view: preloadView,
                    timestamp: Date.now(),
                    pageIndex: pageIndex
                  });
                  
                  preloadCount++;
                } else {
                  // Clean up invalid view
                  safeBrowserViewDestroy(preloadView);
                  errorCount++;
                }
                
                // Enforce cache size limit
                if (preloadCache.size > maxCacheSize) {
                  const sortedEntries = Array.from(preloadCache.entries())
                    .sort((a, b) => a[1].timestamp - b[1].timestamp);
                  
                  // Remove oldest entries
                  const toRemove = preloadCache.size - maxCacheSize;
                  for (let i = 0; i < toRemove; i++) {
                    const [oldUrl, oldEntry] = sortedEntries[i];
                    safeBrowserViewDestroy(oldEntry.view);
                    preloadCache.delete(oldUrl);
                  }
                }
              } catch (loadError) {
                safeBrowserViewDestroy(preloadView);
                errorCount++;
              }
            }
          }
        }
      } catch (pageError) {
        errorCount++;
      }
      
      // Add small delay between preloads to avoid overwhelming the system
      if (preloadCount > 0 && preloadCount % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return { 
      success: true, 
      preloadCount, 
      errorCount,
      cacheSize: preloadCache.size,
      cachedPages: Array.from(preloadCache.values()).map(entry => entry.pageIndex).sort((a, b) => a - b)
    };
  } catch (error) {
    console.error('Error in dynamic preload:', error);
    return { success: false, error: error.message };
  }
});

// Handle getting preload status
ipcMain.handle('get-preload-status', async () => {
  try {
    const status = {
      cacheSize: preloadCache.size,
      maxCacheSize,
      cachedPages: Array.from(preloadCache.values()).map(entry => entry.pageIndex).sort((a, b) => a - b),
      cachedUrls: Array.from(preloadCache.keys())
    };
    return { success: true, status };
  } catch (error) {
    console.error('Error getting preload status:', error);
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
    
    // 添加调试日志
    console.log('=== Excel Column Parsing Debug ===');
    console.log('Headers found:', headers);
    console.log('Total columns:', headers.length);
    
    // 更精确的列识别逻辑
    headers.forEach((header, index) => {
      const headerStr = String(header).toLowerCase().trim();
      console.log(`Column ${index}: "${header}" -> "${headerStr}"`);
      
      // 使用更精确的匹配规则，避免误匹配
      if (headerStr === 'description' || headerStr === 'query' || 
          headerStr === 'desc' || headerStr.includes('描述')) {
        if (columns.description === undefined) { // 防止重复匹配
          columns.description = index;
          columns.query = index;
          console.log(`  ✓ Matched as description/query column`);
        }
      } else if ((headerStr.includes('link') || headerStr.includes('url')) && 
                 !headerStr.includes('thumbnail') && !headerStr.includes('image')) {
        if (columns.link === undefined) {
          columns.link = index;
          console.log(`  ✓ Matched as link column`);
        }
      } else if (headerStr.includes('thumbnail') || headerStr.includes('thumb') || 
                 (headerStr.includes('image') && headerStr.includes('link'))) {
        if (columns.thumbnail_link === undefined) {
          columns.thumbnail_link = index;
          console.log(`  ✓ Matched as thumbnail_link column`);
        }
      } else if (headerStr === 'result' || headerStr === 'score' || 
                 headerStr.includes('评分') || headerStr.includes('结果')) {
        if (columns.result === undefined) {
          columns.result = index;
          console.log(`  ✓ Matched as result column`);
        }
      } else if (headerStr === 'issue' || headerStr === 'note' || headerStr === 'notes' ||
                 headerStr.includes('问题') || headerStr.includes('备注')) {
        if (columns.issue === undefined) {
          columns.issue = index;
          console.log(`  ✓ Matched as issue column`);
        }
      } else if (headerStr === 'screenshot' || headerStr.includes('截图') || 
                 headerStr.includes('screen')) {
        if (columns.screenshot === undefined) {
          columns.screenshot = index;
          console.log(`  ✓ Matched as screenshot column`);
        }
      } else if (headerStr === 'response' || headerStr.includes('响应') || 
                 headerStr.includes('回复') || headerStr.includes('返回')) {
        if (columns.response === undefined) {
          columns.response = index;
          console.log(`  ✓ Matched as response column`);
        }
      } else {
        console.log(`  - No match for this column`);
      }
    });
    
    // Set default indices if not found
    const defaultColumns = {
      description: 0,
      query: 0,
      link: 1,
      thumbnail_link: 2,
      result: 3,
      issue: 4,
      screenshot: headers.length, // 新列会添加到末尾
      response: headers.length - 1 // response在倒数第二列
    };
    
    // 应用默认值并记录
    console.log('\n=== Applying Defaults for Missing Columns ===');
    Object.entries(defaultColumns).forEach(([key, defaultIndex]) => {
      if (columns[key] === undefined) {
        columns[key] = defaultIndex;
        console.log(`${key}: using default position ${defaultIndex} (header: "${headers[defaultIndex] || 'NEW COLUMN'}")`);
      } else {
        console.log(`${key}: found at position ${columns[key]} (header: "${headers[columns[key]]}")`);
      }
    });
    
    // 最终结果
    console.log('\n=== Final Column Mapping ===');
    console.log('Columns detected:', columns);
    console.log('Column headers:');
    Object.entries(columns).forEach(([key, index]) => {
      console.log(`  ${key} (${index}): "${headers[index] || 'NEW COLUMN'}"`);
    });
    console.log('First few rows:', data.slice(0, 3));
    console.log('================================\n');
    
    return { 
      success: true,
      data, 
      columns, 
      filename: path.basename(selectedExcelFile),
      debug: {
        headers: headers,
        totalColumns: headers.length,
        columnMapping: Object.entries(columns).map(([key, index]) => ({
          field: key,
          index: index,
          header: headers[index] || 'NEW COLUMN'
        }))
      }
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

// Handle taking screenshots
ipcMain.handle('take-screenshot', async () => {
  try {
    if (isValidBrowserView(webView)) {
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

// Handle switching to preloaded BrowserView (for instant loading)
ipcMain.handle('switch-to-preloaded', async (event, url, targetBounds) => {
  try {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return { success: false, error: 'No valid URL provided' };
    }
    
    // Check if we have a preloaded view for this URL
    if (preloadCache.has(url)) {
      const cachedEntry = preloadCache.get(url);
      
      if (cachedEntry && cachedEntry.view && isValidBrowserView(cachedEntry.view)) {
        try {
          // Switch to the preloaded BrowserView
          const oldWebView = webView;
          webView = cachedEntry.view;
          
          if (mainWindow && webView) {
            mainWindow.setBrowserView(webView);
            
            // If bounds are provided, set them immediately
            if (targetBounds) {
              webView.setBounds({
                x: Math.round(targetBounds.x),
                y: Math.round(targetBounds.y),
                width: Math.round(targetBounds.width),
                height: Math.round(targetBounds.height)
              });
            }
          }
          
          // Clean up the old view if it's not in cache and not null
          if (oldWebView && isValidBrowserView(oldWebView)) {
            const isInCache = Array.from(preloadCache.values()).some(entry => entry.view === oldWebView);
            if (!isInCache) {
              safeBrowserViewDestroy(oldWebView);
            }
          }
          
          return { success: true, preloaded: true };
        } catch (switchError) {
          console.error('Error switching to preloaded view:', switchError);
          // Remove the problematic cache entry
          preloadCache.delete(url);
          return { success: false, preloaded: false, error: switchError.message };
        }
      } else {
        // Remove invalid cache entry
        if (cachedEntry && cachedEntry.view) {
          safeBrowserViewDestroy(cachedEntry.view);
        }
        preloadCache.delete(url);
        return { success: false, preloaded: false, error: 'Cached view is invalid' };
      }
    } else {
      // Fallback to normal loading
      return { success: false, preloaded: false, error: 'No preloaded view found' };
    }
  } catch (error) {
    console.error('Error switching to preloaded view:', error);
    return { success: false, error: error.message };
  }
});

// Handle adjusting BrowserView position
ipcMain.handle('adjust-browser-view', async (event, elementBounds) => {
  try {
    if (webView && elementBounds) {
      // 确保BrowserView已添加到窗口
      if (mainWindow) {
        mainWindow.setBrowserView(webView);
      }
      
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
    if (mainWindow) {
      // 完全移除任何BrowserView，不管是预加载的还是普通的
      mainWindow.setBrowserView(null);
      console.log('BrowserView hidden by removing from window');
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
    if (webView && mainWindow) {
      // 重新将当前的BrowserView添加到窗口
      mainWindow.setBrowserView(webView);
      
      // 重新计算并设置BrowserView的正确位置
      const bounds = mainWindow.getBounds();
      const webViewBounds = {
        x: 30,  // 左边距
        y: 124, // header + controls + progress + margins
        width: Math.max(600, bounds.width - 350),  // full width - sidebar(320) - gaps(30)
        height: Math.max(500, bounds.height - 150) // full height - top offset - minimal bottom margin
      };
      
      webView.setBounds(webViewBounds);
      console.log('BrowserView shown and repositioned to:', webViewBounds);
      return { success: true };
    }
    return { success: false, error: 'No webView or mainWindow available' };
  } catch (error) {
    console.error('Error showing BrowserView:', error);
    return { success: false, error: error.message };
  }
});

// Clean up invalid cache entries periodically
function cleanupInvalidCache() {
  try {
    const invalidUrls = [];
    
    for (const [url, entry] of preloadCache.entries()) {
      if (!entry || !entry.view || !isValidBrowserView(entry.view)) {
        invalidUrls.push(url);
        if (entry && entry.view) {
          safeBrowserViewDestroy(entry.view);
        }
      }
    }
    
    // Remove invalid entries
    for (const url of invalidUrls) {
      preloadCache.delete(url);
    }
    
    if (invalidUrls.length > 0) {
      console.log(`Cleaned up ${invalidUrls.length} invalid cache entries`);
    }
  } catch (error) {
    console.error('Error during cache cleanup:', error);
  }
}

// Run cache cleanup every 30 seconds
setInterval(cleanupInvalidCache, 30000); 