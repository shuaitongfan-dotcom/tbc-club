export function hasValidCover(files: File[]): boolean {
  return files.some(
    (file) => file.name.toLowerCase() === 'cover.jpg'
  );
}

export function validateFiles(files: File[]): { valid: boolean; error?: string } {
  if (files.length === 0) {
    return { valid: false, error: '请选择要上传的图片' };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

  for (const file of files) {
    if (!allowedTypes.includes(file.type) && !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
      return { valid: false, error: `文件格式不支持: ${file.name}` };
    }
    if (file.size > maxSizeBytes) {
      return { valid: false, error: `单张图片不能超过 5MB: ${file.name}` };
    }
  }

  if (!hasValidCover(files)) {
    return { valid: false, error: '请确保包含 cover.jpg 作为封面' };
  }

  return { valid: true };
}

export function validateForm(form: { title: string; date?: string; columns?: number }): { valid: boolean; error?: string } {
  if (!form.title || form.title.trim() === '') {
    return { valid: false, error: '相册名称不能为空' };
  }
  
  if (form.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      return { valid: false, error: '日期格式必须为 YYYY-MM-DD' };
    }
  }
  
  if (form.columns !== undefined) {
    if (form.columns < 2 || form.columns > 4) {
      return { valid: false, error: '展示列数必须在 2 到 4 之间' };
    }
  }
  
  return { valid: true };
}
