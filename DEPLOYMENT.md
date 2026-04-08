# 完整部署方案 - tbc.xiaolin.help

## 📋 部署架构

```
服务器目录结构:
/www/wwwroot/tbc.xiaolin.help/
├── assets/           # 静态资源（CSS/JS/字体等）
├── client/           # 客户端静态文件
│   ├── images/albums/  # 用户上传的相册图片
│   └── ...
├── pagefind/         # 搜索索引
├── server/           # Node.js 服务端代码
│   ├── entry.mjs     # 入口文件
│   └── chunks/       # 服务端代码块
├── package.json      # 依赖配置
└── DEPLOYMENT.md     # 本文档
```

---

## 🚀 完整部署流程

### 阶段一：本地构建与上传

#### 1. 本地构建项目

```bash
# 进入项目目录
cd c:\Users\20235\Desktop\hasut.tbc\mizuki

# 清理旧的构建
rm -rf dist

# 安装依赖
pnpm install

# 构建项目
pnpm build
```

#### 2. 验证本地构建结果

确保 `dist` 目录包含以下结构：
```
dist/
├── assets/
├── client/
│   └── images/albums/  # 确保这个目录存在
├── pagefind/
└── server/
    ├── entry.mjs
    └── chunks/
```

#### 3. 上传文件到服务器

使用 SCP/SFTP 上传以下文件到服务器：

```bash
# 从本地执行（替换为你的服务器信息）
scp -r dist/assets/* user@your_server:/www/wwwroot/tbc.xiaolin.help/assets/
scp -r dist/client/* user@your_server:/www/wwwroot/tbc.xiaolin.help/client/
scp -r dist/pagefind/* user@your_server:/www/wwwroot/tbc.xiaolin.help/pagefind/
scp -r dist/server/* user@your_server:/www/wwwroot/tbc.xiaolin.help/server/
scp package.json user@your_server:/www/wwwroot/tbc.xiaolin.help/
```

或使用 SFTP 工具（如 FileZilla、WinSCP）手动上传。

---

### 阶段二：服务器环境配置

#### 1. 登录服务器并创建目录

```bash
# SSH 登录服务器
ssh user@your_server

# 进入部署目录
cd /www/wwwroot/tbc.xiaolin.help

# 确保目录结构正确
mkdir -p client/images/albums
mkdir -p server/chunks

# 验证目录结构
ls -la
```

#### 2. 安装 Node.js 依赖

```bash
cd /www/wwwroot/tbc.xiaolin.help

# 安装生产环境依赖（不安装 devDependencies）
npm install --omit=dev

# 或使用 pnpm（如果服务器安装了 pnpm）
pnpm install --prod
```

#### 3. 验证依赖安装

```bash
# 检查 node_modules 是否存在
ls -la node_modules

# 验证关键依赖
ls node_modules/@astrojs
ls node_modules/express
```

---

### 阶段三：配置 PM2（解决 localhost/127.0.0.1 问题）

#### 1. 创建 PM2 配置文件

```bash
cd /www/wwwroot/tbc.xiaolin.help

# 创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tbc-website',
    script: 'server/entry.mjs',
    cwd: '/www/wwwroot/tbc.xiaolin.help',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 4321,
      HOST: '0.0.0.0'  // 关键：绑定到所有网络接口
    },
    // 日志配置
    error_file: '/www/wwwlogs/tbc-error.log',
    out_file: '/www/wwwlogs/tbc-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // 自动重启配置
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10,
    // 优雅重启
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
}
EOF
```

#### 2. 启动应用

```bash
# 停止旧进程（如果存在）
pm2 stop tbc-website 2>/dev/null || true
pm2 delete tbc-website 2>/dev/null || true

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs tbc-website --lines 50

# 保存 PM2 配置（开机自启）
pm2 save
pm2 startup
```

#### 3. 验证端口监听

```bash
# 检查端口监听状态
netstat -tlnp | grep 4321

# 或使用 ss 命令
ss -tlnp | grep 4321

# 应该看到：
# 0.0.0.0:4321 或 :::4321（表示监听所有接口）
```

#### 4. 测试本地访问

```bash
# 测试 localhost
curl -I http://localhost:4321

# 测试 127.0.0.1
curl -I http://127.0.0.1:4321

# 测试服务器 IP（替换为你的服务器 IP）
curl -I http://YOUR_SERVER_IP:4321

# 所有请求都应该返回 HTTP 200
```

---

### 阶段四：配置 Nginx 反向代理

#### 1. 创建 Nginx 配置文件

```bash
# 创建站点配置
sudo cat > /etc/nginx/sites-available/tbc.xiaolin.help << 'EOF'
server {
    listen 80;
    server_name tbc.xiaolin.help;

    # 访问日志
    access_log /www/wwwlogs/tbc-access.log;
    error_log /www/wwwlogs/tbc-error-nginx.log;

    # 客户端最大上传大小（相册上传需要）
    client_max_body_size 100M;

    # 静态资源缓存
    location ~* \.(webp|jpg|jpeg|png|gif|svg|ico|css|js|woff2|woff|ttf|eot)$ {
        root /www/wwwroot/tbc.xiaolin.help/client;
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # 相册图片特殊处理
    location /images/albums/ {
        alias /www/wwwroot/tbc.xiaolin.help/client/images/albums/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # assets 目录
    location /assets/ {
        alias /www/wwwroot/tbc.xiaolin.help/assets/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # pagefind 搜索索引
    location /pagefind/ {
        alias /www/wwwroot/tbc.xiaolin.help/pagefind/;
        expires 7d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    # API 和动态请求代理到 Node.js
    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# 创建符号链接
sudo ln -s /etc/nginx/sites-available/tbc.xiaolin.help /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 2. 配置 HTTPS（推荐，使用 Let's Encrypt）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d tbc.xiaolin.help

# 自动续期测试
sudo certbot renew --dry-run
```

---

### 阶段五：验证部署

#### 1. 基础功能测试

```bash
# 测试主页
curl -I https://tbc.xiaolin.help

# 测试静态资源
curl -I https://tbc.xiaolin.help/assets/css/style.css

# 测试相册图片路径
curl -I https://tbc.xiaolin.help/images/albums/test/cover.jpg
```

#### 2. 相册上传功能测试

```bash
# 测试上传 API
curl -X POST https://tbc.xiaolin.help/api/upload-album.json \
  -F "info={\"title\":\"测试相册\"}" \
  -F "images=@/path/to/cover.jpg" \
  -F "images=@/path/to/photo1.jpg"
```

#### 3. 检查图片路径

```bash
# SSH 登录服务器
ssh user@your_server

# 查看相册目录
ls -la /www/wwwroot/tbc.xiaolin.help/client/images/albums/

# 查看上传后的目录结构
ls -la /www/wwwroot/tbc.xiaolin.help/client/images/albums/YOUR_ALBUM_ID/

# 应该看到：
# cover.jpg
# photo1.jpg
# info.json
```

#### 4. 查看应用日志

```bash
# PM2 日志
pm2 logs tbc-website --lines 100

# 应该看到：
# [Album Scanner] 使用生产环境路径: /www/wwwroot/tbc.xiaolin.help/client/images/albums

# Nginx 访问日志
tail -f /www/wwwlogs/tbc-access.log

# Nginx 错误日志
tail -f /www/wwwlogs/tbc-error-nginx.log
```

---

## 🔧 故障排查

### 问题 1：localhost 可以访问但 127.0.0.1 不行

**解决方案**：确保 PM2 配置中设置了 `HOST: '0.0.0.0'`

```bash
# 检查应用监听地址
netstat -tlnp | grep 4321

# 应该看到 0.0.0.0:4321 或 :::4321
# 如果看到 127.0.0.1:4321，说明配置有误
```

### 问题 2：图片无法访问（404 错误）

**检查步骤**：

```bash
# 1. 检查图片是否上传到正确位置
ls -la /www/wwwroot/tbc.xiaolin.help/client/images/albums/

# 2. 检查 Nginx 配置
cat /etc/nginx/sites-available/tbc.xiaolin.help | grep -A 5 "images/albums"

# 3. 测试 Nginx 路径映射
curl -I https://tbc.xiaolin.help/images/albums/TEST_ID/cover.jpg

# 4. 检查文件权限
ls -la /www/wwwroot/tbc.xiaolin.help/client/images/albums/
# 应该至少是 644 权限

# 5. 修复权限
chmod -R 755 /www/wwwroot/tbc.xiaolin.help/client/images/albums/
chown -R www-data:www-data /www/wwwroot/tbc.xiaolin.help/client/images/albums/
```

### 问题 3：上传 API 返回 500 错误

**检查步骤**：

```bash
# 1. 查看 PM2 错误日志
pm2 logs tbc-website --err --lines 50

# 2. 检查目录权限
ls -la /www/wwwroot/tbc.xiaolin.help/client/images/

# 3. 手动创建目录测试
mkdir -p /www/wwwroot/tbc.xiaolin.help/client/images/albums/test
chmod 755 /www/wwwroot/tbc.xiaolin.help/client/images/albums/test

# 4. 检查磁盘空间
df -h
```

### 问题 4：PM2 进程频繁重启

**检查步骤**：

```bash
# 查看重启原因
pm2 logs tbc-website --lines 100

# 查看内存使用
pm2 monit

# 检查应用内存限制
pm2 describe tbc-website | grep "memory usage"
```

---

## 📝 日常维护命令

### 更新部署

```bash
# 1. 本地重新构建
cd c:\Users\20235\Desktop\hasut.tbc\mizuki
pnpm build

# 2. 上传新文件
scp -r dist/* user@your_server:/www/wwwroot/tbc.xiaolin.help/

# 3. SSH 到服务器重启应用
ssh user@your_server
cd /www/wwwroot/tbc.xiaolin.help
pm2 restart tbc-website
```

### 查看状态

```bash
# PM2 状态
pm2 status
pm2 monit

# 磁盘使用
du -sh /www/wwwroot/tbc.xiaolin.help/*

# 相册大小
du -sh /www/wwwroot/tbc.xiaolin.help/client/images/albums/
```

### 日志管理

```bash
# 清理旧日志
pm2 flush

# 轮转日志
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## ⚠️ 重要注意事项

1. **权限设置**：确保 `www-data` 或 `nginx` 用户有写入 `client/images/albums/` 的权限
2. **备份策略**：定期备份 `client/images/albums/` 目录
3. **监控**：设置 PM2 监控和告警
4. **SSL 证书**：配置自动续期
5. **防火墙**：确保只开放 80 和 443 端口

---

## ✅ 部署检查清单

- [ ] 本地构建成功（`pnpm build`）
- [ ] dist 目录结构正确
- [ ] 文件上传到服务器
- [ ] 服务器依赖安装完成（`npm install --omit=dev`）
- [ ] PM2 配置正确（HOST: '0.0.0.0'）
- [ ] 应用启动成功（`pm2 status` 显示 online）
- [ ] localhost:4321 可访问
- [ ] 127.0.0.1:4321 可访问
- [ ] Nginx 配置正确并重启
- [ ] HTTPS 配置完成（如需要）
- [ ] 静态资源可访问
- [ ] 图片路径正确（/images/albums/ → client/images/albums/）
- [ ] 上传 API 工作正常
- [ ] 日志无错误信息

---

## 🆘 紧急回滚

如果部署出现问题，快速回滚：

```bash
# 1. 停止当前应用
pm2 stop tbc-website

# 2. 恢复备份（如果有）
cp -r /path/to/backup/* /www/wwwroot/tbc.xiaolin.help/

# 3. 重新启动
pm2 start tbc-website

# 4. 验证功能
curl -I https://tbc.xiaolin.help
```

---

**部署完成后，所有图片应该能够正常访问，上传功能应该正常工作！**
