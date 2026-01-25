<template>
  <q-page class="projects-page">
    <div class="container">
      <header class="page-header">
        <h1>Projects</h1>
        <p class="page-description">
          A collection of things I've built and am working on.
        </p>
      </header>

      <div class="filters">
        <q-btn-toggle
          v-model="statusFilter"
          toggle-color="primary"
          flat
          :options="statusOptions"
        />
      </div>

      <div class="projects-grid">
        <ProjectCard
          v-for="project in filteredProjects"
          :key="project.slug"
          :project="project"
        />
      </div>

      <div v-if="filteredProjects.length === 0" class="empty-state">
        <p>No projects match the selected filter.</p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ProjectCard from 'components/ProjectCard.vue'
import { useContentStore } from 'src/stores/content'

const contentStore = useContentStore()

const statusFilter = ref('all')

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Maintained', value: 'maintained' },
  { label: 'Paused', value: 'paused' },
  { label: 'Archived', value: 'archived' },
  { label: 'Concept', value: 'concept' }
]

const filteredProjects = computed(() => {
  if (statusFilter.value === 'all') {
    return contentStore.projects
  }
  return contentStore.projects.filter(p => p.status === statusFilter.value)
})
</script>

<style lang="scss" scoped>
@import '../css/variables';

.projects-page {
  padding: $spacing-xl 0 $spacing-2xl;
}

.container {
  max-width: $container-width;
  margin: 0 auto;
  padding: 0 $spacing-md;
}

.page-header {
  margin-bottom: $spacing-xl;

  h1 {
    margin-bottom: $spacing-sm;
  }
}

.page-description {
  color: $text-secondary;
  font-size: 1.125rem;
}

.filters {
  margin-bottom: $spacing-lg;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-lg;
}

.empty-state {
  text-align: center;
  padding: $spacing-2xl;
  color: $text-secondary;
}
</style>
