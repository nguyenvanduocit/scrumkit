<script setup lang="ts">
import { ref, watch } from 'vue'
import PokerCard from './PokerCard.vue'

const props = defineProps<{
  vote: string
  revealed: boolean
  baseRotation?: number
  stackRotation?: number
  isOutlier?: boolean
}>()

const baseRot = props.baseRotation ?? 10
const stackRot = props.stackRotation ?? 0

// Random offsets for realistic "tossed" look
const rand = () => Math.random() * 2 - 1 // -1 to 1
const cardOffsets: [{ x: number; y: number; rot: number }, { x: number; y: number; rot: number }, { x: number; y: number; rot: number }] = [
  { x: rand() * 3, y: rand() * 2, rot: rand() * 4 },
  { x: rand() * 3, y: rand() * 2, rot: rand() * 4 },
  { x: rand() * 3, y: rand() * 2, rot: rand() * 4 },
]

const isCollapsed = ref(false)
const isFlipped = ref(false)

watch(() => props.revealed, async (revealed) => {
  if (revealed) {
    isCollapsed.value = true
    await new Promise(r => setTimeout(r, 300))
    isFlipped.value = true
  } else {
    isFlipped.value = false
    await new Promise(r => setTimeout(r, 150))
    isCollapsed.value = false
  }
})
</script>

<template>
  <!-- Outer container handles positioning/rotation toward table center -->
  <div class="relative w-14 h-16 [perspective:500px]" :style="{ transform: `rotate(${stackRot}deg)` }">
    <!-- Inner container counter-rotates so cards stay visually upright -->
    <div class="relative w-full h-full" :style="{ transform: `rotate(${-stackRot}deg)` }">
      <!-- Card 1 (left) -->
      <div
        class="card-back absolute top-0 left-0 w-9 h-14 rounded-sm transition-transform duration-300 origin-bottom"
        :style="{ transform: isCollapsed
          ? 'rotate(0deg) translateX(10px)'
          : `rotate(${-baseRot + cardOffsets[0].rot}deg) translate(${cardOffsets[0].x}px, ${cardOffsets[0].y}px)` }"
      >
        <div class="card-pattern" />
      </div>
      <!-- Card 3 (right) -->
      <div
        class="card-back absolute top-0 left-0 w-9 h-14 rounded-sm transition-transform duration-300 origin-bottom"
        :style="{ transform: isCollapsed
          ? 'rotate(0deg) translateX(10px)'
          : `rotate(${baseRot + cardOffsets[2].rot}deg) translate(${20 + cardOffsets[2].x}px, ${cardOffsets[2].y}px)` }"
      >
        <div class="card-pattern" />
      </div>
      <!-- Card 2 (middle, flippable) -->
      <div
        class="absolute top-0 left-0 w-9 h-14 transition-transform duration-300 [transform-style:preserve-3d]"
        :class="{ 'outlier-glow': isOutlier && isFlipped }"
        :style="{ transform: isFlipped
          ? `translateX(10px) rotateY(180deg) scale(1.3)`
          : `translate(${10 + cardOffsets[1].x}px, ${cardOffsets[1].y}px) rotate(${cardOffsets[1].rot}deg) rotateY(0deg)` }"
      >
        <!-- Front (face down) -->
        <div class="card-back absolute inset-0 rounded-sm [backface-visibility:hidden]">
          <div class="card-pattern" />
        </div>
        <!-- Back (face up with vote) -->
        <div class="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <PokerCard :value="vote" size="sm" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Card back - golden with decorative pattern */
.card-back {
  background-color: oklch(55% 0.18 85);
  /* Diamond pattern SVG */
  background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23d4a829' stroke-width='0.6' opacity='0.5'%3E%3Cpath d='M10 0 L20 10 L10 20 L0 10 Z'/%3E%3Cpath d='M10 5 L15 10 L10 15 L5 10 Z'/%3E%3C/g%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%23d4a829' opacity='0.4'/%3E%3C/svg%3E");
  background-size: 14px 14px;
  border: 1px solid oklch(45% 0.15 85);
  border-top-color: oklch(70% 0.15 85);
  box-shadow:
    0 3px 10px -2px oklch(0% 0 0 / 0.4),
    inset 0 1px 0 oklch(75% 0.15 85 / 0.5);
  overflow: hidden;
}

/* Inner border decoration */
.card-pattern {
  position: absolute;
  inset: 4px;
  border-radius: 1px;
  border: 1.5px solid oklch(65% 0.15 85);
  background: transparent;
}

/* Add corner decorations */
.card-pattern::before,
.card-pattern::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1.5px solid oklch(70% 0.15 85);
  border-radius: 1px;
}

.card-pattern::before {
  top: 4px;
  left: 4px;
  border-right: none;
  border-bottom: none;
}

.card-pattern::after {
  bottom: 4px;
  right: 4px;
  border-left: none;
  border-top: none;
}

/* Outlier glow effect - subtle orange pulse */
.outlier-glow {
  z-index: 20;
  border-radius: 4px;
  animation: outlier-pulse 2s ease-in-out infinite;
}

@keyframes outlier-pulse {
  0%, 100% {
    box-shadow: 0 0 8px 2px oklch(65% 0.22 30 / 0.7);
  }
  50% {
    box-shadow: 0 0 14px 4px oklch(68% 0.24 30 / 0.85);
  }
}
</style>
