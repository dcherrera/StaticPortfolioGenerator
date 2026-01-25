<template>
  <q-page class="post-page">
    <div class="container">
      <article v-if="post">
        <header class="post-header">
          <router-link to="/blog" class="back-link">
            <q-icon name="arrow_back" />
            Blog
          </router-link>
          <h1>{{ post.title }}</h1>
          <div class="post-meta">
            <time :datetime="post.date">{{ formatDate(post.date) }}</time>
            <router-link
              v-if="post.project"
              :to="`/projects/${post.project}`"
              class="project-link"
            >
              {{ post.project }}
            </router-link>
          </div>
          <div v-if="post.tags?.length" class="tags">
            <q-chip
              v-for="tag in post.tags"
              :key="tag"
              dense
              size="sm"
            >
              {{ tag }}
            </q-chip>
          </div>
        </header>

        <div class="markdown-content" v-html="post.content" />

        <footer class="post-footer">
          <router-link to="/blog" class="back-link">
            <q-icon name="arrow_back" />
            Back to Blog
          </router-link>
        </footer>
      </article>

      <div v-else class="not-found">
        <h1>Post not found</h1>
        <q-btn to="/blog" flat color="primary" label="Back to blog" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from 'src/stores/content'

const route = useRoute()
const contentStore = useContentStore()

const post = computed(() =>
  contentStore.getBlogPost(route.params.slug as string)
)

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style lang="scss" scoped>
@import '../css/variables';

.post-page {
  padding: $spacing-xl 0 $spacing-2xl;
}

.container {
  max-width: $content-width;
  margin: 0 auto;
  padding: 0 $spacing-md;
}

.post-header {
  margin-bottom: $spacing-xl;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  color: $text-secondary;
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: $spacing-md;

  &:hover {
    color: $accent;
  }
}

h1 {
  margin-bottom: $spacing-sm;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  color: $text-secondary;
  margin-bottom: $spacing-sm;

  time {
    font-size: 0.875rem;
  }
}

.project-link {
  color: $accent;
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    text-decoration: underline;
  }
}

.tags {
  display: flex;
  gap: $spacing-xs;
}

.post-footer {
  margin-top: $spacing-2xl;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-default;
}

.not-found {
  text-align: center;
  padding: $spacing-2xl;
}
</style>
