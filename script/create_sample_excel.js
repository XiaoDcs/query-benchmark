const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// 样例数据结构
const sampleData = [
  [
    'description', // 描述或查询内容
    'link', // 网页链接
    'thumbnail_link', // 缩略图链接
    'result', // 评分结果 (0=失败, 1=通过)
    'issue', // 问题备注
    'screenshot' // 截图文件路径
  ],
  [
    '科技新闻报道',
    'https://www.example.com/tech-news-1',
    'https://images.example.com/thumbnail1.jpg',
    '',
    '',
    ''
  ],
  [
    '产品评测文章',
    'https://www.example.com/product-review-1',
    'https://images.example.com/thumbnail2.jpg',
    '',
    '',
    ''
  ],
  [
    '教育资源页面',
    'https://www.example.com/education-resource-1',
    'https://images.example.com/thumbnail3.jpg',
    '',
    '',
    ''
  ],
  [
    '娱乐新闻内容',
    'https://www.example.com/entertainment-news-1',
    'https://images.example.com/thumbnail4.jpg',
    '',
    '',
    ''
  ],
  [
    '健康养生文章',
    'https://www.example.com/health-article-1',
    'https://images.example.com/thumbnail5.jpg',
    '',
    '',
    ''
  ],
  [
    '财经分析报告',
    'https://www.example.com/finance-analysis-1',
    'https://images.example.com/thumbnail6.jpg',
    '',
    '',
    ''
  ],
  [
    '旅游攻略指南',
    'https://www.example.com/travel-guide-1',
    'https://images.example.com/thumbnail7.jpg',
    '',
    '',
    ''
  ],
  [
    '美食推荐文章',
    'https://www.example.com/food-recommendation-1',
    'https://images.example.com/thumbnail8.jpg',
    '',
    '',
    ''
  ],
  [
    '体育赛事报道',
    'https://www.example.com/sports-news-1',
    'https://images.example.com/thumbnail9.jpg',
    '',
    '',
    ''
  ],
  [
    '生活方式博客',
    'https://www.example.com/lifestyle-blog-1',
    'https://images.example.com/thumbnail10.jpg',
    '',
    '',
    ''
  ]
];

function createSampleExcel() {
  try {
    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Web Pages');
    
    // 确保目录存在
    const outputDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 保存文件
    const outputPath = path.join(outputDir, 'sample_template.xlsx');
    XLSX.writeFile(workbook, outputPath);
    
    console.log(`✅ 样例Excel文件已创建: ${outputPath}`);
    console.log(`📊 包含 ${sampleData.length - 1} 条示例数据`);
    
    return outputPath;
  } catch (error) {
    console.error('❌ 创建样例Excel文件失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createSampleExcel();
}

module.exports = { createSampleExcel }; 