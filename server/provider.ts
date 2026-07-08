export function buildChatCompletionsUrl(baseURL: string) {
  const base = String(baseURL || '').replace(/\/+$/, '')

  if (base.endsWith('/chat/completions')) {
    return base
  }

  return `${base}/chat/completions`
}

export function maskApiKey(key: string) {
  if (!key) return ''
  if (key.length <= 8) return '****'
  return `${key.slice(0, 4)}****${key.slice(-4)}`
}
