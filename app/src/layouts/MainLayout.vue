<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="header">
      <q-toolbar class="container">
        <router-link to="/" class="logo">
          <span class="logo-text">{{ siteConfig.header.title }}</span>
        </router-link>

        <q-space />

        <nav class="nav-links gt-xs">
          <router-link
            v-for="link in siteConfig.header.nav"
            :key="link.path"
            :to="link.path"
            class="nav-link"
          >
            {{ link.label }}
          </router-link>
        </nav>

        <q-btn
          flat
          dense
          round
          icon="menu"
          class="lt-sm"
          @click="drawer = !drawer"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      side="right"
      overlay
      behavior="mobile"
      class="drawer"
    >
      <q-list>
        <q-item
          v-for="link in siteConfig.header.nav"
          :key="link.path"
          :to="link.path"
          clickable
          v-close-popup
        >
          <q-item-section>{{ link.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="footer">
      <div class="container footer-content">
        <!-- Left: User GitHub -->
        <div class="footer-section footer-left">
          <a
            v-if="siteConfig.footer.github"
            :href="siteConfig.footer.github"
            target="_blank"
            rel="noopener"
            class="footer-link"
          >
            GitHub
          </a>
          <a
            v-for="link in siteConfig.footer.socialLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener"
            class="footer-link"
          >
            {{ link.label }}
          </a>
        </div>

        <!-- Center: Static Portfolio Generator credit -->
        <div class="footer-section footer-center">
          <span class="powered-by">
            Built with
            <a
              href="https://github.com/dcherrera/StaticPortfolioGenerator"
              target="_blank"
              rel="noopener"
              class="spg-link"
            >
              Static Portfolio Generator
            </a>
          </span>
        </div>

        <!-- Right: Copyright -->
        <div class="footer-section footer-right">
          <span class="copyright">&copy; {{ siteConfig.footer.copyright }}</span>
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useContentStore } from 'src/stores/content'

const drawer = ref(false)
const contentStore = useContentStore()
const siteConfig = computed(() => contentStore.siteConfig)

// Set document title from site config
watch(
  () => siteConfig.value.title,
  (title) => {
    if (title) {
      document.title = title
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
$bg-primary: #0d1117;
$bg-secondary: #161b22;
$text-primary: #e6edf3;
$text-secondary: #8b949e;
$accent: #58a6ff;
$border-default: #30363d;

.header {
  background-color: $bg-secondary;
  border-bottom: 1px solid $border-default;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  width: 100%;
}

.logo {
  text-decoration: none;
  color: $text-primary;

  .logo-text {
    font-weight: 700;
    font-size: 1.25rem;
  }
}

.nav-links {
  display: flex;
  gap: 24px;
}

.nav-link {
  color: $text-secondary;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;

  &:hover,
  &.router-link-active {
    color: $text-primary;
  }
}

.drawer {
  background-color: $bg-secondary;
}

.footer {
  background-color: $bg-secondary;
  border-top: 1px solid $border-default;
  padding: 16px 0;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer-left {
  flex: 1;
}

.footer-center {
  flex: 1;
  justify-content: center;
  text-align: center;
}

.footer-right {
  flex: 1;
  justify-content: flex-end;
}

.footer-link {
  color: $text-secondary;
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    color: $accent;
  }
}

.powered-by {
  color: $text-secondary;
  font-size: 0.75rem;
}

.spg-link {
  color: $text-secondary;
  text-decoration: none;

  &:hover {
    color: $accent;
  }
}

.copyright {
  color: $text-secondary;
  font-size: 0.875rem;
}
</style>
