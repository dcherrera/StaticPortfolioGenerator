<template>
  <div class="quick-actions">
    <div class="actions-header">
      <span class="actions-title">Quick Actions</span>
    </div>

    <div class="actions-grid">
      <q-btn
        outline
        dense
        icon="folder_special"
        label="New Project"
        class="action-btn"
        @click="$emit('newProject')"
      />
      <q-btn
        outline
        dense
        icon="post_add"
        label="New Blog Post"
        class="action-btn"
        @click="$emit('newBlogPost')"
      />
      <q-btn
        outline
        dense
        icon="note_add"
        label="New Page"
        class="action-btn"
        @click="$emit('newPage')"
      />
      <q-btn
        outline
        dense
        icon="sync"
        label="Refresh All"
        class="action-btn"
        :loading="store.isLoading"
        @click="refreshAll"
      />
    </div>

    <div v-if="store.error" class="error-message">
      <q-icon name="error" size="16px" />
      {{ store.error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSPGStore } from '../store';

const store = useSPGStore();

defineEmits<{
  newProject: [];
  newBlogPost: [];
  newPage: [];
}>();

async function refreshAll() {
  await store.loadManifest();

  // Refresh commits for all projects
  for (const project of store.projects) {
    await store.refreshCommits(project.slug);
  }
}
</script>

<style scoped>
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions-header {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.actions-title {
  font-weight: 600;
  font-size: 13px;
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 8px 0;
}

.action-btn {
  font-size: 12px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 4px;
  color: #f44336;
  font-size: 12px;
}
</style>
