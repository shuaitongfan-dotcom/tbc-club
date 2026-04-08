# 🚀 快速部署指南

## 核心问题解决方案

### ✅ 问题 1：图片路径映射错误

**已修复**：
- `upload-album.json.ts` 现在将图片上传到 `client/images/albums/`
- `album-scanner.ts` 现在从 `client/images/albums/` 读取图片
- 不再创建错误的 `public/` 目录

### ✅ 问题 2：localhost/127.0.0.1 访问问题

**已解决**：
- PM2 配置中设置 `HOST: '0.0.0.0'`
- 应用将监听所有网络接口

---

## 📦 本地构建（Windows）

### 方式 1：使用批处理脚本
```bash
cd c:\Users\20235\Desktop\hasut.tbc\mizuki
build.bat
```

### 方式 2：手动执行
```bash
cd c:\Users\20235\Desktop\hasut.tbc\mizuki
pnpm install
pnpm build
```

### 验证构建结果
确保 `dist` 目录包含：
```
dist/
├── assets/
├── client/
│   └── images/albums/  ← 确保存在
├── pagefind/
└── server/
```

---

## 📤 上传到服务器

### 使用 WinSCP/FileZilla
上传以下文件到 `/www/wwwroot/tbc.xiaolin.help/`：
- `dist/assets/*` → `/www/wwwroot/tbc.xiaolin.help/assets/`
- `dist/client/*` → `/www/wwwroot/tbc.xiaolin.help/client/`
- `dist/pagefind/*` → `/www/wwwroot/tbc.xiaolin.help/pagefind/`
- `dist/server/*` → `/www/wwwroot/tbc.xiaolin.help/server/`
- `package.json` → `/www/wwwroot/tbc.xiaolin.help/package.json`

### 或使用 SCP 命令
```bash
# 从本地 Git Bash 执行
scp -r dist/assets/* user@服务器IP:/www/wwwroot/tbc.xiaolin.help/assets/
scp -r dist/client/* user@服务器IP:/www/wwwroot/tbc.xiaolin.help/client/
scp -r dist/pagefind/* user@服务器IP:/www/wwwroot/tbc.xiaolin.help/pagefind/
scp -r dist/server/* user@服务器IP:/www/wwwroot/tbc.xiaolin.help/server/
scp package.json user@服务器IP:/www/wwwroot/tbc.xiaolin.help/
```

---

## 🔧 服务器部署

### 步骤 1：SSH 登录服务器
```bash
ssh user@服务器IP
```

### 步骤 2：执行部署脚本
```bash
cd /www/wwwroot/tbc.xiaolin.help

# 如果还没有部署脚本，从本地上传
# scp deploy.sh user@服务器IP:/www/wwwroot/tbc.xiaolin.help/

# 赋予执行权限
chmod +x deploy.sh

# 执行部署
sudo bash deploy.sh
```

### 步骤 3：配置 Nginx

```bash
# 复制配置文件
sudo cp nginx-config-example.conf /etc/nginx/sites-available/tbc.xiaolin.help

# 创建符号链接
sudo ln -s /etc/nginx/sites-available/tbc.xiaolin.help /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 步骤 4：配置 HTTPS（推荐）
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tbc.xiaolin.help
```

---

## ✅ 验证部署

### 1. 检查应用状态
```bash
pm2 status
pm2 logs tbc-website --lines 50
```

应该看到：
```
[Album Scanner] 使用生产环境路径: /www/wwwroot/tbc.xiaolin.help/client/images/albums
```

### 2. 测试端口访问
```bash
curl -I http://localhost:4321      # 应该返回 200
curl -I http://127.0.0.1:4321    # 应该返回 200
```

### 3. 检查端口监听
```bash
netstat -tlnp | grep 4321
# 应该看到 0.0.0.0:4321 或 :::4321
```

### 4. 测试网站访问
```bash
curl -I https://tbc.xiaolin.help
```

### 5. 测试图片路径
```bash
# 上传图片后，应该能通过以下路径访问
curl -I https://tbc.xiaolin.help/images/albums/ALBUM_ID/cover.jpg
```

### 6. 检查文件系统
```bash
# 查看相册目录
ls -la /www/wwwroot/tbc.xiaolin.help/client/images/albums/

# 不应该存在这个目录：
ls -la /www/wwwroot/tbc.xiaolin.help/public/  # 不应该存在！
```

---

## 🆘 常见问题

### 问题：图片 404 错误

**检查**：
```bash
# 1. 确认图片在正确位置
ls -la /www/wwwroot/tbc.xiaolin.help/client/images/albums/

# 2. 检查权限
chmod -R 755 /www/wwwroot/tbc.xiaolin.help/client/images/albums/
chown -R www-data:www-data /www/wwwroot/tbc.xiaolin.help/client/images/albums/

# 3. 检查 Nginx 日志
tail -f /www/wwwlogs/tbc-error-nginx.log
```

### 问题：上传失败

**检查**：
```bash
# 1. 查看应用日志
pm2 logs tbc-website --err --lines 50

# 2. 检查目录权限
ls -la /www/wwwroot/tbc.xiaolin.help/client/images/

# 3. 手动创建目录
mkdir -p /www/wwwroot/tbc.xiaolin.help/client/images/albums
chmod 755 /www/wwwroot/tbc.xiaolin.help/client/images/albums
```

### 问题：PM2 进程重启

**检查**：
```bash
# 查看重启原因
pm2 logs tbc-website --lines 100

# 检查内存
pm2 monit
```

---

## 📋 部署检查清单

- [ ] 本地构建成功
- [ ] 文件上传到服务器
- [ ] 依赖安装完成（`npm install --omit=dev`）
- [ ] PM2 应用启动成功
- [ ] localhost:4321 可访问
- [ ] 127.0.0.1:4321 可访问
- [ ] Nginx 配置正确
- [ ] HTTPS 已配置（推荐）
- [ ] 图片路径正确（`client/images/albums/`）
- [ ] 上传功能正常
- [ ] 网站正常访问

---

## 🔄 更新部署

```bash
# 1. 本地重新构建
cd c:\Users\20235\Desktop\hasut.tbc\mizuki
pnpm build

# 2. 上传更新的文件
scp -r dist/* user@服务器IP:/www/wwwroot/tbc.xiaolin.help/

# 3. 重启应用
ssh user@服务器IP
cd /www/wwwroot/tbc.xiaolin.help
pm2 restart tbc-website
```

---

**部署完成后，图片应该能够正常访问！** 🎉
