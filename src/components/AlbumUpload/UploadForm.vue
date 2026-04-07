<template>
  <form @submit.prevent="submitForm" class="flex flex-col gap-5">
    <!-- Title -->
    <div>
      <label class="block text-sm font-medium mb-1">
        相册名称 *
        <span v-if="titleError" class="text-red-500 text-xs ml-2">{{ titleError }}</span>
      </label>
      <input
        v-model="form.title"
        type="text"
        placeholder="例如: 夏日祭典"
        class="w-full px-3 py-2 bg-transparent border rounded-lg focus:outline-none transition-colors"
        :class="titleError ? 'border-red-500 focus:border-red-500' : 'border-[var(--line-divider)] focus:border-[var(--primary)]'"
        @input="titleError = ''"
      />
    </div>

    <!-- Description -->
    <div>
      <label class="block text-sm font-medium mb-1">描述</label>
      <textarea
        v-model="form.description"
        rows="3"
        placeholder="关于这个图集的描述..."
        class="w-full px-3 py-2 bg-transparent border border-[var(--line-divider)] rounded-lg focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
      ></textarea>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <!-- Date -->
      <div>
        <label class="block text-sm font-medium mb-1">创建日期</label>
        <input
          v-model="form.date"
          type="date"
          class="w-full px-3 py-2 bg-transparent border border-[var(--line-divider)] rounded-lg focus:outline-none focus:border-[var(--primary)] transition-colors custom-date-input"
        />
      </div>

      <!-- Location -->
      <div>
        <label class="block text-sm font-medium mb-1">地址</label>
        <input
          v-model="form.location"
          type="text"
          placeholder="例如: 东京"
          class="w-full px-3 py-2 bg-transparent border border-[var(--line-divider)] rounded-lg focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <!-- Columns -->
      <div>
        <label class="block text-sm font-medium mb-1">展示列数</label>
        <select
          v-model.number="form.columns"
          class="w-full px-3 py-2 bg-transparent border border-[var(--line-divider)] rounded-lg focus:outline-none focus:border-[var(--primary)] transition-colors custom-select"
        >
          <option :value="2">2 列</option>
          <option :value="3">3 列</option>
          <option :value="4">4 列</option>
        </select>
      </div>

      <!-- Tags -->
      <div>
        <label class="block text-sm font-medium mb-1">标签</label>
        <div class="w-full min-h-[42px] px-3 py-1.5 bg-transparent border border-[var(--line-divider)] rounded-lg focus-within:border-[var(--primary)] transition-colors flex flex-wrap gap-2 items-center">
          <span
            v-for="(tag, index) in form.tags"
            :key="index"
            class="flex items-center gap-1 bg-[var(--btn-regular-bg)] px-2 py-0.5 rounded-md text-xs"
          >
            {{ tag }}
            <button
              type="button"
              class="hover:text-red-500 transition-colors"
              @click="removeTag(index)"
            >
              &times;
            </button>
          </span>
          <input
            v-model="tagInput"
            type="text"
            placeholder="输入后回车添加"
            class="bg-transparent border-none focus:outline-none flex-1 min-w-[100px] text-sm"
            @keydown.enter.prevent="addTag"
            @keydown.comma.prevent="addTag"
            @blur="addTag"
          />
        </div>
      </div>
    </div>

    <!-- File Upload -->
    <div>
      <label class="block text-sm font-medium mb-1">图片文件 *</label>
      <div
        class="border-2 border-dashed border-[var(--line-divider)] hover:border-[var(--primary)] rounded-xl p-8 text-center transition-colors flex flex-col items-center justify-center cursor-pointer relative"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          @change="handleFileSelect"
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-neutral-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p class="text-neutral-600 dark:text-neutral-400 font-medium">点击选择或拖拽图片到这里</p>
        <p class="text-sm text-neutral-500 mt-1">支持多选，必须包含一张 <strong class="text-[var(--primary)]">cover.jpg</strong></p>
        <p class="text-xs text-neutral-500 mt-2">支持拖拽整个文件夹，或 <label class="text-[var(--primary)] cursor-pointer hover:underline"><input type="file" multiple webkitdirectory directory class="hidden" @change="handleFileSelect" />选择文件夹</label></p>
      </div>

      <!-- File List Preview -->
      <div v-if="selectedFiles.length > 0" class="mt-3 text-sm">
        <p class="mb-2">已选择 <span class="font-bold text-[var(--primary)]">{{ selectedFiles.length }}</span> 个文件:</p>
        <div class="max-h-32 overflow-y-auto border border-[var(--line-divider)] rounded-lg bg-[var(--btn-regular-bg)] p-2">
          <div v-for="file in selectedFiles" :key="file.name" class="flex justify-between items-center py-1 border-b border-[var(--line-divider)] last:border-0">
            <span class="truncate pr-4 flex-1 text-xs" :class="{'text-[var(--primary)] font-bold': file.name.toLowerCase() === 'cover.jpg'}">
              {{ file.name }}
            </span>
            <span class="text-xs text-neutral-500">{{ formatSize(file.size) }}</span>
          </div>
        </div>
      </div>
      <p v-if="formError" class="text-red-500 text-sm mt-2">{{ formError }}</p>
    </div>

    <!-- Submit -->
    <div class="flex justify-end gap-3 mt-4">
      <button
        type="submit"
        class="px-6 py-2 bg-[var(--primary)] text-white rounded-lg shadow-sm hover:brightness-110 active:scale-95 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="selectedFiles.length === 0"
      >
        开始上传
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { validateFiles } from '../../utils/validateCover';
import type { AlbumInfo } from '../../types/album';

const emit = defineEmits<{
  (e: 'submit', formData: FormData, files: File[]): void;
}>();

const form = reactive<AlbumInfo>({
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  location: '',
  tags: [],
  columns: 3,
  layout: 'masonry'
});

const tagInput = ref('');
const selectedFiles = ref<File[]>([]);
const isDragging = ref(false);
const formError = ref('');
const titleError = ref('');

const addTag = () => {
  const tag = tagInput.value.trim().replace(/,/g, '');
  if (tag && !form.tags?.includes(tag)) {
    if (!form.tags) form.tags = [];
    form.tags.push(tag);
  }
  tagInput.value = '';
};

const removeTag = (index: number) => {
  form.tags?.splice(index, 1);
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    addFiles(Array.from(target.files));
  }
  target.value = ''; // Reset
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
};

const addFiles = (files: File[]) => {
  formError.value = '';
  
  // Filter and deduplicate files by name
  const existingNames = new Set(selectedFiles.value.map(f => f.name));
  const newFiles = files.filter(f => {
    // Basic type filter
    if (!f.type.startsWith('image/') && !/\.(jpg|jpeg|png|webp)$/i.test(f.name)) return false;
    if (existingNames.has(f.name)) return false;
    return true;
  });
  
  selectedFiles.value = [...selectedFiles.value, ...newFiles];
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const submitForm = () => {
  formError.value = '';
  titleError.value = '';
  
  if (!form.title.trim()) {
    titleError.value = '请填写相册名称';
    return;
  }
  
  const validation = validateFiles(selectedFiles.value);
  if (!validation.valid) {
    formError.value = validation.error || '文件验证失败';
    return;
  }
  
  const formData = new FormData();
  formData.append('info', JSON.stringify(form));
  
  selectedFiles.value.forEach(file => {
    formData.append('images', file);
  });
  
  emit('submit', formData, selectedFiles.value);
};
</script>

<style scoped>
/* 消除原生的下拉选择和日期选择黑闪与高亮背景 */
select.custom-select,
input.custom-date-input {
  -webkit-tap-highlight-color: transparent;
}

/* 调整日期图标在深色/浅色模式下的可见度 */
.custom-date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.custom-date-input:hover::-webkit-calendar-picker-indicator {
  opacity: 1;
}
:global(.dark) .custom-date-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
}
</style>
