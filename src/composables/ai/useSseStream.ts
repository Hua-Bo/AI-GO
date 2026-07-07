import { ref } from 'vue'

export type StreamState = 'idle' | 'loading' | 'generating' | 'done' | 'error'

export function useSseStream() {
  const streamState = ref<StreamState>('idle')
  const streamError = ref('')
  let abortController: AbortController | null = null

  function startStream() {
    abortController?.abort()
    abortController = new AbortController()
    streamState.value = 'loading'
    streamError.value = ''
    return abortController
  }

  function markGenerating() {
    streamState.value = 'generating'
  }

  function finishStream() {
    streamState.value = 'done'
    abortController = null
  }

  function failStream(message: string) {
    streamState.value = 'error'
    streamError.value = message
    abortController = null
  }

  function stopStream() {
    abortController?.abort()
    abortController = null
    if (streamState.value === 'generating' || streamState.value === 'loading') {
      streamState.value = 'idle'
    }
  }

  function getSignal(): AbortSignal {
    if (!abortController) abortController = new AbortController()
    return abortController.signal
  }

  return {
    streamState,
    streamError,
    startStream,
    markGenerating,
    finishStream,
    failStream,
    stopStream,
    getSignal,
  }
}
