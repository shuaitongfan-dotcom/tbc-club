<template>
  <div class="flex flex-col items-center justify-center py-12">
    <!-- Progress Circle/Icon -->
    <div class="relative w-24 h-24 mb-6">
      <svg v-if="status === 'uploading'" class="animate-spin text-[var(--primary)] w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      
      <svg v-else-if="status === 'success'" class="text-green-500 w-full h-full animate-bounce" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <svg v-else class="text-red-500 w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <div v-if="status === 'uploading'" class="absolute inset-0 flex items-center justify-center font-bold text-sm">
        {{ progress }}%
      </div>
    </div>
    
    <!-- Status Text -->
    <h3 class="text-xl font-bold mb-2">
      <span v-if="status === 'uploading'">正在上传...</span>
      <span v-else-if="status === 'success'">上传成功！</span>
      <span v-else>上传失败</span>
    </h3>
    
    <p class="text-neutral-500 mb-6 text-center">
      <span v-if="status === 'uploading'">已完成 {{ completed }} / {{ total }} 个文件</span>
      <span v-else-if="status === 'success'">图集已成功创建，即将返回相册列表</span>
      <span v-else class="text-red-500">{{ errorMessage }}</span>
    </p>
    
    <!-- Progress Bar -->
    <div class="w-full max-w-md bg-[var(--line-divider)] rounded-full h-2.5 mb-6 overflow-hidden">
      <div 
        class="bg-[var(--primary)] h-2.5 rounded-full transition-all duration-300"
        :style="{ width: `${progress}%` }"
        :class="{'bg-green-500': status === 'success', 'bg-red-500': status === 'error'}"
      ></div>
    </div>
    
    <button
      v-if="status === 'error'"
      class="px-6 py-2 bg-[var(--primary)] text-white rounded-lg shadow-sm hover:brightness-110 active:scale-95 transition-all font-medium mt-4"
      @click="$emit('retry')"
    >
      重新尝试
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  progress: number;
  total: number;
  completed: number;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
}>();

defineEmits<{
  (e: 'retry'): void;
}>();
</script>
