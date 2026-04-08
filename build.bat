@echo off
chcp 65001 >nul
echo ======================================
echo   tbc.xiaolin.help 本地构建脚本
echo ======================================
echo.

echo [1/3] 清理旧的构建...
if exist "dist" (
    echo 删除 dist 目录...
    rmdir /s /q dist
)
echo.

echo [2/3] 安装依赖...
call pnpm install
if errorlevel 1 (
    echo 错误：依赖安装失败
    pause
    exit /b 1
)
echo.

echo [3/3] 构建项目...
call pnpm build
if errorlevel 1 (
    echo 错误：构建失败
    pause
    exit /b 1
)
echo.

echo ======================================
echo   构建完成！
echo ======================================
echo.
echo dist 目录结构：
dir /b dist
echo.
echo 下一步：
echo 1. 使用 SCP/SFTP 上传 dist 文件夹内容到服务器
echo 2. 在服务器运行 deploy.sh 脚本
echo 3. 配置 Nginx 反向代理
echo.
pause
