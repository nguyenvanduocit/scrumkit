<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useRetro } from '@/composables/useRetro'
import RetroItem from '@/components/RetroItem.vue'
import type { ColumnData } from '@scrumkit/models/types'

const props = defineProps<{
  column: ColumnData
  myName: string
}>()

const { addItem } = useRetro()

const newItemText = ref('')
const isAdding = ref(false)

// All items sorted by creation time
const visibleItems = computed(() => {
  const items = Array.from(props.column.items.values())
  return items.sort((a, b) => a.createdAt - b.createdAt)
})

function handleAddItem() {
  if (!newItemText.value.trim()) return

  addItem(props.column.id, newItemText.value.trim())
  newItemText.value = ''
  isAdding.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleAddItem()
  }
  if (e.key === 'Escape') {
    isAdding.value = false
    newItemText.value = ''
  }
}
</script>

<template>
  <div class="retro-column">
    <div class="column-header">
      <h2 class="column-title">{{ column.title }}</h2>
      <span class="item-count">{{ visibleItems.length }}</span>
    </div>

    <div class="column-content">
      <!-- Items list -->
      <div class="items-list">
        <RetroItem
          v-for="item in visibleItems"
          :key="item.id"
          :item="item"
          :column-id="column.id"
          :is-owner="item.authorId === myName"
        />
      </div>

      <!-- Add item input -->
      <div v-if="isAdding" class="add-item-form">
        <textarea
          v-model="newItemText"
          @keydown="handleKeydown"
          placeholder="Type your feedback..."
          class="add-item-input"
          rows="3"
          autofocus
        />
        <div class="add-item-actions">
          <button class="btn-cancel" @click="isAdding = false">Cancel</button>
          <button class="btn-add" @click="handleAddItem" :disabled="!newItemText.trim()">Add</button>
        </div>
      </div>

      <!-- Add item button -->
      <button
        v-else
        class="add-item-btn"
        @click="isAdding = true"
      >
        <Plus :size="16" />
        <span>Add item</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.retro-column {
  flex: 1;
  min-width: 280px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  background: oklch(22% 0.02 260);
  border-radius: 12px;
  border: 1px solid oklch(30% 0.02 260);
  overflow: hidden;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: linear-gradient(145deg, oklch(28% 0.02 260), oklch(24% 0.02 260));
  border-bottom: 1px solid oklch(100% 0 0 / 0.05);
}

.column-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: oklch(90% 0.01 260);
}

.item-count {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: oklch(35% 0.02 260);
  color: oklch(70% 0.01 260);
}

.column-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  gap: 0.5rem;
  overflow-y: auto;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: transparent;
  border: 2px dashed oklch(35% 0.02 260);
  color: oklch(60% 0.01 260);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-item-btn:hover {
  border-color: oklch(50% 0.02 260);
  color: oklch(80% 0.01 260);
  background: oklch(25% 0.02 260);
}

.add-item-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-item-input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid oklch(40% 0.02 260);
  background: oklch(18% 0.02 260);
  color: oklch(90% 0.01 260);
  font-size: 0.875rem;
  resize: none;
}

.add-item-input:focus {
  outline: none;
  border-color: oklch(65% 0.14 85);
  box-shadow: 0 0 0 2px oklch(65% 0.14 85 / 0.2);
}

.add-item-input::placeholder {
  color: oklch(50% 0.01 260);
}

.add-item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-cancel,
.btn-add {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel {
  background: transparent;
  border: 1px solid oklch(40% 0.02 260);
  color: oklch(70% 0.01 260);
}

.btn-cancel:hover {
  background: oklch(30% 0.02 260);
}

.btn-add {
  background: linear-gradient(145deg, oklch(78% 0.18 85), oklch(72% 0.18 85));
  border: none;
  color: oklch(20% 0.05 85);
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
