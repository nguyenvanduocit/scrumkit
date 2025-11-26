<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { Toaster as Sonner } from 'vue-sonner'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
  />
</template>

<style>
/* Polished card-style toast */
[data-sonner-toast] {
  border-radius: 10px !important;
  border: 1px solid oklch(45% 0.02 260 / 0.5) !important;
  border-top-color: oklch(100% 0 0 / 0.15) !important;
  background: linear-gradient(145deg, oklch(35% 0.02 260), oklch(32% 0.02 260)) !important;
  box-shadow:
    0 4px 12px -2px oklch(10% 0.01 260),
    inset 0 1px 0 oklch(100% 0 0 / 0.1) !important;
  color: oklch(95% 0 0) !important;
  padding: 16px !important;
  font-weight: 500 !important;
}

[data-sonner-toast][data-type='success'] {
  border-color: oklch(65% 0.2 145 / 0.4) !important;
  border-top-color: oklch(75% 0.15 145 / 0.3) !important;
}

[data-sonner-toast][data-type='error'] {
  border-color: oklch(55% 0.25 25 / 0.4) !important;
  border-top-color: oklch(65% 0.2 25 / 0.3) !important;
}

[data-sonner-toast][data-type='warning'] {
  border-color: oklch(70% 0.18 85 / 0.4) !important;
  border-top-color: oklch(80% 0.15 85 / 0.3) !important;
}

[data-sonner-toast] [data-title] {
  color: oklch(95% 0 0) !important;
  font-weight: 600 !important;
  font-size: 14px !important;
}

[data-sonner-toast] [data-description] {
  color: oklch(75% 0 0) !important;
  font-size: 13px !important;
}

[data-sonner-toast] [data-icon] {
  color: oklch(85% 0 0) !important;
}

[data-sonner-toast][data-type='success'] [data-icon] {
  color: oklch(70% 0.2 145) !important;
}

[data-sonner-toast][data-type='error'] [data-icon] {
  color: oklch(65% 0.25 25) !important;
}

[data-sonner-toast][data-type='warning'] [data-icon] {
  color: oklch(75% 0.18 85) !important;
}

[data-sonner-toast] [data-close-button] {
  border: 1px solid oklch(45% 0.02 260 / 0.5) !important;
  border-top-color: oklch(100% 0 0 / 0.1) !important;
  border-radius: 6px !important;
  background: oklch(35% 0.02 260) !important;
  color: oklch(75% 0 0) !important;
  box-shadow: 0 2px 4px -1px oklch(10% 0.01 260) !important;
  transition: all 150ms ease !important;
}

[data-sonner-toast] [data-close-button]:hover {
  transform: translateY(-1px) !important;
  background: oklch(40% 0.02 260) !important;
  color: oklch(95% 0 0) !important;
  box-shadow: 0 4px 8px -2px oklch(10% 0.01 260) !important;
}

[data-sonner-toast] [data-close-button]:active {
  transform: translateY(1px) !important;
  box-shadow: 0 1px 2px -1px oklch(10% 0.01 260) !important;
}
</style>
