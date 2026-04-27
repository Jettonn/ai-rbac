<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '../composables/useStore'
import type { Role } from '../auth/roles'

const props = defineProps<{ users: User[]; modelValue: User | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: User): void }>()

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  accountant: 'Accountant',
  employee: 'Employee',
}

const ROLE_DOT: Record<Role, string> = {
  admin: 'bg-amber-500',
  accountant: 'bg-violet-500',
  employee: 'bg-emerald-500',
}

const grouped = computed(() => {
  const groups: Record<Role, User[]> = { admin: [], accountant: [], employee: [] }
  for (const u of props.users) groups[u.role]?.push(u)
  return groups
})

function pick(u: User, e: Event) {
  emit('update:modelValue', u)
  ;(e.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')
}
</script>

<template>
  <div class="inline-flex items-center gap-2.5">
    <span class="text-xs text-slate-500 dark:text-slate-400">Logged in as</span>
    <details v-if="modelValue" class="relative">
      <summary
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-sm text-slate-900 cursor-pointer list-none hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="ROLE_DOT[modelValue.role]" />
        <span class="font-medium">{{ modelValue.name }}</span>
        <span class="text-xs text-slate-500 dark:text-slate-400">{{ ROLE_LABEL[modelValue.role] }}</span>
        <span class="text-slate-400">▾</span>
      </summary>
      <div
        class="absolute right-0 top-[calc(100%+6px)] min-w-[280px] rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl z-30 dark:border-slate-700 dark:bg-slate-900"
      >
        <template v-for="role in (['admin', 'accountant', 'employee'] as Role[])" :key="role">
          <div v-if="grouped[role]?.length" class="mb-1 last:mb-0">
            <div class="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1.5 text-slate-500 dark:text-slate-400">
              {{ ROLE_LABEL[role] }}
            </div>
            <button
              v-for="u in grouped[role]"
              :key="u.id"
              type="button"
              class="w-full grid grid-cols-[12px_1fr_auto] gap-2 items-center px-2.5 py-1.5 rounded text-left text-sm text-slate-900 hover:bg-slate-50 transition dark:text-slate-100 dark:hover:bg-slate-800"
              :class="{ 'bg-brand-50 dark:bg-slate-800': modelValue.id === u.id }"
              @click="pick(u, $event)"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="ROLE_DOT[u.role]" />
              <span>{{ u.name }}</span>
              <span class="text-[11px] text-slate-500 mono dark:text-slate-400">{{ u.email }}</span>
            </button>
          </div>
        </template>
      </div>
    </details>
  </div>
</template>
