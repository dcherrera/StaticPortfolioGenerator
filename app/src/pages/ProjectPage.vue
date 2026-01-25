<template>
  <q-page class="project-page">
    <div class="container">
      <article v-if="project">
        <header class="project-header">
          <div class="header-top">
            <h1>{{ project.title }}</h1>
            <StatusBadge :status="project.status" />
          </div>
          <p v-if="project.tagline" class="tagline">{{ project.tagline }}</p>
          <div class="meta">
            <TechTags v-if="project.tech" :tags="project.tech" />
            <div class="links">
              <q-btn
                v-if="project.links?.repo && !project.private"
                :href="project.links.repo"
                target="_blank"
                flat
                dense
                icon="code"
                label="Source"
              />
              <q-badge
                v-if="project.private"
                color="grey-8"
                text-color="grey-4"
                class="private-badge"
              >
                <q-icon name="lock" size="xs" class="q-mr-xs" />
                Private
              </q-badge>
              <q-btn
                v-if="project.links?.demo"
                :href="project.links.demo"
                target="_blank"
                flat
                dense
                icon="launch"
                label="Demo"
              />
            </div>
          </div>
        </header>

        <div class="project-content">
          <main class="content-main">
            <div class="markdown-content" v-html="project.content" />
          </main>

          <aside class="content-sidebar">
            <div class="sidebar-section">
              <h3>Recent Commits</h3>
              <CommitList :commits="visibleCommits" :limit="10" />
            </div>

            <div v-if="project.posts?.length" class="sidebar-section">
              <h3>Updates</h3>
              <PostList :posts="project.posts" :project-slug="project.slug" />
            </div>
          </aside>
        </div>
      </article>

      <div v-else class="not-found">
        <h1>Project not found</h1>
        <q-btn to="/projects" flat color="primary" label="Back to projects" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import StatusBadge from 'components/StatusBadge.vue'
import TechTags from 'components/TechTags.vue'
import CommitList from 'components/CommitList.vue'
import PostList from 'components/PostList.vue'
import { useContentStore } from 'src/stores/content'

const route = useRoute()
const contentStore = useContentStore()

const project = computed(() =>
  contentStore.getProject(route.params.slug as string)
)

const visibleCommits = computed(() =>
  contentStore.getProjectCommits(route.params.slug as string)
    .filter(c => !c.hidden)
)
</script>

<style lang="scss" scoped>
@import '../css/variables';

.project-page {
  padding: $spacing-xl 0 $spacing-2xl;
}

.container {
  max-width: $container-width;
  margin: 0 auto;
  padding: 0 $spacing-md;
}

.project-header {
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $border-default;
}

.header-top {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  flex-wrap: wrap;

  h1 {
    margin: 0;
  }
}

.tagline {
  color: $text-secondary;
  font-size: 1.25rem;
  margin-top: $spacing-sm;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $spacing-md;
  margin-top: $spacing-md;
}

.links {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.private-badge {
  font-size: 0.75rem;
  padding: 4px 8px;
}

.project-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: $spacing-xl;

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: 1fr;
  }
}

.content-main {
  min-width: 0;
}

.content-sidebar {
  @media (max-width: $breakpoint-sm) {
    order: -1;
  }
}

.sidebar-section {
  background-color: $bg-secondary;
  border: 1px solid $border-default;
  border-radius: $radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;

  h3 {
    font-size: 1rem;
    margin: 0 0 $spacing-md 0;
    color: $text-secondary;
  }
}

.not-found {
  text-align: center;
  padding: $spacing-2xl;
}
</style>
