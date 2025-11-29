<script setup lang="ts">
import { ref } from 'vue'
import { Pencil, Trash2, Check, X } from 'lucide-vue-next'
import { useRetro } from '@/composables/useRetro'
import type { ItemData } from '@scrumkit/models/types'

const props = defineProps<{
  item: ItemData
  columnId: string
  isOwner: boolean
}>()

const { editItem, deleteItem } = useRetro()

const isEditing = ref(false)
const editText = ref('')

function startEdit() {
  editText.value = props.item.content
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  editText.value = ''
}

function saveEdit() {
  if (!editText.value.trim()) return

  editItem(props.columnId, props.item.id, editText.value.trim())
  isEditing.value = false
}

function handleDelete() {
  deleteItem(props.columnId, props.item.id)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    saveEdit()
  }
  if (e.key === 'Escape') {
    cancelEdit()
  }
}
</script>

<template>
  <div class="retro-item" :class="{ 'is-owner': isOwner }">
    <!-- Edit mode -->
    <template v-if="isEditing">
      <textarea
        v-model="editText"
        @keydown="handleKeydown"
        class="edit-input"
        rows="3"
        autofocus
      />
      <div class="edit-actions">
        <button class="icon-btn cancel" @click="cancelEdit" title="Cancel">
          <X :size="14" />
        </button>
        <button class="icon-btn save" @click="saveEdit" :disabled="!editText.trim()" title="Save">
          <Check :size="14" />
        </button>
      </div>
    </template>

    <!-- View mode -->
    <template v-else>
      <p class="item-content">{{ item.content }}</p>
      <div class="item-footer">
        <span class="item-author">{{ item.authorName }}</span>
        <div v-if="isOwner" class="item-actions">
          <button class="icon-btn" @click="startEdit" title="Edit">
            <Pencil :size="12" />
          </button>
          <button class="icon-btn delete" @click="handleDelete" title="Delete">
            <Trash2 :size="12" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.retro-item {
  padding: 0.75rem;
  border-radius: 8px;
  background: linear-gradient(145deg, oklch(28% 0.02 260), oklch(24% 0.02 260));
  border: 1px solid oklch(35% 0.02 260);
  border-top-color: oklch(40% 0.02 260);
  box-shadow:
    0 2px 6px -2px oklch(0% 0 0 / 0.3),
    inset 0 1px 0 oklch(100% 0 0 / 0.05);
}

.retro-item.is-owner {
  border-left: 3px solid oklch(65% 0.14 85);
}

.item-content {
  font-size: 0.875rem;
  line-height: 1.5;
  color: oklch(90% 0.01 260);
  white-space: pre-wrap;
  word-break: break-word;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid oklch(30% 0.02 260);
}

.item-author {
  font-size: 0.75rem;
  color: oklch(55% 0.01 260);
}

.item-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.retro-item:hover .item-actions {
  opacity: 1;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 4px;
  background: oklch(35% 0.02 260);
  border: none;
  color: oklch(70% 0.01 260);
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: oklch(45% 0.02 260);
  color: oklch(90% 0.01 260);
}

.icon-btn.delete:hover {
  background: oklch(50% 0.2 25);
  color: oklch(95% 0.01 25);
}

.icon-btn.save {
  background: oklch(50% 0.15 145);
  color: oklch(95% 0.01 145);
}

.icon-btn.cancel {
  background: oklch(40% 0.02 260);
}

.edit-input {
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid oklch(50% 0.02 260);
  background: oklch(18% 0.02 260);
  color: oklch(90% 0.01 260);
  font-size: 0.875rem;
  resize: none;
}

.edit-input:focus {
  outline: none;
  border-color: oklch(65% 0.14 85);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
  margin-top: 0.5rem;
}
</style>
