<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import AnimatedCardStack from '@/components/AnimatedCardStack.vue'
import PlayerCard from '@/components/PlayerCard.vue'
import EmojiProjectile from '@/components/EmojiProjectile.vue'
import { useColyseus } from '@/composables/useColyseus'
import type { PlayerData } from '@scrumkit/models/types'

const props = defineProps<{
  players: Map<string, PlayerData>
  mySessionId: string
  revealed: boolean
}>()

const emit = defineEmits<{
  reveal: []
  reset: []
}>()

const { throwEmoji, onEmojiThrown } = useColyseus()
const emojiProjectileRef = ref<InstanceType<typeof EmojiProjectile>>()
const playerRefs = ref<Map<string, HTMLElement>>(new Map())

// Store player element refs
function setPlayerRef(playerId: string, el: HTMLElement | null) {
  if (el) {
    playerRefs.value.set(playerId, el)
  } else {
    playerRefs.value.delete(playerId)
  }
}

// Handle emoji throwing from local player
function handleThrowEmoji(targetId: string, emoji: string) {
  throwEmoji(targetId, emoji)
}

// Listen to emoji thrown events and animate
let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = onEmojiThrown((data) => {
    const fromEl = playerRefs.value.get(data.fromId)
    const toEl = playerRefs.value.get(data.toId)

    if (fromEl && toEl && emojiProjectileRef.value) {
      const fromRect = fromEl.getBoundingClientRect()
      const toRect = toEl.getBoundingClientRect()

      emojiProjectileRef.value.launch(
        data.emoji,
        fromRect.left + fromRect.width / 2,
        fromRect.top + fromRect.height / 2,
        toRect.left + toRect.width / 2,
        toRect.top + toRect.height / 2
      )
    }
  })
})

onUnmounted(() => {
  unsubscribe?.()
})

const playersList = computed(() => Array.from(props.players.values()))
const hasAnyVotes = computed(() => playersList.value.some(p => p.vote))

// Calculate median and consensus of numeric votes
const voteStats = computed(() => {
  const numericVotes = playersList.value
    .map(p => p.vote)
    .filter(v => v && v !== '?')
    .map(v => parseFloat(v))
    .filter(n => !isNaN(n))

  if (numericVotes.length === 0) return null

  // Calculate median
  const sorted = [...numericVotes].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!

  // Calculate consensus (0-100%)
  // Based on coefficient of variation: lower spread = higher consensus
  const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
  let consensus = 100
  if (numericVotes.length > 1) {
    const variance = numericVotes.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / numericVotes.length
    const stdDev = Math.sqrt(variance)
    const cv = avg > 0 ? (stdDev / avg) : 0
    consensus = Math.max(0, Math.round((1 - Math.min(cv, 1)) * 100))
  }

  return {
    median: Math.round(median * 10) / 10,
    count: numericVotes.length,
    consensus
  }
})

// Detect outliers - players whose vote differs from the majority (mode)
const outlierIds = computed(() => {
  if (!props.revealed) return new Set<string>()

  const votes = playersList.value
    .filter(p => p.vote && p.vote !== '?')
    .map(p => ({ id: p.id, vote: p.vote }))

  if (votes.length < 2) return new Set<string>()

  // Find mode (most common vote)
  const voteCounts = new Map<string, number>()
  for (const { vote } of votes) {
    voteCounts.set(vote, (voteCounts.get(vote) || 0) + 1)
  }

  // Get the highest count
  const maxCount = Math.max(...voteCounts.values())

  // If everyone voted differently or all votes are the same, no outliers
  if (maxCount === 1 || maxCount === votes.length) return new Set<string>()

  // Get mode votes (could be multiple if tied)
  const modeVotes = new Set<string>()
  for (const [vote, count] of voteCounts) {
    if (count === maxCount) modeVotes.add(vote)
  }

  // Outliers are those whose vote is NOT in the mode
  return new Set(
    votes.filter(({ vote }) => !modeVotes.has(vote)).map(({ id }) => id)
  )
})

// Table positioning configuration
const TABLE_CONFIG = {
  spread: 70, // Horizontal spread percentage for top/bottom
  ellipse: { rx: 56, ry: 50 }, // Ellipse radii for left/right curves
  angles: {
    left: { start: 215, end: 145, single: 180 },
    right: { start: -35, end: 35, single: 0 },
  },
  yOffset: { top: -28, bottom: 138 }, // Y coordinates for card positioning
}

// Get player coordinates for any side
function getPlayerCoords(side: 'top' | 'bottom' | 'left' | 'right', index: number, total: number) {
  const { spread, ellipse, angles, yOffset } = TABLE_CONFIG

  // Linear positioning for top/bottom
  if (side === 'top' || side === 'bottom') {
    const startX = (100 - spread) / 2
    const spacing = total > 1 ? spread / (total - 1) : 0
    const x = total === 1 ? 50 : startX + spacing * index
    return { x, y: yOffset[side] }
  }

  // Elliptical positioning for left/right
  const { start, end, single } = angles[side]
  const angleStep = total > 1 ? (end - start) / (total - 1) : 0
  const angle = (total === 1 ? single : start + angleStep * index) * (Math.PI / 180)
  return {
    x: 50 + ellipse.rx * Math.cos(angle),
    y: 50 + ellipse.ry * Math.sin(angle),
  }
}

// Convert coordinates to CSS position style
function getPositionStyle(side: 'top' | 'bottom' | 'left' | 'right', index: number, total: number) {
  // Top/bottom use CSS classes for vertical positioning
  if (side === 'top' || side === 'bottom') {
    const { x } = getPlayerCoords(side, index, total)
    return { left: `${x}%`, transform: 'translateX(-50%)' }
  }
  // Left/right use absolute positioning
  const { x, y } = getPlayerCoords(side, index, total)
  return { left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }
}

// Calculate card position along line from player to table center
function getCardStyleForPosition(playerX: number, playerY: number, distance = 80) {
  const dx = 50 - playerX
  const dy = 50 - playerY
  const length = Math.sqrt(dx * dx + dy * dy)
  const offsetX = (dx / length) * distance
  const offsetY = (dy / length) * distance

  return {
    left: '50%',
    top: '50%',
    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
  }
}

// Calculate card rotation to face the table center
function getCardRotation(playerX: number, playerY: number) {
  return Math.atan2(50 - playerX, 50 - playerY) * (180 / Math.PI)
}

// Combined helper for card props
function getCardProps(side: 'top' | 'bottom' | 'left' | 'right', index: number, total: number) {
  const { x, y } = getPlayerCoords(side, index, total)
  const distance = side === 'bottom' ? 120 : 80
  return {
    style: getCardStyleForPosition(x, y, distance),
    rotation: getCardRotation(x, y),
  }
}

// Max capacities: top=4, bottom=4, left=2, right=2 (total 12)
const tablePositions = computed(() => {
  const list = playersList.value.slice(0, 12) // Limit to 12 players
  const positions = { top: [] as PlayerData[], left: [] as PlayerData[], right: [] as PlayerData[], bottom: [] as PlayerData[] }

  const me = list.find(p => p.id === props.mySessionId)
  const others = list.filter(p => p.id !== props.mySessionId)

  // Round-robin distribution: top → right → bottom → left (clockwise)
  const maxSlots = { top: 4, bottom: 3, left: 2, right: 2 } // bottom=3 because me takes 1 slot
  const sides: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left']

  let playerIndex = 0
  let sideIndex = 0

  while (playerIndex < others.length) {
    const side = sides[sideIndex % 4]!
    if (positions[side].length < maxSlots[side]) {
      positions[side].push(others[playerIndex]!)
      playerIndex++
    }
    sideIndex++
    // Prevent infinite loop if all sides are full
    if (sideIndex > others.length * 4) break
  }

  // Insert current user in the middle of bottom
  if (me) {
    const mid = Math.floor(positions.bottom.length / 2)
    positions.bottom.splice(mid, 0, me)
  }

  return positions
})
</script>

<template>
  <div class="game-area flex-1 flex items-center justify-center p-4">
    <!-- Emoji Projectile Container -->
    <EmojiProjectile ref="emojiProjectileRef" />

    <div class="game-container relative">
      <!-- Poker Table -->
      <div class="poker-table aspect-[2/1] flex items-center justify-center">
        <!-- Center content -->
        <div v-if="hasAnyVotes || revealed" class="relative z-10 flex flex-col items-center gap-2">
          <!-- Stats display (when revealed) -->
          <div v-if="revealed && voteStats" class="stats-display">
            <div class="stat-item">
              <span class="stat-label">Median</span>
              <span class="stat-value stat-value-primary">{{ voteStats.median }}</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item">
              <span class="stat-label">Consensus</span>
              <span
                class="stat-value"
                :class="{
                  'stat-value-good': voteStats.consensus >= 80,
                  'stat-value-medium': voteStats.consensus >= 50 && voteStats.consensus < 80,
                  'stat-value-low': voteStats.consensus < 50
                }"
              >
                {{ voteStats.consensus }}%
              </span>
            </div>
          </div>
          <!-- Action Button -->
          <Button
            @click="revealed ? emit('reset') : emit('reveal')"
            class="px-6 py-2 text-base font-bold uppercase tracking-wide"
          >
            {{ revealed ? 'New Round' : 'Reveal Cards' }}
          </Button>
        </div>
      </div>

      <!-- Players positioned around the table with their cards -->
      <!-- Top Players -->
      <div
        v-for="(player, index) in tablePositions.top"
        :key="player.id"
        :ref="(el) => setPlayerRef(player.id, el as HTMLElement)"
        class="player-slot player-top"
        :style="getPositionStyle('top', index, tablePositions.top.length)"
      >
        <PlayerCard
          :name="player.name"
          :avatar="player.avatar"
          :has-voted="!!player.vote"
          :revealed="revealed"
          :vote="player.vote"
          :is-me="player.id === mySessionId"
          :status="player.status"
          :player-id="player.id"
          :disconnected-at="player.disconnectedAt"
          @throw-emoji="handleThrowEmoji(player.id, $event)"
        />
        <!-- Card attached to player -->
        <div v-if="player.vote" class="player-card-stack" :style="getCardProps('top', index, tablePositions.top.length).style">
          <AnimatedCardStack :vote="player.vote" :revealed="revealed" :base-rotation="10" :stack-rotation="getCardProps('top', index, tablePositions.top.length).rotation" :is-outlier="outlierIds.has(player.id)" />
        </div>
      </div>

      <!-- Left Players -->
      <div
        v-for="(player, index) in tablePositions.left"
        :key="player.id"
        :ref="(el) => setPlayerRef(player.id, el as HTMLElement)"
        class="player-slot"
        :style="getPositionStyle('left', index, tablePositions.left.length)"
      >
        <PlayerCard
          :name="player.name"
          :avatar="player.avatar"
          :has-voted="!!player.vote"
          :revealed="revealed"
          :vote="player.vote"
          :is-me="player.id === mySessionId"
          :status="player.status"
          :player-id="player.id"
          :disconnected-at="player.disconnectedAt"
          @throw-emoji="handleThrowEmoji(player.id, $event)"
        />
        <!-- Card attached to player -->
        <div v-if="player.vote" class="player-card-stack" :style="getCardProps('left', index, tablePositions.left.length).style">
          <AnimatedCardStack :vote="player.vote" :revealed="revealed" :base-rotation="8" :stack-rotation="getCardProps('left', index, tablePositions.left.length).rotation" :is-outlier="outlierIds.has(player.id)" />
        </div>
      </div>

      <!-- Right Players -->
      <div
        v-for="(player, index) in tablePositions.right"
        :key="player.id"
        :ref="(el) => setPlayerRef(player.id, el as HTMLElement)"
        class="player-slot"
        :style="getPositionStyle('right', index, tablePositions.right.length)"
      >
        <PlayerCard
          :name="player.name"
          :avatar="player.avatar"
          :has-voted="!!player.vote"
          :revealed="revealed"
          :vote="player.vote"
          :is-me="player.id === mySessionId"
          :status="player.status"
          :player-id="player.id"
          :disconnected-at="player.disconnectedAt"
          @throw-emoji="handleThrowEmoji(player.id, $event)"
        />
        <!-- Card attached to player -->
        <div v-if="player.vote" class="player-card-stack" :style="getCardProps('right', index, tablePositions.right.length).style">
          <AnimatedCardStack :vote="player.vote" :revealed="revealed" :base-rotation="8" :stack-rotation="getCardProps('right', index, tablePositions.right.length).rotation" :is-outlier="outlierIds.has(player.id)" />
        </div>
      </div>

      <!-- Bottom Players -->
      <div
        v-for="(player, index) in tablePositions.bottom"
        :key="player.id"
        :ref="(el) => setPlayerRef(player.id, el as HTMLElement)"
        class="player-slot player-bottom"
        :style="getPositionStyle('bottom', index, tablePositions.bottom.length)"
      >
        <PlayerCard
          :name="player.name"
          :avatar="player.avatar"
          :has-voted="!!player.vote"
          :revealed="revealed"
          :vote="player.vote"
          :is-me="player.id === mySessionId"
          :status="player.status"
          :player-id="player.id"
          :disconnected-at="player.disconnectedAt"
          @throw-emoji="handleThrowEmoji(player.id, $event)"
        />
        <!-- Card attached to player -->
        <div v-if="player.vote" class="player-card-stack" :style="getCardProps('bottom', index, tablePositions.bottom.length).style">
          <AnimatedCardStack :vote="player.vote" :revealed="revealed" :base-rotation="10" :stack-rotation="getCardProps('bottom', index, tablePositions.bottom.length).rotation" :is-outlier="outlierIds.has(player.id)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Stats display - casino plaque style */
.stats-display {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem 1.75rem;
  border-radius: 8px;

  /* Dark velvet/felt background */
  background:
    linear-gradient(145deg, oklch(22% 0.02 260), oklch(16% 0.02 260));

  /* Gold ornate border - beveled casino plaque look */
  border: 3px solid oklch(65% 0.14 85);
  box-shadow:
    /* Outer gold glow */
    0 0 20px oklch(70% 0.16 85 / 0.3),
    /* Inner gold rim highlight */
    inset 0 1px 0 oklch(80% 0.14 85 / 0.5),
    inset 0 -1px 0 oklch(45% 0.12 85 / 0.8),
    /* Deep shadow for depth */
    0 8px 24px -4px oklch(0% 0 0 / 0.6);
}

/* Inner gold line accent */
.stats-display::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 4px;
  border: 1px solid oklch(70% 0.12 85 / 0.3);
  pointer-events: none;
}

/* Corner accents */
.stats-display::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 8px;
  background:
    radial-gradient(circle at 0% 0%, oklch(80% 0.16 85 / 0.4) 0%, transparent 25%),
    radial-gradient(circle at 100% 0%, oklch(80% 0.16 85 / 0.4) 0%, transparent 25%),
    radial-gradient(circle at 0% 100%, oklch(80% 0.16 85 / 0.3) 0%, transparent 25%),
    radial-gradient(circle at 100% 100%, oklch(80% 0.16 85 / 0.3) 0%, transparent 25%);
  pointer-events: none;
  z-index: -1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
}

.stat-divider {
  width: 2px;
  height: 2.75rem;
  background: linear-gradient(
    180deg,
    oklch(70% 0.12 85 / 0.2) 0%,
    oklch(70% 0.12 85 / 0.6) 50%,
    oklch(70% 0.12 85 / 0.2) 100%
  );
  border-radius: 1px;
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: oklch(70% 0.10 85);
  text-shadow: 0 1px 2px oklch(0% 0 0 / 0.5);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1;
  font-family: 'Georgia', serif;
}

.stat-value-primary {
  color: oklch(82% 0.16 85);
  text-shadow:
    0 0 10px oklch(75% 0.18 85 / 0.5),
    0 2px 4px oklch(0% 0 0 / 0.4);
}

.stat-value-good {
  color: oklch(75% 0.18 145);
  text-shadow:
    0 0 10px oklch(70% 0.18 145 / 0.4),
    0 2px 4px oklch(0% 0 0 / 0.4);
}

.stat-value-medium {
  color: oklch(82% 0.16 85);
  text-shadow:
    0 0 10px oklch(75% 0.18 85 / 0.5),
    0 2px 4px oklch(0% 0 0 / 0.4);
}

.stat-value-low {
  color: oklch(68% 0.20 25);
  text-shadow:
    0 0 10px oklch(65% 0.22 25 / 0.4),
    0 2px 4px oklch(0% 0 0 / 0.4);
}

.game-area {
  overflow: visible;
}

.game-container {
  width: min(75vw, 700px);
  margin: 7rem 5rem; /* Space for players outside */
  overflow: visible;
}

.player-slot {
  position: absolute;
  z-index: 10;
}

.player-card-stack {
  position: absolute;
  z-index: 5;
}

.player-top {
  top: -28%;
}

.player-bottom {
  bottom: -38%;
}

.poker-table {
  /* Stadium/pill shape - rounded ends, straight sides */
  border-radius: 9999px;

  /* Wooden border base */
  background: linear-gradient(
    145deg,
    oklch(35% 0.08 55) 0%,
    oklch(25% 0.08 45) 50%,
    oklch(20% 0.06 40) 100%
  );

  /* Thick wooden rim with 3D effect */
  border: 12px solid oklch(28% 0.06 50);
  border-top-color: oklch(38% 0.06 55);
  border-left-color: oklch(32% 0.06 52);
  border-bottom-color: oklch(18% 0.06 45);
  border-right-color: oklch(22% 0.06 48);

  /* Deep shadow for 3D lift */
  box-shadow:
    0 12px 40px -8px oklch(0% 0 0 / 0.6),
    0 6px 20px -4px oklch(0% 0 0 / 0.4),
    inset 0 2px 4px oklch(0% 0 0 / 0.3);
}

/* Green felt surface */
.poker-table::before {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 9999px;

  /* Felt green with subtle radial gradient for depth */
  background:
    radial-gradient(
      ellipse at 50% 30%,
      oklch(42% 0.12 145) 0%,
      oklch(35% 0.12 145) 40%,
      oklch(30% 0.10 145) 100%
    );

  /* Inner border for felt edge */
  border: 3px solid oklch(25% 0.08 145);
  border-top-color: oklch(38% 0.10 145);

  /* Subtle felt texture shadow */
  box-shadow:
    inset 0 4px 16px oklch(0% 0 0 / 0.25),
    inset 0 -2px 8px oklch(0% 0 0 / 0.15),
    inset 0 0 60px oklch(0% 0 0 / 0.1);

  pointer-events: none;
  z-index: 0;
}

/* Top light reflection on wooden rim */
.poker-table::after {
  content: '';
  position: absolute;
  top: -8px;
  left: 20%;
  right: 20%;
  height: 4px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    oklch(50% 0.04 55 / 0.4) 20%,
    oklch(55% 0.04 55 / 0.5) 50%,
    oklch(50% 0.04 55 / 0.4) 80%,
    transparent 100%
  );
  border-radius: 9999px;
  pointer-events: none;
}
</style>
