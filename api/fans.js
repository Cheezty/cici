// Vercel Serverless Function - 获取粉丝数据
// 这个函数运行在 Vercel 的服务器上，不受 CORS 限制

export default async function handler(req, res) {
  // 设置 CORS 响应头，允许你的网站访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300'); // 缓存 5 分钟

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许 GET 请求
  if (req.method !== 'GET') {
    res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
    return;
  }

  try {
    // 目标 URL
    const targetUrl = 'https://novelquickapp.com/s/sTekQviVCVs/';
    
    console.log('开始获取粉丝数据...');
    
    // 向目标网站发送请求
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 读取响应内容
    const html = await response.text();
    console.log(`成功获取 HTML，长度: ${html.length}`);

    // 提取粉丝数 - 使用多个正则模式提高成功率
    const patterns = [
      /"fans_count"\s*:\s*(\d+)/i,
      /"fans_count"\s*:\s*"(\d+)"/i,
      /fans_count\s*:\s*(\d+)/i,
    ];

    let fansCount = null;
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        fansCount = parseInt(match[1]);
        if (!isNaN(fansCount) && fansCount > 0) {
          console.log(`成功提取粉丝数: ${fansCount}`);
          break;
        }
      }
    }

    if (fansCount) {
      // 成功返回数据
      res.status(200).json({
        success: true,
        fansCount: fansCount,
        timestamp: Date.now(),
        source: 'vercel-function'
      });
    } else {
      // 未找到粉丝数
      console.error('未能提取粉丝数');
      res.status(404).json({
        success: false,
        error: 'Fans count not found in HTML',
        htmlLength: html.length
      });
    }
  } catch (error) {
    // 错误处理
    console.error('获取粉丝数失败:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fans count',
      message: error.message
    });
  }
}

