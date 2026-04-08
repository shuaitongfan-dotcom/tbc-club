#!/bin/bash

# ============================================================
# tbc.xiaolin.help 快速部署脚本
# 使用方法：bash deploy.sh
# ============================================================

set -e

echo "======================================"
echo "  tbc.xiaolin.help 部署脚本"
echo "======================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
DEPLOY_DIR="/www/wwwroot/tbc.xiaolin.help"
PM2_APP_NAME="tbc-website"
LOG_DIR="/www/wwwlogs"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户或 sudo 执行此脚本${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[1/7] 检查部署目录...${NC}"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}部署目录不存在，正在创建...${NC}"
    mkdir -p "$DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"

echo ""
echo -e "${GREEN}[2/7] 创建必要的目录结构...${NC}"
mkdir -p client/images/albums
mkdir -p server/chunks
mkdir -p "$LOG_DIR"
echo -e "${GREEN}✓ 目录结构创建完成${NC}"

echo ""
echo -e "${GREEN}[3/7] 检查 Node.js 环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误：未找到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

echo ""
echo -e "${GREEN}[4/7] 安装依赖...${NC}"
if [ -f "package.json" ]; then
    npm install --omit=dev
    echo -e "${GREEN}✓ 依赖安装完成${NC}"
else
    echo -e "${RED}错误：未找到 package.json 文件${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[5/7] 配置 PM2...${NC}"

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
      HOST: '0.0.0.0'
    },
    error_file: '/www/wwwlogs/tbc-error.log',
    out_file: '/www/wwwlogs/tbc-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10,
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
}
EOF

echo -e "${GREEN}✓ PM2 配置文件创建完成${NC}"

echo ""
echo -e "${GREEN}[6/7] 启动应用...${NC}"

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 未安装，正在安装...${NC}"
    npm install -g pm2
fi

# 停止旧进程
pm2 stop $PM2_APP_NAME 2>/dev/null || true
pm2 delete $PM2_APP_NAME 2>/dev/null || true

# 启动新进程
pm2 start ecosystem.config.js

# 等待应用启动
echo "等待应用启动..."
sleep 3

# 检查状态
if pm2 describe $PM2_APP_NAME | grep -q "online"; then
    echo -e "${GREEN}✓ 应用启动成功${NC}"
    pm2 status
else
    echo -e "${RED}✗ 应用启动失败，请检查日志${NC}"
    pm2 logs $PM2_APP_NAME --lines 20
    exit 1
fi

echo ""
echo -e "${GREEN}[7/7] 验证部署...${NC}"

# 等待端口监听
sleep 2

# 测试本地访问
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4321 | grep -q "200"; then
    echo -e "${GREEN}✓ localhost:4321 访问正常${NC}"
else
    echo -e "${YELLOW}⚠ localhost:4321 访问异常${NC}"
fi

if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4321 | grep -q "200"; then
    echo -e "${GREEN}✓ 127.0.0.1:4321 访问正常${NC}"
else
    echo -e "${YELLOW}⚠ 127.0.0.1:4321 访问异常${NC}"
fi

# 检查端口监听
echo ""
echo "端口监听状态:"
netstat -tlnp 2>/dev/null | grep 4321 || ss -tlnp | grep 4321

echo ""
echo "======================================"
echo -e "${GREEN}部署完成！${NC}"
echo "======================================"
echo ""
echo "后续步骤："
echo "1. 配置 Nginx 反向代理（参考 DEPLOYMENT.md）"
echo "2. 配置 SSL 证书（推荐）"
echo "3. 测试上传功能"
echo ""
echo "常用命令："
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs $PM2_APP_NAME"
echo "  重启应用: pm2 restart $PM2_APP_NAME"
echo "  保存配置: pm2 save"
echo ""

# 保存 PM2 配置
pm2 save

echo -e "${GREEN}✓ PM2 配置已保存${NC}"
echo ""
echo "部署脚本执行完成！"
