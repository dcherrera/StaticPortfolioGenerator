<template>
  <q-page class="home-page">
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">{{ siteConfig.homepage.hero.title }}</h1>
        <p v-for="(line, index) in subtitleLines" :key="index" class="hero-tagline">{{ line }}</p>
        <div class="hero-actions">
          <q-btn
            v-for="(btn, index) in heroButtons"
            :key="index"
            :to="btn.path"
            :color="btn.style === 'primary' ? 'primary' : undefined"
            :outline="btn.style === 'outline'"
            :unelevated="btn.style === 'primary'"
            :label="btn.label"
          />
        </div>
      </div>
    </section>

    <section class="featured-projects">
      <div class="container">
        <h2 class="section-title">Featured Projects</h2>
        <div v-if="featuredProjects.length > 0" class="projects-grid">
          <router-link
            v-for="project in featuredProjects"
            :key="project.slug"
            :to="`/projects/${project.slug}`"
            class="project-card"
          >
            <div class="project-status" :class="project.status">
              {{ project.status }}
            </div>
            <h3 class="project-title">{{ project.title }}</h3>
            <p v-if="project.tagline" class="project-tagline">{{ project.tagline }}</p>
            <div v-if="project.tech?.length" class="project-tech">
              <span v-for="tech in project.tech" :key="tech" class="tech-tag">{{ tech }}</span>
            </div>
          </router-link>
        </div>
        <p v-else class="empty-state">No projects yet. Add some to content/projects/</p>
      </div>
    </section>

    <section class="recent-activity">
      <div class="container">
        <h2 class="section-title">Recent Activity</h2>
        <div v-if="recentActivity.length > 0" class="activity-list">
          <div v-for="item in recentActivity.slice(0, 5)" :key="item.id" class="activity-item">
            <span class="activity-icon">{{ item.type === 'commit' ? '&gt;' : '*' }}</span>
            <span class="activity-message">{{ item.message }}</span>
            <span v-if="item.projectName" class="activity-project">{{ item.projectName }}</span>
            <span class="activity-date">{{ formatDate(item.date) }}</span>
          </div>
        </div>
        <p v-else class="empty-state">No recent activity yet.</p>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from 'src/stores/content'

const contentStore = useContentStore()

const siteConfig = computed(() => contentStore.siteConfig)
const featuredProjects = computed(() => contentStore.featuredProjects)
const recentActivity = computed(() => contentStore.recentActivity)

// Get subtitle lines array
const subtitleLines = computed(() => {
  const subtitle = siteConfig.value.homepage.hero.subtitle
  if (!subtitle) return []
  // Support both array and legacy string format
  if (Array.isArray(subtitle)) return subtitle
  return [subtitle]
})

// Default hero buttons if not configured
const heroButtons = computed(() => {
  return siteConfig.value.homepage.hero.buttons || [
    { label: 'View Projects', path: '/projects', style: 'primary' as const },
    { label: 'About Me', path: '/about', style: 'outline' as const }
  ]
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}
</script>

<style lang="scss" scoped>
$bg-primary: #0d1117;
$bg-secondary: #161b22;
$text-primary: #e6edf3;
$text-secondary: #8b949e;
$accent: #58a6ff;
$border-default: #30363d;

.home-page {
  padding-bottom: 48px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.hero {
  padding: 96px 0;
  text-align: center;
  background: linear-gradient(180deg, $bg-secondary 0%, $bg-primary 100%);
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: $text-primary;
}

.hero-tagline {
  font-size: 1.25rem;
  color: $text-secondary;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.section-title {
  font-size: 1.75rem;
  margin-bottom: 24px;
  color: $text-primary;
}

.featured-projects,
.recent-activity {
  padding: 48px 0;
}

.empty-state {
  color: $text-secondary;
  font-style: italic;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.project-card {
  display: block;
  background: $bg-secondary;
  border: 1px solid $border-default;
  border-radius: 8px;
  padding: 24px;
  text-decoration: none;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: $accent;
  }
}

.project-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 12px;

  &.active { background: #238636; color: #fff; }
  &.maintained { background: #1f6feb; color: #fff; }
  &.paused { background: #9e6a03; color: #fff; }
  &.archived { background: #6e7681; color: #fff; }
  &.concept { background: #8957e5; color: #fff; }
}

.project-title {
  font-size: 1.25rem;
  color: $text-primary;
  margin-bottom: 8px;
}

.project-tagline {
  color: $text-secondary;
  font-size: 0.875rem;
  margin-bottom: 12px;
}

.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  background: rgba(88, 166, 255, 0.1);
  color: $accent;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: $bg-secondary;
  border-radius: 6px;
}

.activity-icon {
  color: $accent;
  font-family: monospace;
  font-weight: bold;
}

.activity-message {
  flex: 1;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-project {
  color: $text-secondary;
  font-size: 0.875rem;
}

.activity-date {
  color: $text-secondary;
  font-size: 0.75rem;
  white-space: nowrap;
}
</style>
