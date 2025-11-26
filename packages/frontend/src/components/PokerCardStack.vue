<script setup lang="ts">
import PokerCard from './PokerCard.vue'

const VOTE_OPTIONS = ['1', '2', '3', '5', '8', '13', '?']

defineProps<{
  myVote: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  vote: [value: string]
}>()
</script>

<template>
  <div class="card-stack-container w-full">
    <div class="card-stack">
      <button
        v-for="(option, index) in VOTE_OPTIONS"
        :key="option"
        @click="emit('vote', option)"
        :disabled="disabled"
        class="card-btn"
        :class="{ selected: myVote === option }"
        :style="{ '--i': index, '--total': VOTE_OPTIONS.length }"
      >
        <PokerCard :value="option" :selected="myVote === option" :disabled="disabled" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.card-stack-container {
  container-type: inline-size;
  padding: 0.25rem 0 0.75rem;
}

.card-stack {
  display: flex;
  justify-content: space-evenly;
  align-items: flex-end;
  min-height: 6rem;
  position: relative;
}

.card-btn {
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease;
  background: none;
  border: none;
  padding: 0;
}

.card-btn:disabled {
  cursor: not-allowed;
  pointer-events: none;
}

.card-btn:hover:not(:disabled):not(.selected) {
  transform: translate(4px, 4px);
}

.card-btn:hover:not(:disabled):not(.selected) :deep(.poker-card) {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.8),
    inset 0 -1px 0 rgba(0,0,0,0.05);
}

.card-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.card-btn.selected {
  transform: translateY(-0.5rem);
  z-index: 20 !important;
}

/* Wide screens (>420px) - larger cards */
@container (min-width: 420px) {
  .card-btn :deep(.poker-card) {
    width: 3.5rem;
    height: 5rem;
    border-radius: 8px;
  }

  .card-btn :deep(.poker-card-corner) {
    font-size: 0.6rem;
  }

  .card-btn :deep(.poker-card-center) {
    font-size: 1.4rem;
  }

  .card-btn.selected {
    transform: translateY(-0.75rem);
  }
}

/* Medium screens (360-419px) - medium cards */
@container (min-width: 360px) and (max-width: 419px) {
  .card-btn :deep(.poker-card) {
    width: 3rem;
    height: 4.5rem;
    border-radius: 7px;
  }

  .card-btn :deep(.poker-card-corner) {
    font-size: 0.55rem;
  }

  .card-btn :deep(.poker-card-center) {
    font-size: 1.2rem;
  }
}
</style>
