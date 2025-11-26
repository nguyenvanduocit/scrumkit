<script setup lang="ts">
defineProps<{
  value: string
  selected?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <div
    class="poker-card"
    :class="[
      selected ? 'poker-card-selected' : '',
      disabled ? 'poker-card-disabled' : '',
      size === 'sm' ? 'poker-card-sm' : ''
    ]"
  >
    <span class="poker-card-corner top-left">{{ value }}</span>
    <span class="poker-card-center">{{ value }}</span>
    <span class="poker-card-corner bottom-right">{{ value }}</span>
    <span class="poker-card-pattern" />
  </div>
</template>

<style scoped>
.poker-card {
  position: relative;
  width: 2.75rem;
  height: 4rem;
  border: 2px solid #1a1a1a;
  border-radius: 6px;
  background: linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%);
  overflow: hidden;
  box-shadow:
    4px 4px 0 rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255,255,255,0.8),
    inset 0 -1px 0 rgba(0,0,0,0.05);
}

.poker-card-sm {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.poker-card-sm .poker-card-corner {
  font-size: 0.4rem;
}

.poker-card-sm .poker-card-center {
  font-size: 0.9rem;
}

.poker-card-sm .poker-card-pattern {
  inset: 3px;
  border-radius: 2px;
}

.poker-card-corner {
  position: absolute;
  font-size: 0.5rem;
  font-weight: 800;
  line-height: 1;
  color: #c41e3a;
}

.poker-card-corner.top-left {
  top: 3px;
  left: 4px;
}

.poker-card-corner.bottom-right {
  bottom: 3px;
  right: 4px;
  transform: rotate(180deg);
}

.poker-card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.1rem;
  font-weight: 900;
  color: #c41e3a;
}

.poker-card-pattern {
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 3px;
  pointer-events: none;
}

.poker-card-disabled {
  opacity: 0.5;
}

.poker-card-selected {
  background: linear-gradient(145deg, var(--main) 0%, #d4a821 100%);
  border-color: #1a1a1a;
}

.poker-card-selected .poker-card-corner,
.poker-card-selected .poker-card-center {
  color: #1a1a1a;
}

.poker-card-selected .poker-card-pattern {
  border-color: rgba(0,0,0,0.15);
}
</style>
