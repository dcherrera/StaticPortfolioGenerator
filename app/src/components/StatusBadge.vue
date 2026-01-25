<template>
  <span :class="['status-badge', `status-${status}`, `size-${size}`]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectStatus } from 'src/types/content'

const props = withDefaults(defineProps<{
  status: ProjectStatus
  size?: 'sm' | 'md'
}>(), {
  size: 'md'
})

const statusLabels: Record<ProjectStatus, string> = {
  active: 'Active',
  maintained: 'Maintained',
  paused: 'Paused',
  archived: 'Archived',
  concept: 'Concept'
}

const label = computed(() => statusLabels[props.status])
</script>

<style lang="scss" scoped>
@import '../css/variables';

.status-badge {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  border-radius: 9999px;
  white-space: nowrap;

  &.size-sm {
    font-size: 0.7rem;
    padding: 0.15em 0.6em;
  }

  &.size-md {
    font-size: 0.8rem;
    padding: 0.25em 0.75em;
  }

  &.status-active {
    background-color: rgba($status-active, 0.15);
    color: $status-active;
  }

  &.status-maintained {
    background-color: rgba($status-maintained, 0.15);
    color: $status-maintained;
  }

  &.status-paused {
    background-color: rgba($status-paused, 0.15);
    color: $status-paused;
  }

  &.status-archived {
    background-color: rgba($status-archived, 0.15);
    color: $status-archived;
  }

  &.status-concept {
    background-color: rgba($status-concept, 0.15);
    color: $status-concept;
  }
}
</style>
