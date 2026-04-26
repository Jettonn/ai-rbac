import { ref, watchEffect } from 'vue'

const isDark = ref(typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'dark')

watchEffect(() => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', isDark.value)
  try {
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  } catch {}
})

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
  }
  return { isDark, toggle }
}
