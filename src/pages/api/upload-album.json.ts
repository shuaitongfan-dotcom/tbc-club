import fs from 'node:fs/promises';
import path from 'node:path';

import type { APIRoute } from 'astro';

import { generateAlbumId } from '../../utils/randomId';

export const prerender = false;

export async function GET() {
  return new Response(JSON.stringify({ status: 'ok', message: 'Upload API is running' }), { status: 200 });
}

export async function POST({ request }: { request: Request }) {
  try {
    // 验证请求方法和内容类型
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: '无效的内容类型' }), { status: 415 });
    }

    const formData = await request.formData();

    const infoStr = formData.get('info') as string;
    if (!infoStr) {
      return new Response(JSON.stringify({ error: '缺少相册信息 (info)' }), { status: 400 });
    }

    let info;
    try {
      info = JSON.parse(infoStr);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'info 格式错误' }), { status: 400 });
    }

    const images = formData.getAll('images') as File[];
    if (!images || images.length === 0) {
      return new Response(JSON.stringify({ error: '缺少图片文件' }), { status: 400 });
    }

    // Check for cover.jpg
    const hasCover = images.some(file => file.name.toLowerCase() === 'cover.jpg');
    if (!hasCover) {
      return new Response(JSON.stringify({ error: '缺少 cover.jpg' }), { status: 400 });
    }

    const albumId = generateAlbumId();
    // 在生产环境中，静态资源位于 client/images/albums
    // 需要向上一级找到 client 目录
    const __dirname = process.cwd();
    const distDir = __dirname; // /www/wwwroot/tbc.xiaolin.help
    const clientDir = path.join(distDir, 'client');
    const albumsDir = path.join(clientDir, 'images/albums');
    const albumDir = path.join(albumsDir, albumId);

    // Create directory
    await fs.mkdir(albumDir, { recursive: true });

    // Write images
    for (const file of images) {
      // Basic security check to prevent directory traversal
      const safeFileName = path.basename(file.name);
      const filePath = path.join(albumDir, safeFileName);

      const buffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(buffer));
    }

    // Write info.json
    // 强制清理与重组最终的 info 数据，确保格式和安全性
    const finalInfo = {
      title: typeof info.title === 'string' && info.title.trim() ? info.title.trim() : albumId,
      hidden: Boolean(info.hidden),
      description: typeof info.description === 'string' ? info.description.trim() : '',
      date: typeof info.date === 'string' && info.date ? info.date : new Date().toISOString().split('T')[0],
      location: typeof info.location === 'string' ? info.location.trim() : '',
      tags: Array.isArray(info.tags) ? info.tags.filter(t => typeof t === 'string').map(t => t.trim()) : [],
      layout: 'masonry', // 业务需求固定布局
      columns: typeof info.columns === 'number' && info.columns >= 2 && info.columns <= 4 ? info.columns : 3,
    };

    await fs.writeFile(
      path.join(albumDir, 'info.json'),
      JSON.stringify(finalInfo, null, 2),
      'utf-8'
    );

    return new Response(JSON.stringify({
      success: true,
      albumId,
      coverUrl: `/images/albums/${albumId}/cover.jpg`
    }), { status: 200 });

  } catch (error: any) {
    console.error('Album upload error:', error);
    return new Response(JSON.stringify({ error: error.message || '上传处理失败' }), { status: 500 });
  }
};
