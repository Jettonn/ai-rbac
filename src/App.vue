<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Header from './components/Header.vue'
import PermissionBadges from './components/PermissionBadges.vue'
import InvoiceList from './components/InvoiceList.vue'
import ChatPanel from './components/ChatPanel.vue'
import { useAgent } from './composables/useAgent'
import { useStore } from './composables/useStore'
import { visibleInvoices } from './auth/can'
import type { User } from './composables/useStore'

const { lines, isLoading, runAgent, clearLines, resetConversation } = useAgent()
const { users, invoices, outbox, currentUser, resetStore } = useStore()

const sidebarTab = ref<'invoices' | 'outbox'>('invoices')

const currentRole = computed(() => currentUser.value?.role ?? 'employee')
const currentUserId = computed(() => currentUser.value?.id)

// ABAC-filtered list — what the current user is allowed to see
const visible = computed(() =>
  currentUser.value ? visibleInvoices(currentUser.value, invoices.value) : [],
)

watch(
  () => currentUser.value?.id,
  (next, prev) => {
    if (prev && next && next !== prev) {
      resetConversation(`switched user — new conversation`)
    }
  },
)

function onSubmit(message: string) {
  if (!currentUser.value) return
  runAgent(message, currentUser.value)
}
function onUpdateUser(u: User) {
  currentUser.value = u
}
async function onReset() {
  await resetStore()
  clearLines()
}
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
    <Header :users="users" :current-user="currentUser" @update:current-user="onUpdateUser" />

    <main class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 p-4 max-w-[1400px] w-full mx-auto">
      <!-- Chat pane -->
      <section class="flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <ChatPanel :lines="lines" :is-loading="isLoading" @submit="onSubmit" />
      </section>

      <!-- Sidebar -->
      <aside class="flex flex-col gap-3 min-h-0">
        <!-- Permissions -->
        <div class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Permissions · {{ currentRole }}
          </div>
          <PermissionBadges :role="currentRole" />
        </div>

        <!-- Records (tabs) -->
        <div class="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 flex-1 min-h-[200px] dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-center justify-between mb-3">
            <div class="inline-flex bg-slate-100 rounded-full p-0.5 dark:bg-slate-800">
              <button
                class="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition"
                :class="sidebarTab === 'invoices' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'"
                @click="sidebarTab = 'invoices'"
              >
                Invoices · {{ visible.length }}/{{ invoices.length }}
              </button>
              <button
                class="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition"
                :class="sidebarTab === 'outbox' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'"
                @click="sidebarTab = 'outbox'"
              >
                Outbox · {{ outbox.length }}
              </button>
            </div>
            <button class="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 dark:text-slate-400 dark:hover:text-slate-200" @click="onReset">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
              Reset
            </button>
          </div>
          <div class="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
            <InvoiceList v-if="sidebarTab === 'invoices'" :invoices="visible" :users="users" :current-user-id="currentUserId" />
            <div v-else-if="outbox.length === 0" class="text-xs text-slate-500 mono py-2">no emails sent</div>
            <ul v-else class="flex flex-col gap-2">
              <li
                v-for="(e, i) in outbox"
                :key="i"
                class="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <div class="flex justify-between text-[10.5px] text-slate-500 mono dark:text-slate-400">
                  <span class="text-brand-600 dark:text-brand-300">{{ e.to }}</span>
                  <span>{{ new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
                </div>
                <div class="font-medium text-slate-900 mt-0.5 dark:text-slate-100">{{ e.subject }}</div>
                <div class="text-slate-500 mt-1 whitespace-pre-wrap dark:text-slate-400 text-[11px]">{{ e.body }}</div>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>
