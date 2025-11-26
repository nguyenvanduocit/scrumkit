import { ref, onMounted, onUnmounted } from 'vue'
import type { PlayerStatus } from '@scrumkit/models/types'

const SLEEP_TIMEOUT = 30000 // 30 seconds of inactivity
const CONFUSED_THRESHOLD = 3 // vote changes within time window
const CONFUSED_WINDOW = 5000 // 5 seconds
const ACTIVITY_DEBOUNCE = 100 // ms to debounce activity events
const HOVER_END_DELAY = 800 // ms before ending "deciding" status

export function useActivityTracker(
  sendStatus: (status: PlayerStatus) => void,
  hasVoted: () => boolean
) {
  const currentStatus = ref<PlayerStatus>('idle')
  let sleepTimer: ReturnType<typeof setTimeout> | null = null
  let activityDebounceTimer: ReturnType<typeof setTimeout> | null = null
  let hoverEndTimer: ReturnType<typeof setTimeout> | null = null
  let voteChanges: number[] = [] // timestamps of recent vote changes

  function updateStatus(newStatus: PlayerStatus) {
    if (currentStatus.value !== newStatus) {
      currentStatus.value = newStatus
      sendStatus(newStatus)
    }
  }

  function resetSleepTimer() {
    if (sleepTimer) clearTimeout(sleepTimer)
    sleepTimer = setTimeout(() => {
      // Only go to sleep if not already voted
      if (!hasVoted()) {
        updateStatus('sleeping')
      }
    }, SLEEP_TIMEOUT)
  }

  function recordActivity() {
    resetSleepTimer()
    // Wake up from sleeping
    if (currentStatus.value === 'sleeping') {
      updateStatus('idle')
    }
  }

  // Debounced activity handler to avoid excessive calls
  function onActivity() {
    if (activityDebounceTimer) return
    activityDebounceTimer = setTimeout(() => {
      activityDebounceTimer = null
      recordActivity()
    }, ACTIVITY_DEBOUNCE)
  }

  // Called when user hovers over voting cards
  function onCardHoverStart() {
    // Cancel any pending hover end
    if (hoverEndTimer) {
      clearTimeout(hoverEndTimer)
      hoverEndTimer = null
    }
    recordActivity()
    if (!hasVoted()) {
      updateStatus('deciding')
    }
  }

  // Called when user stops hovering over voting cards
  function onCardHoverEnd() {
    recordActivity()
    // Delay before ending "deciding" status for smoother feel
    if (!hasVoted() && currentStatus.value === 'deciding') {
      if (hoverEndTimer) clearTimeout(hoverEndTimer)
      hoverEndTimer = setTimeout(() => {
        hoverEndTimer = null
        if (!hasVoted() && currentStatus.value === 'deciding') {
          updateStatus('idle')
        }
      }, HOVER_END_DELAY)
    }
  }

  // Called when user changes their vote
  function onVoteChange() {
    recordActivity()
    const now = Date.now()
    voteChanges.push(now)

    // Clean up old vote changes outside the window
    voteChanges = voteChanges.filter(t => now - t < CONFUSED_WINDOW)

    // Check if confused (many vote changes in short time)
    if (voteChanges.length >= CONFUSED_THRESHOLD) {
      updateStatus('confused')
      // Reset after showing confused for a bit
      setTimeout(() => {
        if (currentStatus.value === 'confused') {
          updateStatus(hasVoted() ? 'ready' : 'idle')
        }
      }, 2000)
    } else if (hasVoted()) {
      updateStatus('ready')
    } else {
      updateStatus('idle')
    }
  }

  onMounted(() => {
    resetSleepTimer()
    // Use passive listeners for better scroll performance
    // pointerdown covers both mouse and touch, keydown for keyboard
    window.addEventListener('pointermove', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity, { passive: true })
  })

  onUnmounted(() => {
    if (sleepTimer) clearTimeout(sleepTimer)
    if (activityDebounceTimer) clearTimeout(activityDebounceTimer)
    if (hoverEndTimer) clearTimeout(hoverEndTimer)
    window.removeEventListener('pointermove', onActivity)
    window.removeEventListener('keydown', onActivity)
  })

  return {
    currentStatus,
    onCardHoverStart,
    onCardHoverEnd,
    onVoteChange,
  }
}
