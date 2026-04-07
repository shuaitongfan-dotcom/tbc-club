<template>
  <button
    class="flex items-center justify-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md hover:brightness-110 transition-all active:scale-95 absolute right-9 top-6 z-50 cursor-pointer"
    @click="isModalOpen = true"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    <span class="font-medium">新建图集</span>
  </button>
  
  <UploadModal v-if="isModalOpen" @close="isModalOpen = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UploadModal from './UploadModal.vue';

const isModalOpen = ref(false);
</script>
