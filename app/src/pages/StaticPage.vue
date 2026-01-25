<template>
  <q-page class="static-page">
    <div class="container">
      <article v-if="page">
        <header class="page-header">
          <h1>{{ page.title }}</h1>
        </header>

        <div class="markdown-content" v-html="page.content" />
      </article>

      <div v-else class="not-found">
        <h1>Page not found</h1>
        <q-btn to="/" flat color="primary" label="Back home" />
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

const page = computed(() =>
  contentStore.getPage(route.params.slug as string)
)
</script>

<style lang="scss" scoped>
@import '../css/variables';

.static-page {
  padding: $spacing-xl 0 $spacing-2xl;
}

.container {
  max-width: $content-width;
  margin: 0 auto;
  padding: 0 $spacing-md;
}

.page-header {
  margin-bottom: $spacing-xl;
}

.not-found {
  text-align: center;
  padding: $spacing-2xl;
}
</style>
