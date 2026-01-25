<template>
  <div class="activity-feed">
    <div
      v-for="item in displayedItems"
      :key="item.id"
      :class="['activity-item', `type-${item.type}`]"
    >
      <div class="activity-icon">
        <q-icon :name="getIcon(item.type)" size="sm" />
      </div>
      <div class="activity-content">
        <div class="activity-header">
          <span class="activity-type">{{ getTypeLabel(item.type) }}</span>
          <router-link
            v-if="item.projectSlug"
            :to="`/projects/${item.projectSlug}`"
            class="project-link"
          >
            {{ item.projectName }}
          </router-link>
        </div>
        <p class="activity-message">
          <component
            :is="item.url ? 'a' : 'span'"
            :href="item.url"
            target="_blank"
            rel="noopener"
            class="message-link"
          >
            {{ item.message }}
          </component>
        </p>
        <time :datetime="item.date">{{ formatDate(item.date) }}</time>
      </div>
    </div>
    <div v-if="items.length === 0" class="empty">
      No recent activity
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ActivityItem } from 'src/types/content'

const props = withDefaults(defineProps<{
  items: ActivityItem[]
  limit?: number
}>(), {
  limit: 10
})

const displayedItems = computed(() =>
  props.items.slice(0, props.limit)
)

function getIcon(type: ActivityItem['type']): string {
  switch (type) {
    case 'commit': return 'commit'
    case 'post': return 'article'
    case 'project': return 'folder'
    default: return 'circle'
  }
}

function getTypeLabel(type: ActivityItem['type']): string {
  switch (type) {
    case 'commit': return 'Commit'
    case 'post': return 'Post'
    case 'project': return 'Project'
    default: return 'Activity'
  }
}

function formatDate(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style lang="scss" scoped>
@import '../css/variables';

.activity-feed {
  display: flex;
  flex-direction: column;
}

.activity-item {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md 0;
  border-bottom: 1px solid $border-muted;

  &:last-child {
    border-bottom: none;
  }
}

.activity-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: $bg-tertiary;
  color: $text-secondary;
  flex-shrink: 0;

  .type-commit & {
    color: $status-active;
  }

  .type-post & {
    color: $accent;
  }

  .type-project & {
    color: $status-concept;
  }
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;
}

.activity-type {
  font-size: 0.75rem;
  color: $text-muted;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.project-link {
  font-size: 0.75rem;
  color: $accent;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.activity-message {
  margin: 0;
  font-size: 0.9rem;
  color: $text-primary;
  word-break: break-word;
}

.message-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    color: $accent;
  }
}

time {
  font-size: 0.75rem;
  color: $text-muted;
}

.empty {
  color: $text-muted;
  padding: $spacing-lg;
  text-align: center;
}
</style>
