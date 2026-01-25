<template>
  <div class="commit-list">
    <div
      v-for="commit in displayedCommits"
      :key="commit.sha"
      class="commit-item"
    >
      <div class="commit-message">
        <a
          v-if="commit.url"
          :href="commit.url"
          target="_blank"
          rel="noopener"
          class="commit-link"
        >
          {{ truncateMessage(commit.message) }}
        </a>
        <span v-else>{{ truncateMessage(commit.message) }}</span>
      </div>
      <div class="commit-meta">
        <code class="commit-sha">{{ commit.sha.slice(0, 7) }}</code>
        <time :datetime="commit.date">{{ formatDate(commit.date) }}</time>
      </div>
    </div>
    <div v-if="commits.length === 0" class="empty">
      No commits yet
    </div>
    <div v-if="hasMore" class="more">
      <span>{{ commits.length - limit }} more commits</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Commit } from 'src/types/content'

const props = withDefaults(defineProps<{
  commits: Commit[]
  limit?: number
}>(), {
  limit: 10
})

const displayedCommits = computed(() =>
  props.commits.slice(0, props.limit)
)

const hasMore = computed(() =>
  props.commits.length > props.limit
)

function truncateMessage(message: string, maxLength = 60): string {
  const firstLine = message.split('\n')[0]
  if (firstLine.length <= maxLength) return firstLine
  return firstLine.slice(0, maxLength - 3) + '...'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style lang="scss" scoped>
@import '../css/variables';

.commit-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.commit-item {
  padding: $spacing-sm 0;
  border-bottom: 1px solid $border-muted;

  &:last-child {
    border-bottom: none;
  }
}

.commit-message {
  font-size: 0.875rem;
  margin-bottom: $spacing-xs;
  word-break: break-word;
}

.commit-link {
  color: $text-primary;
  text-decoration: none;

  &:hover {
    color: $accent;
  }
}

.commit-meta {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: 0.75rem;
  color: $text-muted;
}

.commit-sha {
  font-family: $font-mono;
  background-color: $bg-tertiary;
  padding: 0.1em 0.3em;
  border-radius: $radius-sm;
}

.empty {
  color: $text-muted;
  font-size: 0.875rem;
  padding: $spacing-md 0;
}

.more {
  color: $text-muted;
  font-size: 0.75rem;
  padding-top: $spacing-sm;
}
</style>
