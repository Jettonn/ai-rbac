<script setup lang="ts">
import { ref, watch, nextTick, useTemplateRef } from 'vue'
import type { TerminalLine } from '../composables/useAgent'

const props = defineProps<{
  lines: TerminalLine[]
  isLoading: boolean
}>()
const emit = defineEmits<{ (e: 'submit', value: string): void }>()

const SUGGESTIONS = [
  { label: 'List invoices', prompt: 'list invoices' },
  { label: 'Monthly report', prompt: 'monthly report' },
  { label: 'Forward to accountant', prompt: 'forward report to accountant' },
  { label: 'Create invoice', prompt: 'create invoice for Acme Corp for $1500' },
  { label: 'Approve invoice 31', prompt: 'approve invoice 31' },
  { label: 'Delete invoice 9', prompt: 'delete invoice 9' },
]

const input = ref('')
const textareaRef = useTemplateRef<HTMLTextAreaElement>('textareaRef')
const scroller = ref<HTMLDivElement | null>(null)

watch(
  () => props.lines.length + (props.isLoading ? 1 : 0),
  async () => {
    await nextTick()
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  },
)

async function autoGrow() {
  await nextTick()
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}
function send(value?: string) {
  const v = (value ?? input.value).trim()
  if (!v || props.isLoading) return
  emit('submit', v)
  input.value = ''
  autoGrow()
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

function strip(text: string, prefix: RegExp) {
  return text.replace(prefix, '')
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- Chat scroll area -->
    <div
      ref="scroller"
      class="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-3"
    >
      <div v-if="lines.length === 0" class="m-auto text-center max-w-sm py-10">
        <div class="w-11 h-11 rounded-full bg-brand-100 text-brand-600 inline-flex items-center justify-center mb-3 dark:bg-brand-700/20 dark:text-brand-200">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>
        </div>
        <h3 class="text-base font-semibold mb-1">Start a conversation</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">Pick a user, then send a message or tap a suggestion.</p>
      </div>

      <template v-for="(l, i) in lines" :key="i">
        <div v-if="l.type === 'user'" class="flex justify-end">
          <div class="max-w-[85%] rounded-[18px_18px_4px_18px] px-3.5 py-2 text-sm bg-brand-100 text-brand-900 border border-brand-200 dark:bg-brand-700/20 dark:text-brand-100 dark:border-brand-700/40">
            {{ strip(l.text, /^\[[^\]]+\]\s*>\s*/) }}
          </div>
        </div>
        <div v-else-if="l.type === 'agent'" class="flex gap-3 items-start">
          <div class="w-6 h-6 rounded-full border border-slate-200 bg-white text-brand-600 inline-flex items-center justify-center shrink-0 mt-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-brand-200">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>
          </div>
          <div class="text-sm leading-relaxed pt-0.5 whitespace-pre-wrap break-words flex-1">{{ strip(l.text, /^agent:\s*/i) }}</div>
        </div>
        <div v-else-if="l.type === 'tool'" class="self-start ml-9 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs mono bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/60">
          <span>›_</span>
          <code>{{ strip(l.text, /^tool_use:\s*/) }}</code>
        </div>
        <div v-else-if="l.type === 'allowed'" class="self-start ml-9 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/60">
          <span>✓</span>
          <span>{{ strip(l.text, /^✓\s*/) }}</span>
        </div>
        <div v-else-if="l.type === 'blocked-rbac'" class="self-start ml-9 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/60">
          <span>🔒</span>
          <span>{{ strip(l.text, /^(RBAC:|⚠|✗)\s*/) }}</span>
        </div>
        <div v-else-if="l.type === 'blocked-abac'" class="self-start ml-9 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs bg-violet-50 text-violet-800 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800/60">
          <span>🛡</span>
          <span>{{ strip(l.text, /^ABAC:\s*/) }}</span>
        </div>
        <div v-else-if="l.type === 'thinking'" class="self-start ml-9 italic text-xs text-slate-500 dark:text-slate-400">
          {{ strip(l.text, /^\/\/\s*/) }}
        </div>
      </template>

      <div v-if="isLoading" class="flex gap-3 items-center ml-9">
        <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
        <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" style="animation-delay: 0.15s" />
        <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" style="animation-delay: 0.3s" />
      </div>
    </div>

    <!-- Composer -->
    <div class="border-t border-slate-200 px-5 py-4 bg-white/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
      <div class="flex flex-wrap gap-2 mb-3">
        <button
          v-for="s in SUGGESTIONS"
          :key="s.label"
          type="button"
          class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          :disabled="isLoading"
          @click="send(s.prompt)"
        >
          {{ s.label }}
        </button>
      </div>
      <div class="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-3 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100 transition dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-brand-700/20">
        <textarea
          ref="textareaRef"
          v-model="input"
          rows="1"
          class="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed min-h-[24px] max-h-40 placeholder:text-slate-400"
          placeholder="Ask the agent…"
          :disabled="isLoading"
          @input="autoGrow"
          @keydown="onKeydown"
        />
        <button
          type="button"
          class="w-8 h-8 rounded-full bg-brand-600 text-white inline-flex items-center justify-center hover:bg-brand-700 disabled:bg-slate-300 disabled:text-slate-500 transition"
          :disabled="!input.trim() || isLoading"
          @click="send()"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        </button>
      </div>
      <div class="text-[10.5px] text-slate-500 mt-1.5 dark:text-slate-400">
        <kbd class="px-1 py-0.5 rounded border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">Enter</kbd> to send · <kbd class="px-1 py-0.5 rounded border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">Shift</kbd>+<kbd class="px-1 py-0.5 rounded border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">Enter</kbd> for newline
      </div>
    </div>
  </div>
</template>
