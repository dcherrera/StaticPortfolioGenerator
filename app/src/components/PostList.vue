<template>
  <div class="post-list">
    <router-link
      v-for="post in posts"
      :key="post.slug"
      :to="getPostUrl(post)"
      class="post-item"
    >
      <span class="post-title">{{ post.title }}</span>
      <time :datetime="post.date">{{ formatDate(post.date) }}</time>
    </router-link>
    <div v-if="posts.length === 0" class="empty">
      No updates yet
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from 'src/types/content'

const props = defineProps<{
  posts: Post[]
  projectSlug?: string
}>()

function getPostUrl(post: Post): string {
  if (props.projectSlug) {
    return `/projects/${props.projectSlug}/${post.slug}`
  }
  return `/blog/${post.slug}`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<style lang="scss" scoped>
@import '../css/variables';

.post-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $border-muted;
  text-decoration: none;
  color: inherit;
  transition: color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    color: $accent;
  }
}

.post-title {
  font-size: 0.875rem;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

time {
  font-size: 0.75rem;
  color: $text-muted;
  flex-shrink: 0;
}

.empty {
  color: $text-muted;
  font-size: 0.875rem;
  padding: $spacing-md 0;
}
</style>
