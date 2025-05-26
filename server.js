const express = require('express');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const app = express();
const port = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Global variables to store Excel data
let excelData = [];
let columns = {};
let filePath = '';

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API to read Excel file
app.get('/api/excel', (req, res) => {
  try {
    filePath = path.join(__dirname, 'test_link.xlsx');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Excel file not found. Please make sure test_link.xlsx exists in the project root.' });
    }
    
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find the column indices
    const headers = data[0] || [];
    
    // More flexible column detection
    const descriptionIndex = headers.findIndex(h => 
      typeof h === 'string' && (
        h.toLowerCase().includes('description') || 
        h.toLowerCase().includes('desc') ||
        h.toLowerCase().includes('query')
      )
    );
    
    const linkIndex = headers.findIndex(h => 
      typeof h === 'string' && (
        h.toLowerCase().includes('link') || 
        h.toLowerCase().includes('url') ||
        h.toLowerCase().includes('address')
      )
    );
    
    const imageIndex = headers.findIndex(h => 
      typeof h === 'string' && (
        h.toLowerCase().includes('image') || 
        h.toLowerCase().includes('img') ||
        h.toLowerCase().includes('picture')
      )
    );
    
    let resultIndex = headers.findIndex(h => 
      typeof h === 'string' && h.toLowerCase().includes('result')
    );
    
    let screenshotIndex = headers.findIndex(h => 
      typeof h === 'string' && h.toLowerCase().includes('screenshot')
    );
    
    // If resultIndex is not found, add it
    if (resultIndex === -1) {
      headers.push('Result (0 can\'t pass, 1 means pass)');
      resultIndex = headers.length - 1;
      
      // Add empty cells to all data rows for the new column
      for (let i = 1; i < data.length; i++) {
        while (data[i].length < headers.length) {
          data[i].push('');
        }
      }
    }
    
    // If screenshotIndex is not found, add it
    if (screenshotIndex === -1) {
      headers.push('screenshot');
      screenshotIndex = headers.length - 1;
      
      // Add empty cells to all data rows for the new column
      for (let i = 1; i < data.length; i++) {
        while (data[i].length < headers.length) {
          data[i].push('');
        }
      }
    }
    
    // Ensure all rows have the same length
    for (let i = 0; i < data.length; i++) {
      while (data[i].length < headers.length) {
        data[i].push('');
      }
    }
    
    excelData = data;
    columns = {
      description: descriptionIndex !== -1 ? descriptionIndex : 0,
      link: linkIndex !== -1 ? linkIndex : 1,
      image: imageIndex !== -1 ? imageIndex : 2,
      result: resultIndex,
      screenshot: screenshotIndex
    };
    
    console.log('Columns detected:', columns);
    console.log('First few rows:', data.slice(0, 3));
    
    res.json({
      data: excelData,
      columns: columns
    });
  } catch (error) {
    console.error('Error reading Excel file:', error);
    res.status(500).json({ error: error.message });
  }
});

// API to save results
app.post('/api/save', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Excel file not found' });
    }
    
    // Create a new workbook with the updated data
    const newWorksheet = xlsx.utils.aoa_to_sheet(data);
    const newWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Sheet1');
    
    // Write the file
    xlsx.writeFile(newWorkbook, filePath);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving results:', error);
    res.status(500).json({ error: error.message });
  }
});

// API to take screenshot (placeholder for now)
app.post('/api/screenshot', async (req, res) => {
  res.status(501).json({ error: 'Screenshot functionality not yet implemented. You can manually take screenshots for now.' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Web Page Scorer running at http://localhost:${port}`);
  console.log('📁 Make sure your Excel file "test_link.xlsx" is in the project root directory.');
  console.log('💡 Open your browser and navigate to the URL above to start scoring!');
}); 