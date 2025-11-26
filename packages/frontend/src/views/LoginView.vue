<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import emblaCarouselVue from 'embla-carousel-vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RouterLink } from 'vue-router'
import { useColyseus } from '@/composables/useColyseus'
import { generateRoomName, generateUserName, toRoomId } from '@/lib/roomNames'
import { isRoomFullError } from '@/lib/errors'
import ShuffleIcon from '@/components/icons/ShuffleIcon.vue'
import { TOTAL_AVATARS } from '@scrumkit/models/types'

const router = useRouter()
const route = useRoute()
const { joinOrCreateRoom, error } = useColyseus()

// Show toast if redirected due to room full
onMounted(() => {
  if (route.query.error === 'room_full') {
    toast.error('Room is full. Please try another room.')
    // Clean up URL
    router.replace({ path: '/', query: { room: route.query.room } })
  }
})

const name = useLocalStorage('scrumkit-username', '')
const avatar = useLocalStorage('scrumkit-avatar', Math.floor(Math.random() * TOTAL_AVATARS))
const roomName = useLocalStorage('scrumkit-roomname', generateRoomName())
const loading = ref(false)

// URL query param takes precedence over localStorage
if (route.query.room) {
  roomName.value = route.query.room as string
}

const [emblaRef, emblaApi] = emblaCarouselVue({
  loop: true,
  align: 'center',
  containScroll: false,
  skipSnaps: true,
  duration: 12,
  startIndex: avatar.value,
})

onMounted(() => {
  if (!emblaApi.value) return

  emblaApi.value.on('select', () => {
    avatar.value = emblaApi.value!.selectedScrollSnap()
  })
})

watch(avatar, (newVal) => {
  if (emblaApi.value && emblaApi.value.selectedScrollSnap() !== newVal) {
    emblaApi.value.scrollTo(newVal)
  }
})

function shuffleUserName() {
  name.value = generateUserName()
}

function shuffleRoomName() {
  roomName.value = generateRoomName()
}

function shuffleAvatar() {
  avatar.value = Math.floor(Math.random() * TOTAL_AVATARS)
}

async function handleJoin() {
  if (!name.value.trim() || !roomName.value.trim()) return

  loading.value = true
  try {
    await joinOrCreateRoom(name.value.trim(), roomName.value.trim(), avatar.value)
    router.push(`/tables/${toRoomId(roomName.value.trim())}`)
  } catch (e: unknown) {
    console.error('Failed to join room:', e)
    if (isRoomFullError(e)) {
      toast.error('Room is full. Please try another room.')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center sm:p-4">
    <div class="login-card w-full max-w-md p-4 sm:p-8 relative">
      <h1 class="text-2xl sm:text-3xl font-heading text-center mb-1 sm:mb-2">ScrumKit</h1>
      <p class="text-center text-muted-foreground text-sm sm:text-base mb-4 sm:mb-8">Planning Poker for Teams</p>

      <form @submit.prevent="handleJoin" class="space-y-4 sm:space-y-6">
        <!-- Avatar Carousel Picker -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="block font-bold text-sm">Avatar</label>
            <button
              type="button"
              @click="shuffleAvatar"
              class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground active:scale-95"
              :disabled="loading"
            >
              <ShuffleIcon :size="14" />
              <span>Random</span>
            </button>
          </div>

          <div class="relative">
            <!-- Center marker frame -->
            <div
              class="absolute left-1/2 top-1 -translate-x-1/2 w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] border-4 border-primary z-10"
            />
            <!-- Arrow pointer below -->
            <div
              class="absolute left-1/2 top-[calc(4px+68px)] sm:top-[calc(4px+76px)] -translate-x-1/2 w-0 h-0 z-10 pointer-events-none"
              style="border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid var(--primary);"
            />

            <!-- Embla Carousel -->
            <div class="overflow-hidden py-1 pb-5 sm:pb-6 cursor-grab active:cursor-grabbing select-none" ref="emblaRef" style="user-select: none; -webkit-user-select: none;">
              <div class="flex gap-1.5 sm:gap-2">
                <div
                  v-for="i in TOTAL_AVATARS"
                  :key="i - 1"
                  class="flex-none w-16 h-16 sm:w-[72px] sm:h-[72px] border-3 border-border cursor-pointer"
                  @click="emblaApi?.scrollTo(i - 1)"
                >
                  <img
                    :src="`/avatars/${i - 1}.webp`"
                    :alt="`Avatar ${i - 1}`"
                    class="w-full h-full object-cover pointer-events-none"
                    draggable="false"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-1.5 sm:space-y-2">
          <label for="name" class="block font-bold text-sm">Your Name</label>
          <div class="relative">
            <Input
              id="name"
              v-model="name"
              placeholder="Enter your name"
              class="w-full pr-10"
              :autofocus="!name"
              :disabled="loading"
            />
            <button
              type="button"
              @click="shuffleUserName"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground active:scale-95"
              :disabled="loading"
            >
              <ShuffleIcon :size="18" />
            </button>
          </div>
        </div>
        <div class="space-y-1.5 sm:space-y-2">
          <label for="roomName" class="block font-bold text-sm">Room Name</label>
          <div class="relative">
            <Input
              id="roomName"
              v-model="roomName"
              placeholder="Enter room name"
              class="w-full pr-10"
              :autofocus="!!name && !roomName"
              :disabled="loading"
            />
            <button
              type="button"
              @click="shuffleRoomName"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground active:scale-95"
              :disabled="loading"
            >
              <ShuffleIcon :size="18" />
            </button>
          </div>
        </div>
        <div v-if="error" class="text-red-500 text-sm text-center">{{ error }}</div>
        <Button type="submit" class="w-full" :disabled="!name.trim() || !roomName.trim() || loading">
          {{ loading ? 'Entering...' : 'Enter Room' }}
        </Button>
      </form>
    </div>

    <div class="mt-4 text-center">
      <RouterLink to="/about" class="text-sm text-muted-foreground hover:text-foreground">
        About
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
/* Casino plaque style card */
.login-card {
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

/* Inner gold line accent */
.login-card::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 4px;
  border: 1px solid oklch(70% 0.12 85 / 0.3);
  pointer-events: none;
}

/* Corner accents */
.login-card::after {
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

/* Mobile: no card styling */
@media (max-width: 639px) {
  .login-card {
    background: transparent;
    border: none;
    box-shadow: none;
  }
  .login-card::before,
  .login-card::after {
    display: none;
  }
}
</style>
