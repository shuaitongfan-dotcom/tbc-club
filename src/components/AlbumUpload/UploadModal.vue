<template>
  <Teleport defer to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity"
      @click.self="$emit('close')"
    >
      <div
        class="bg-[var(--card-bg)] text-neutral-900 dark:text-neutral-100 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col border border-[var(--line-divider)]"
      >
          <!-- Header -->
        <div class="px-6 py-4 border-b border-[var(--line-divider)] flex justify-between items-center">
          <h2 class="text-xl font-bold">上传新图集</h2>
          <button
            class="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            @click="$emit('close')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto flex-1">
          <UploadForm v-if="!isUploading" @submit="handleUpload" />
          <UploadProgress
            v-else
            :progress="progress"
            :total="totalFiles"
            :completed="completedFiles"
            :status="uploadStatus"
            :error-message="errorMessage"
            @retry="retryUpload"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UploadForm from './UploadForm.vue';
import UploadProgress from './UploadProgress.vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isUploading = ref(false);
const progress = ref(0);
const totalFiles = ref(0);
const completedFiles = ref(0);
const uploadStatus = ref<'uploading' | 'success' | 'error'>('uploading');
const errorMessage = ref('');

// To hold data across retries
let savedFormData: FormData | null = null;

const handleUpload = async (formData: FormData, files: File[]) => {
  isUploading.value = true;
  uploadStatus.value = 'uploading';
  progress.value = 0;
  totalFiles.value = files.length;
  completedFiles.value = 0;
  errorMessage.value = '';
  
  savedFormData = formData;

  await performUpload(formData);
};

const performUpload = async (formData: FormData) => {
  try {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        progress.value = Math.round((event.loaded / event.total) * 100);
        // Estimate completed files based on progress
        completedFiles.value = Math.min(
          totalFiles.value,
          Math.round((event.loaded / event.total) * totalFiles.value)
        );
      }
    });

    const response = await new Promise((resolve, reject) => {
      xhr.open('POST', '/api/upload-album.json');
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || '上传失败'));
          } catch {
            reject(new Error(`上传失败 (${xhr.status})`));
          }
        }
      };
      
      xhr.onerror = () => reject(new Error('网络错误，上传失败'));
      
      // Cleanup XMLHttpRequest logic inside promise to prevent memory leak
      xhr.onloadend = () => {
        // Just as a safety net in complex scenarios
      };

      xhr.send(formData);
    });

    uploadStatus.value = 'success';
    completedFiles.value = totalFiles.value;
    progress.value = 100;
    
    // Show toast for success and close modal
    showToast('上传成功！');
    setTimeout(() => {
      emit('close');
      window.location.reload(); // Refresh to see the new album
    }, 500); // Reduced from 1500 to 500ms
    
  } catch (error: any) {
    uploadStatus.value = 'error';
    errorMessage.value = error.message || '上传过程中发生错误';
    showToast(errorMessage.value, 'error');
  }
};

const retryUpload = () => {
  if (savedFormData) {
    uploadStatus.value = 'uploading';
    performUpload(savedFormData);
  }
};

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Simple toast implementation since we don't know the exact toast system in use
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-[100] transition-opacity duration-300 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 1500);
};
</script>
