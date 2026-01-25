<template>
  <router-link :to="`/projects/${project.slug}`" class="project-card">
    <div class="card-header">
      <h3 class="project-title">
        {{ project.title }}
        <q-icon v-if="project.private" name="lock" size="xs" class="private-icon" />
      </h3>
      <StatusBadge :status="project.status" size="sm" />
    </div>
    <p v-if="project.tagline" class="project-tagline">
      {{ project.tagline }}
    </p>
    <TechTags v-if="project.tech?.length" :tags="project.tech" :limit="4" />
    <div class="card-footer">
      <span v-if="project.lastUpdated" class="last-updated">
        Updated {{ formatRelativeDate(project.lastUpdated) }}
      </span>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { Project } from 'src/types/content'
import StatusBadge from './StatusBadge.vue'
import TechTags from './TechTags.vue'

defineProps<{
  project: Project
}>()

function formatRelativeDate(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}
</script>

<style lang="scss" scoped>
@import '../css/variables';

.project-card {
  display: flex;
  flex-direction: column;
  background-color: $bg-secondary;
  border: 1px solid $border-default;
  border-radius: $radius-md;
  padding: $spacing-lg;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: $accent;
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.project-title {
  margin: 0;
  font-size: 1.25rem;
  color: $text-primary;

  .private-icon {
    color: $text-muted;
    margin-left: 4px;
    vertical-align: middle;
  }
}

.project-tagline {
  color: $text-secondary;
  font-size: 0.9rem;
  margin: 0 0 $spacing-md 0;
  flex-grow: 1;
}

.card-footer {
  margin-top: auto;
  padding-top: $spacing-md;
}

.last-updated {
  font-size: 0.75rem;
  color: $text-muted;
}
</style>
