import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import type { AlbumGroup, Photo } from "../types/album";

// 获取正确的图片存储目录
function getAlbumsDir(): string {
	// 获取当前文件所在目录
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	// 在生产环境中，当前文件位于 dist/server/（或 dist/server/chunks/）
	// 服务器目录结构：
	// /www/wwwroot/tbc.xiaolin.help/
	// ├── assets/
	// ├── client/
	// │   └── images/albums/  <- 图片存储在这里
	// ├── pagefind/
	// └── server/
	//     └── entry.mjs
	//     └── chunks/
	//         └── album-scanner.mjs

	let distServerDir = __dirname;

	// 如果在 chunks 目录中，向上一级
	if (__dirname.endsWith('chunks')) {
		distServerDir = path.dirname(__dirname);
	}

	// distServerDir -> /www/wwwroot/tbc.xiaolin.help/server
	const distDir = path.dirname(distServerDir); // /www/wwwroot/tbc.xiaolin.help
	const clientDir = path.join(distDir, 'client'); // /www/wwwroot/tbc.xiaolin.help/client
	const albumsDir = path.join(clientDir, 'images/albums');

	// 开发环境：使用 public/images/albums
	const publicDir = path.join(process.cwd(), 'public/images/albums');

	// 检查 client 目录是否存在（生产环境标志）
	if (fs.existsSync(clientDir)) {
		console.log('[Album Scanner] 使用生产环境路径:', albumsDir);
		return albumsDir;
	}

	// 开发环境：使用 public/images/albums
	console.log('[Album Scanner] 使用开发环境路径:', publicDir);
	return publicDir;
}

export async function scanAlbums(): Promise<AlbumGroup[]> {
	const albumsDir = getAlbumsDir();
	const albums: AlbumGroup[] = [];

	// 检查目录是否存在
	if (!fs.existsSync(albumsDir)) {
		console.warn("相册目录不存在:", albumsDir);
		return [];
	}

	// 获取所有子文件夹
	const albumFolders = fs
		.readdirSync(albumsDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	// 处理每个相册文件夹
	for (const folder of albumFolders) {
		const albumPath = path.join(albumsDir, folder);
		const album = await processAlbumFolder(albumPath, folder);
		if (album) {
			albums.push(album);
		}
	}

	return albums;
}

async function processAlbumFolder(
	folderPath: string,
	folderName: string,
): Promise<AlbumGroup | null> {
	// 检查必要文件
	const infoPath = path.join(folderPath, "info.json");

	if (!fs.existsSync(infoPath)) {
		console.warn(`相册 ${folderName} 缺少 info.json 文件`);
		return null;
	}

	// 读取相册信息
	const infoContent = fs.readFileSync(infoPath, "utf-8");
	let info: Record<string, any>;
	try {
		info = JSON.parse(infoContent);
	} catch (e) {
		console.error(`相册 ${folderName} 的 info.json 格式错误:`, e);
		return null;
	}

	// 检查是否为外链模式
	const isExternalMode = info.mode === "external";
	let photos: Photo[] = [];
	let cover: string;

	if (isExternalMode) {
		// 外链模式：从 info.json 中获取封面和照片
		if (!info.cover) {
			console.warn(`相册 ${folderName} 外链模式缺少 cover 字段`);
			return null;
		}

		cover = info.cover;
		photos = processExternalPhotos(info.photos || [], folderName);
	} else {
		// 本地模式：检查本地文件
		let coverPath = path.join(folderPath, "cover.webp");
		const hasWebpCover = fs.existsSync(coverPath);
		if (!hasWebpCover) {
			coverPath = path.join(folderPath, "cover.jpg");
			if (!fs.existsSync(coverPath)) {
				console.warn(`相册 ${folderName} 缺少 cover 文件`);
				return null;
			}
		}

		cover = hasWebpCover
			? `/images/albums/${folderName}/cover.webp`
			: `/images/albums/${folderName}/cover.jpg`;
		photos = scanPhotos(folderPath, folderName);
	}

	// 检查是否隐藏相册
	if (info.hidden === true) {
		console.log(`相册 ${folderName} 已设置为隐藏，跳过显示`);
		return null;
	}

	// 构建相册对象
	return {
		id: folderName,
		title: info.title || folderName,
		description: info.description || "",
		cover,
		date: info.date || new Date().toISOString().split("T")[0],
		location: info.location || "",
		tags: info.tags || [],
		layout: info.layout || "grid",
		columns: info.columns || 3,
		photos,
	};
}

function scanPhotos(folderPath: string, albumId: string): Photo[] {
	const photos: Photo[] = [];
	const files = fs.readdirSync(folderPath);

	const imageExtensions = [
		".jpg",
		".jpeg",
		".png",
		".gif",
		".webp",
		".svg",
		".avif",
		".bmp",
		".tiff",
		".tif",
	];

	const imageFiles = files.filter((file) => {
		const ext = path.extname(file).toLowerCase();
		return (
			imageExtensions.includes(ext) &&
			file !== "cover.jpg" &&
			file !== "cover.webp"
		);
	});

	const fileWebpMap = new Map<string, string>();
	for (const file of imageFiles) {
		const baseName = path.basename(file, path.extname(file));
		const ext = path.extname(file).toLowerCase();
		if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
			if (imageFiles.includes(baseName + ".webp")) {
				fileWebpMap.set(file, baseName + ".webp");
			}
		}
	}

	imageFiles.forEach((file, index) => {
		const filePath = path.join(folderPath, file);
		const stats = fs.statSync(filePath);

		const { baseName, tags } = parseFileName(file);

		const src = fileWebpMap.has(file)
			? `/images/albums/${albumId}/${fileWebpMap.get(file)}`
			: `/images/albums/${albumId}/${file}`;

		photos.push({
			id: `${albumId}-photo-${index}`,
			src,
			alt: baseName,
			title: baseName,
			tags: tags,
			date: stats.mtime.toISOString().split("T")[0],
		});
	});

	return photos;
}

function processExternalPhotos(
	externalPhotos: any[],
	albumId: string,
): Photo[] {
	const photos: Photo[] = [];

	externalPhotos.forEach((photo, index) => {
		if (!photo.src) {
			console.warn(
				`相册 ${albumId} 的第 ${index + 1} 张照片缺少 src 字段`,
			);
			return;
		}

		photos.push({
			id: photo.id || `${albumId}-external-photo-${index}`,
			src: photo.src,
			thumbnail: photo.thumbnail,
			alt: photo.alt || photo.title || `Photo ${index + 1}`,
			title: photo.title,
			description: photo.description,
			tags: photo.tags || [],
			date: photo.date || new Date().toISOString().split("T")[0],
			location: photo.location,
			width: photo.width,
			height: photo.height,
			// camera: photo.camera,
			// lens: photo.lens,
			// settings: photo.settings,
		});
	});

	return photos;
}

function parseFileName(fileName: string): { baseName: string; tags: string[] } {
	// 匹配文件名中的标签，格式为：文件名_标签1_标签2.扩展名
	const parts = path.basename(fileName, path.extname(fileName)).split("_");

	if (parts.length > 1) {
		// 第一部分作为基本名称，其余部分作为标签
		const baseName = parts.slice(0, -2).join("_");
		const tags = parts.slice(-2);
		return { baseName, tags };
	}

	// 如果没有标签，返回不带扩展名的文件名
	const baseName = path.basename(fileName, path.extname(fileName));
	return { baseName, tags: [] };
}
