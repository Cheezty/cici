# Vercel Serverless Functions 部署指南

## 📋 已完成的准备工作

✅ 创建了 `api/fans.js` - Serverless Function  
✅ 创建了 `vercel.json` - Vercel 配置文件  
✅ 更新了 `script.js` - 前端代码使用新 API

## 🚀 部署步骤

### 步骤 1: 提交代码到 Git

在项目目录中运行：

```bash
git add api/fans.js vercel.json script.js
git commit -m "添加 Vercel Serverless Function 获取粉丝数"
git push
```

### 步骤 2: Vercel 自动部署

1. **Vercel 会自动检测到更新**
   - 你的项目已经连接到 GitHub
   - 每次 push 都会自动触发部署

2. **等待部署完成**
   - 在 Vercel Dashboard 查看部署状态
   - 通常需要 1-2 分钟

3. **部署成功后**
   - API 地址：`https://cici.lilinxi.cc/api/fans`
   - 会在全球 CDN 上可用

### 步骤 3: 测试 API

**方法 1: 在浏览器中测试**

直接访问：
```
https://cici.lilinxi.cc/api/fans
```

应该看到 JSON 响应：
```json
{
  "success": true,
  "fansCount": 78531,
  "timestamp": 1702567890123,
  "source": "vercel-function"
}
```

**方法 2: 在浏览器控制台测试**

打开浏览器控制台（F12），运行：
```javascript
fetch('https://cici.lilinxi.cc/api/fans')
  .then(res => res.json())
  .then(data => {
    console.log('✅ API 测试成功！');
    console.log('粉丝数:', data.fansCount);
    console.log('数据来源:', data.source);
  })
  .catch(err => {
    console.error('❌ API 测试失败:', err);
  });
```

### 步骤 4: 测试你的网页

1. **刷新网页**
   - 使用 Live Server 打开 `index.html`
   - 或访问 `https://cici.lilinxi.cc`

2. **查看控制台**
   - 按 F12 打开开发者工具
   - 切换到 Console 标签
   - 应该看到：
     ```
     📡 尝试代理: Vercel API
     ✅ Vercel API 获取成功，粉丝数: 78531
     粉丝数量已更新: 78531 -> 7.9万
     ```

## 🎯 优势

### 与 Cloudflare Worker 对比

| 特性 | Vercel API | Cloudflare Worker |
|------|-----------|-------------------|
| 中国境内访问 | ✅ 稳定 | ❌ 需要代理 |
| 部署难度 | ✅ 自动部署 | ⚠️ 手动部署 |
| 免费额度 | ✅ 足够使用 | ✅ 足够使用 |
| 响应速度 | ✅ 快速 | ✅ 快速 |

### 工作原理

```
用户浏览器 (中国境内)
    ↓
请求 https://cici.lilinxi.cc/api/fans
    ↓
Vercel Serverless Function (海外服务器)
    ↓
访问 novelquickapp.com (不受 CORS 限制)
    ↓
提取粉丝数并返回 JSON
    ↓
用户浏览器接收数据并显示
```

## 🔍 故障排查

### 问题 1: API 返回 404

**原因**：Function 未正确部署

**解决**：
1. 确认 `api/fans.js` 文件在项目根目录的 `api` 文件夹中
2. 确认已提交并推送到 Git
3. 在 Vercel Dashboard 查看部署日志

### 问题 2: API 返回 500 错误

**原因**：Function 运行时错误

**解决**：
1. 在 Vercel Dashboard 中点击项目
2. 切换到 **Logs** 标签
3. 查看函数执行日志
4. 检查错误信息

### 问题 3: CORS 错误

**原因**：响应头设置不正确

**解决**：
1. 确认 `vercel.json` 文件已正确配置
2. 确认 `api/fans.js` 中设置了 CORS 响应头
3. 重新部署项目

### 问题 4: 前端仍然使用备用代理

**原因**：Vercel API 失败，自动切换到备用代理

**解决**：
1. 打开浏览器控制台，查看具体错误信息
2. 确认 API URL 是否正确：`https://cici.lilinxi.cc/api/fans`
3. 测试 API 是否正常工作

## 📊 监控和日志

### 查看 API 使用情况

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击你的项目 `cici`
3. 切换到 **Analytics** 标签
4. 查看 API 请求数量和响应时间

### 查看函数日志

1. 在项目中切换到 **Logs** 标签
2. 选择 **Functions** 类型
3. 实时查看函数执行日志
4. 用于调试和监控

## 💡 优化建议

### 当前配置

- ✅ 缓存 5 分钟（减少对目标网站的请求）
- ✅ 内存 1024MB（足够使用）
- ✅ 超时 10 秒（足够获取数据）

### 未来可选优化

1. **添加速率限制**
   - 防止滥用
   - 保护 API

2. **添加更多数据源**
   - 支持多个演员
   - 统一 API 格式

3. **添加数据缓存**
   - 使用 Vercel KV
   - 减少对目标网站的请求

## ✅ 验证清单

部署完成后，请确认：

- [ ] `api/fans.js` 文件已创建并推送
- [ ] `vercel.json` 文件已创建并推送
- [ ] `script.js` 已更新使用新 API
- [ ] Vercel 已自动部署完成
- [ ] 访问 `https://cici.lilinxi.cc/api/fans` 返回正确数据
- [ ] 网页能正确显示粉丝数
- [ ] 在中国境内测试（无需代理）

## 🎉 完成！

现在你的网页可以在**中国境内实时获取粉丝数**了！

- ✅ 不需要代理
- ✅ 不需要手动更新
- ✅ 自动故障切换（如果 Vercel API 失败，会自动使用备用代理）

如有问题，请查看 Vercel Dashboard 中的日志和错误信息。

