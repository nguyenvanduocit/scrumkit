<script setup lang="ts">
import { computed } from 'vue'

interface Player {
  id: string
  name: string
  vote: string
  avatar: number
}

const props = defineProps<{
  players: Map<string, Player>
  mySessionId: string
  revealed: boolean
}>()

const playersList = computed(() => {
  const list = Array.from(props.players.values())
  // Put current user first
  return list.sort((a, b) => {
    if (a.id === props.mySessionId) return -1
    if (b.id === props.mySessionId) return 1
    return 0
  })
})
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 p-4">
    <div
      v-for="player in playersList"
      :key="player.id"
      class="player-card flex items-center gap-3 p-3 rounded-xl transition-all duration-150"
      :class="player.id === mySessionId ? 'player-card-me' : 'player-card-other'"
    >
      <!-- Avatar -->
      <div class="avatar-container w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
        <img
          :src="`/avatars/${player.avatar}.webp`"
          :alt="player.name"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Name -->
      <span class="font-semibold flex-1 truncate text-foreground">
        {{ player.name }}
        <span v-if="player.id === mySessionId" class="text-muted-foreground font-normal text-sm">(you)</span>
      </span>

      <!-- Vote Status -->
      <div class="flex-shrink-0">
        <template v-if="revealed && player.vote">
          <!-- Show vote value when revealed -->
          <span class="vote-badge vote-badge-revealed inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg">
            {{ player.vote }}
          </span>
        </template>
        <template v-else-if="player.vote">
          <!-- Voted indicator (not revealed) -->
          <span class="vote-badge vote-badge-voted inline-flex items-center justify-center w-10 h-10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
        </template>
        <template v-else>
          <!-- Waiting indicator -->
          <span class="vote-badge vote-badge-waiting inline-flex items-center justify-center w-10 h-10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Player card - polished style */
.player-card {
  border: 1px solid oklch(40% 0.02 260);
  box-shadow:
    0 2px 8px -2px oklch(0% 0 0 / 0.3),
    inset 0 1px 0 oklch(100% 0 0 / 0.1);
}

.player-card-other {
  background: linear-gradient(145deg, oklch(32% 0.02 260), oklch(28% 0.02 260));
  border-top-color: oklch(100% 0 0 / 0.1);
}

.player-card-me {
  background: linear-gradient(145deg, oklch(35% 0.02 260), oklch(30% 0.02 260));
  border-color: oklch(65% 0.15 85 / 0.5);
  border-top-color: oklch(100% 0 0 / 0.15);
  box-shadow:
    0 2px 8px -2px oklch(0% 0 0 / 0.3),
    0 0 0 1px oklch(75% 0.18 85 / 0.2),
    inset 0 1px 0 oklch(100% 0 0 / 0.12);
}

/* Avatar container with light effect */
.avatar-container {
  background: linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%);
  border: 1px solid oklch(50% 0.02 260);
  border-top-color: oklch(100% 0 0 / 0.3);
  box-shadow:
    0 2px 4px -1px oklch(0% 0 0 / 0.2),
    inset 0 1px 0 oklch(100% 0 0 / 0.2);
}

/* Vote badges */
.vote-badge {
  border: 1px solid oklch(50% 0.02 260);
  box-shadow:
    0 2px 4px -1px oklch(0% 0 0 / 0.2),
    inset 0 1px 0 oklch(100% 0 0 / 0.1);
}

.vote-badge-revealed {
  background: linear-gradient(145deg, oklch(78% 0.18 85), oklch(72% 0.18 85));
  border-color: oklch(65% 0.15 85);
  border-top-color: oklch(85% 0.12 85);
  color: oklch(15% 0.02 85);
  box-shadow:
    0 2px 6px -1px oklch(75% 0.18 85 / 0.4),
    inset 0 1px 0 oklch(100% 0 0 / 0.25);
}

.vote-badge-voted {
  background: linear-gradient(145deg, oklch(55% 0.15 140), oklch(48% 0.15 140));
  border-color: oklch(45% 0.12 140);
  border-top-color: oklch(65% 0.10 140);
  color: oklch(95% 0 0);
  box-shadow:
    0 2px 4px -1px oklch(0% 0 0 / 0.2),
    inset 0 1px 0 oklch(100% 0 0 / 0.2);
}

.vote-badge-waiting {
  background: linear-gradient(145deg, oklch(35% 0.02 260), oklch(30% 0.02 260));
  border-top-color: oklch(100% 0 0 / 0.1);
  color: oklch(60% 0.02 260);
}
</style>
