<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  trigger: boolean
}>()

const particles = ref<Array<{
  id: number
  x: number
  y: number
  color: string
  size: number
  rotation: number
  velocityX: number
  velocityY: number
}>>([])

let idCounter = 0

const COLORS = [
  'oklch(78% 0.18 85)',   // gold
  'oklch(75% 0.18 145)',  // green
  'oklch(70% 0.20 30)',   // orange
  'oklch(75% 0.15 250)',  // blue
  'oklch(80% 0.20 330)',  // pink
]

function spawnConfetti() {
  const newParticles: typeof particles.value = []
  const count = 50

  for (let i = 0; i < count; i++) {
    newParticles.push({
      id: idCounter++,
      x: 50 + (Math.random() - 0.5) * 30,
      y: 40,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * 15,
      velocityY: -8 - Math.random() * 8,
    })
  }

  particles.value = [...particles.value, ...newParticles]

  // Clear after animation
  setTimeout(() => {
    particles.value = particles.value.filter(p => !newParticles.includes(p))
  }, 2500)
}

watch(() => props.trigger, (val) => {
  if (val) spawnConfetti()
})
</script>

<template>
  <div class="confetti-container">
    <div
      v-for="p in particles"
      :key="p.id"
      class="confetti-particle"
      :style="{
        '--start-x': `${p.x}%`,
        '--start-y': `${p.y}%`,
        '--velocity-x': p.velocityX,
        '--velocity-y': p.velocityY,
        '--rotation': `${p.rotation}deg`,
        '--size': `${p.size}px`,
        '--color': p.color,
      }"
    />
  </div>
</template>

<style scoped>
.confetti-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 100;
}

.confetti-particle {
  position: absolute;
  left: var(--start-x);
  top: var(--start-y);
  width: var(--size);
  height: var(--size);
  background: var(--color);
  border-radius: 2px;
  animation: confetti-fall 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  transform-origin: center;
}

@keyframes confetti-fall {
  0% {
    transform: translate(0, 0) rotate(var(--rotation)) scale(1);
    opacity: 1;
  }
  20% {
    transform:
      translate(
        calc(var(--velocity-x) * 8px),
        calc(var(--velocity-y) * 12px)
      )
      rotate(calc(var(--rotation) + 180deg))
      scale(1);
    opacity: 1;
  }
  100% {
    transform:
      translate(
        calc(var(--velocity-x) * 20px),
        300px
      )
      rotate(calc(var(--rotation) + 720deg))
      scale(0.3);
    opacity: 0;
  }
}
</style>
