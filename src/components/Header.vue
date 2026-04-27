<script setup lang="ts">
import type { User } from '../composables/useStore'
import UserPicker from './UserPicker.vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps<{ users: User[]; currentUser: User | null }>()
defineEmits<{ (e: 'update:currentUser', value: User): void }>()
</script>

<template>
  <header
    class="flex items-center justify-between gap-4 px-6 py-3 border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10 dark:border-slate-800 dark:bg-slate-950/80"
  >
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 inline-flex items-center justify-center dark:bg-brand-700/20 dark:text-brand-100">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" /></svg>
      </div>
      <div>
        <div class="text-sm font-semibold tracking-tight">AI Agent · RBAC + ABAC</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">Permissions enforced at execution time</div>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <UserPicker :users="users" :model-value="currentUser" @update:model-value="$emit('update:currentUser', $event)" />
      <ThemeToggle />
    </div>
  </header>
</template>
