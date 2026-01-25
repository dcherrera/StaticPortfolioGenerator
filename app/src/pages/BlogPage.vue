<template>
  <q-page class="blog-page">
    <div class="container">
      <header class="page-header">
        <h1>Blog</h1>
        <p class="page-description">
          Thoughts, tutorials, and updates.
        </p>
      </header>

      <div class="posts-list">
        <article
          v-for="post in posts"
          :key="post.slug"
          class="post-card"
        >
          <router-link :to="`/blog/${post.slug}`" class="post-link">
            <h2>{{ post.title }}</h2>
            <div class="post-meta">
              <time :datetime="post.date">{{ formatDate(post.date) }}</time>
              <span v-if="post.project" class="project-tag">
                {{ post.project }}
              </span>
            </div>
            <p v-if="post.excerpt" class="excerpt">{{ post.excerpt }}</p>
          </router-link>
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
        </article>
      </div>

      <div v-if="posts.length === 0" class="empty-state">
        <p>No blog posts yet.</p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from 'src/stores/content'

const contentStore = useContentStore()

const posts = computed(() => contentStore.blogPosts)

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

.blog-page {
  padding: $spacing-xl 0 $spacing-2xl;
}

.container {
  max-width: $content-width;
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

.posts-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.post-card {
  background-color: $bg-secondary;
  border: 1px solid $border-default;
  border-radius: $radius-md;
  padding: $spacing-lg;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: $accent;
  }
}

.post-link {
  text-decoration: none;
  color: inherit;

  h2 {
    margin: 0 0 $spacing-sm 0;
    font-size: 1.5rem;
    color: $text-primary;
  }
}

.post-meta {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  color: $text-secondary;
  font-size: 0.875rem;
  margin-bottom: $spacing-sm;
}

.project-tag {
  background-color: $bg-tertiary;
  padding: 0.15em 0.5em;
  border-radius: $radius-sm;
}

.excerpt {
  color: $text-secondary;
  margin: 0;
}

.tags {
  display: flex;
  gap: $spacing-xs;
  margin-top: $spacing-md;
}

.empty-state {
  text-align: center;
  padding: $spacing-2xl;
  color: $text-secondary;
}
</style>
