/**
 * postbuild.js — 构建后自动修复 Electron 打包的路径问题
 * 1. 将 HTML/JS 中的 /assets/ 绝对路径改为相对路径 (./assets/)
 * 2. 将 JS 中的 /api 相对路径改为 http://localhost:3000/api (Electron file:// 协议无法处理相对路径)
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist/client');
const indexHtml = path.join(distDir, 'index.html');
const assetsDir = path.join(distDir, 'assets');

const API_BASE_URL = 'http://localhost:3000';

// ── 1. 修复 HTML 中的绝对路径 ─────────────────────────────────
if (fs.existsSync(indexHtml)) {
  let html = fs.readFileSync(indexHtml, 'utf-8');
  const fixed = html
    .replace(/src="\/assets\//g, 'src="./assets/')
    .replace(/href="\/assets\//g, 'href="./assets/')
    .replace(/href="\/manifest/g, 'href="./manifest')
    .replace(/href="\/apple-touch-icon/g, 'href="./apple-touch-icon')
    .replace(/href="\/favicon/g, 'href="./favicon');

  if (fixed !== html) {
    fs.writeFileSync(indexHtml, fixed, 'utf-8');
    console.log('✅ Electron HTML path fix: /assets → ./assets');
  }
}

// ── 2. 修复 JS Bundle 中的 API 路径 (file:// 无法解析 /api) ──
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const original = fs.readFileSync(filePath, 'utf-8');
    let content = original;

    // 精准替换 ApiClient base 变量（完整 URL）
    // 源代码已改为：const API_BASE = 'http://localhost:3000/api'
    // 编译后变成：const Tp="http://localhost:3000/api"
    // postbuild 仅替换 localhost:3000 为实际主机（支持远程部署时替换域名/IP）
    content = content
      // 替换 new ApiClient("http://localhost:3000/api")
      .replace(/new Mp\("http:\/\/localhost:3000\/api"\)/g, 'new Mp("' + API_BASE_URL + '/api")')
      // 替换 base 变量赋值的 "http://localhost:3000/api"
      .replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)="http:\/\/localhost:3000\/api"(?=,|;|\)|$)/g, '$1="' + API_BASE_URL + '/api"')
      // 兜底：替换所有 /api 字符串（双引号）
      .replace(/"\/api\//g, '"' + API_BASE_URL + '/api/')
      // 兜底：/api 字符串（单引号）
      .replace(/'\/api\//g, "'" + API_BASE_URL + '/api/')
      // 兜底：/api 字符串（反引号模板）
      .replace(/\x60\/api\//g, '\x60' + API_BASE_URL + '/api/');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('✅ API path fix: ' + file + ' — /api → ' + API_BASE_URL + '/api');
    }
  }
}

console.log('✅ postbuild complete');
