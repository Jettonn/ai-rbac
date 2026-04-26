<script setup lang="ts">
import type { Invoice, User } from '../composables/useStore'

defineProps<{ invoices: Invoice[]; users: User[]; currentUserId: string | undefined }>()

function creatorName(users: User[], id: string): string {
  return users.find(u => u.id === id)?.name ?? `#${id}`
}

const STATUS_CLASS: Record<Invoice['status'], string> = {
  paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  sent:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  draft:   'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}
</script>

<template>
  <div v-if="invoices.length === 0" class="text-xs text-slate-500 mono py-2">no invoices visible</div>
  <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800">
    <li
      v-for="inv in invoices"
      :key="inv.id"
      class="grid grid-cols-[36px_1fr] gap-2.5 py-2.5"
      :class="inv.status === 'draft' ? 'border-l-2 border-dashed border-slate-300 pl-2 dark:border-slate-600' : ''"
    >
      <div class="text-[11px] text-slate-400 mono pt-1">#{{ inv.id }}</div>
      <div class="min-w-0">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-slate-900 truncate dark:text-slate-100">{{ inv.customer }}</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold lowercase shrink-0" :class="STATUS_CLASS[inv.status]">{{ inv.status }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap mt-0.5">
          <span class="mono text-slate-700 dark:text-slate-300">${{ inv.amount.toLocaleString() }}</span>
          <span class="text-slate-300 dark:text-slate-600">·</span>
          <span v-if="inv.created_by === currentUserId" class="px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold dark:bg-brand-700/30 dark:text-brand-200">👤 you</span>
          <span v-else>by {{ creatorName(users, inv.created_by) }}</span>
          <span class="text-slate-300 dark:text-slate-600">·</span>
          <span class="mono text-[10px]">{{ inv.created_at }}</span>
        </div>
      </div>
    </li>
  </ul>
</template>
