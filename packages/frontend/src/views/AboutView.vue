<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center sm:p-4">
    <div class="about-card w-full max-w-lg p-4 sm:p-8 relative">
      <h1 class="text-2xl sm:text-3xl font-heading text-center mb-1 sm:mb-2">About ScrumKit</h1>
      <p class="text-center text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">Planning Poker for Teams</p>

      <div class="space-y-4 text-sm sm:text-base">
        <h2 class="font-bold text-lg">Why I Built This</h2>
        <p class="text-muted-foreground">
          I tried a bunch of planning poker apps and they all felt... meh. Like spreadsheets pretending to be fun. So I thought, "how hard can it be?" (Famous last words.) Anyway, here we are.
        </p>

        <h2 class="font-bold text-lg mt-6">What You Can Do</h2>
        <ul class="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Vote on stuff (obviously)</li>
          <li>Watch your teammates panic when estimates don't match</li>
          <li>Throw virtual tomatoes at people who vote 1 on a 13-point task</li>
        </ul>
      </div>

      <div class="mt-6 sm:mt-8 text-center">
        <RouterLink
          to="/"
          class="text-primary hover:underline"
        >
          Back to Home
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-card {
  position: relative;
  border-radius: 8px;
  background: linear-gradient(145deg, oklch(28% 0.02 260), oklch(22% 0.02 260));
  border: 3px solid oklch(65% 0.14 85);
  box-shadow:
    0 0 20px oklch(70% 0.16 85 / 0.3),
    inset 0 1px 0 oklch(80% 0.14 85 / 0.5),
    inset 0 -1px 0 oklch(45% 0.12 85 / 0.8),
    0 8px 24px -4px oklch(0% 0 0 / 0.6);
}

.about-card::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 4px;
  border: 1px solid oklch(70% 0.12 85 / 0.3);
  pointer-events: none;
}

.about-card::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 8px;
  background:
    radial-gradient(circle at 0% 0%, oklch(80% 0.16 85 / 0.4) 0%, transparent 15%),
    radial-gradient(circle at 100% 0%, oklch(80% 0.16 85 / 0.4) 0%, transparent 15%),
    radial-gradient(circle at 0% 100%, oklch(80% 0.16 85 / 0.3) 0%, transparent 15%),
    radial-gradient(circle at 100% 100%, oklch(80% 0.16 85 / 0.3) 0%, transparent 15%);
  pointer-events: none;
  z-index: -1;
}

@media (max-width: 639px) {
  .about-card {
    background: transparent;
    border: none;
    box-shadow: none;
  }
  .about-card::before,
  .about-card::after {
    display: none;
  }
}
</style>
