<template>
  <div class="tech-tags">
    <span
      v-for="tag in displayedTags"
      :key="tag"
      class="tech-tag"
    >
      {{ tag }}
    </span>
    <span v-if="remainingCount > 0" class="more-tag">
      +{{ remainingCount }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  tags: string[]
  limit?: number
}>(), {
  limit: 0
})

const displayedTags = computed(() =>
  props.limit > 0 ? props.tags.slice(0, props.limit) : props.tags
)

const remainingCount = computed(() =>
  props.limit > 0 ? Math.max(0, props.tags.length - props.limit) : 0
)
</script>

<style lang="scss" scoped>
@import '../css/variables';

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.tech-tag {
  font-size: 0.75rem;
  padding: 0.2em 0.6em;
  background-color: $bg-tertiary;
  color: $text-secondary;
  border-radius: $radius-sm;
}

.more-tag {
  font-size: 0.75rem;
  padding: 0.2em 0.6em;
  color: $text-muted;
}
</style>
