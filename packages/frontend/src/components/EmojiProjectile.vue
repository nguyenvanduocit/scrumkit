<script setup lang="ts">
import { ref } from 'vue'

interface Projectile {
  id: number
  emoji: string
  style: Record<string, string>
}

const projectiles = ref<Projectile[]>([])
let nextId = 0

function launch(emoji: string, fromX: number, fromY: number, toX: number, toY: number) {
  const id = nextId++
  const duration = 800

  projectiles.value.push({
    id,
    emoji,
    style: {
      '--from-x': `${fromX}px`,
      '--from-y': `${fromY}px`,
      '--to-x': `${toX}px`,
      '--to-y': `${toY}px`,
      animationDuration: `${duration}ms`,
    },
  })

  setTimeout(() => {
    projectiles.value = projectiles.value.filter(p => p.id !== id)
  }, duration + 200)
}

defineExpose({ launch })
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
    <div
      v-for="p in projectiles"
      :key="p.id"
      class="emoji-projectile absolute text-3xl"
      :style="p.style"
    >
      {{ p.emoji }}
    </div>
  </div>
</template>

<style scoped>
.emoji-projectile {
  left: var(--from-x);
  top: var(--from-y);
  animation: fly-linear ease-out forwards;
}

@keyframes fly-linear {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  70% {
    transform: translate(
      calc(var(--to-x) - var(--from-x) - 50%),
      calc(var(--to-y) - var(--from-y) - 50%)
    ) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(var(--to-x) - var(--from-x) - 50%),
      calc(var(--to-y) - var(--from-y) - 50%)
    ) scale(1.3);
    opacity: 0;
  }
}
</style>
