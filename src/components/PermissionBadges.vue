<script setup lang="ts">
import { computed } from 'vue'
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, type Role } from '../auth/roles'

const props = defineProps<{ role: Role }>()
const granted = computed(() => new Set(ROLE_PERMISSIONS[props.role] ?? []))
</script>

<template>
  <div class="flex flex-wrap gap-1.5">
    <span
      v-for="p in ALL_PERMISSIONS"
      :key="p"
      class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] mono"
      :class="
        granted.has(p)
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'border-slate-200 text-slate-400 line-through dark:border-slate-700 dark:text-slate-500'
      "
    >
      {{ granted.has(p) ? '✓' : '✗' }} {{ p }}
    </span>
  </div>
</template>
