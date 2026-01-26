<template>
  <div class="site-settings">
    <!-- Header with Save button -->
    <div v-if="hasChanges" class="save-bar">
      <span class="unsaved-label">Unsaved changes</span>
      <q-btn
        flat
        dense
        size="sm"
        color="primary"
        label="Save"
        @click="saveSiteConfig"
        :loading="saving"
      />
    </div>

    <div v-if="loading" class="loading">
      <q-spinner size="24px" />
      <span>Loading site config...</span>
    </div>

    <template v-else-if="config">
      <!-- SITE Section -->
      <div class="settings-section">
        <div class="settings-section-title">SITE</div>
        <q-input
          v-model="config.site.title"
          label="Site Title"
          dense
          outlined
          class="q-mb-sm"
        />
        <q-input
          v-model="config.site.description"
          label="Description"
          dense
          outlined
        />
      </div>

      <!-- HEADER Section -->
      <div class="settings-section">
        <div class="settings-section-title">HEADER</div>
        <q-input
          v-model="config.header.title"
          label="Header Title"
          dense
          outlined
        />
      </div>

      <!-- NAVIGATION LINKS Section -->
      <div class="settings-section">
        <div class="settings-section-title">
          NAVIGATION LINKS
          <q-btn flat dense round size="sm" icon="add" @click="addNavLink" />
        </div>
        <div v-for="(link, index) in config.header.nav" :key="index" class="nav-link-row">
          <q-input
            v-model="link.label"
            placeholder="Label"
            dense
            outlined
            class="nav-link-input"
          />
          <q-input
            v-model="link.path"
            placeholder="/path"
            dense
            outlined
            class="nav-link-input"
          />
          <q-btn flat dense round size="sm" icon="close" @click="removeNavLink(index)" />
        </div>
      </div>

      <!-- FOOTER Section -->
      <div class="settings-section">
        <div class="settings-section-title">FOOTER</div>
        <q-input
          v-model="config.footer.copyright"
          label="Copyright Text"
          dense
          outlined
          class="q-mb-sm"
        />
        <q-input
          v-model="config.footer.github"
          label="GitHub URL"
          dense
          outlined
        />
      </div>

      <!-- SOCIAL LINKS Section -->
      <div class="settings-section">
        <div class="settings-section-title">
          SOCIAL LINKS
          <q-btn flat dense round size="sm" icon="add" @click="addSocialLink" />
        </div>
        <div v-for="(link, index) in config.footer.socialLinks" :key="index" class="nav-link-row">
          <q-input
            v-model="link.platform"
            placeholder="Platform"
            dense
            outlined
            class="nav-link-input"
          />
          <q-input
            v-model="link.url"
            placeholder="URL"
            dense
            outlined
            class="nav-link-input"
          />
          <q-btn flat dense round size="sm" icon="close" @click="removeSocialLink(index)" />
        </div>
        <div v-if="!config.footer.socialLinks?.length" class="empty-hint">
          No social links configured
        </div>
      </div>

      <!-- HOMEPAGE HERO Section -->
      <div class="settings-section">
        <div class="settings-section-title">HOMEPAGE HERO</div>
        <q-input
          v-model="config.homepage.hero.title"
          label="Hero Title"
          dense
          outlined
          class="q-mb-sm"
        />
        <div class="settings-section-subtitle">
          HERO SUBTITLE LINES
          <q-btn flat dense round size="sm" icon="add" @click="addSubtitleLine" />
        </div>
        <div v-for="(line, index) in config.homepage.hero.subtitle" :key="index" class="subtitle-row">
          <q-input
            v-model="config.homepage.hero.subtitle[index]"
            dense
            outlined
            class="subtitle-input"
          />
          <q-btn flat dense round size="sm" icon="close" @click="removeSubtitleLine(index)" />
        </div>
      </div>

      <!-- HOMEPAGE OPTIONS Section -->
      <div class="settings-section">
        <div class="settings-section-title">HOMEPAGE OPTIONS</div>
        <q-toggle
          v-model="config.homepage.showFeaturedProjects"
          label="Show Featured Projects"
          dense
        />
        <q-toggle
          v-model="config.homepage.showRecentPosts"
          label="Show Recent Posts"
          dense
        />
        <q-input
          v-model.number="config.homepage.projectsLimit"
          label="Projects Limit"
          type="number"
          dense
          outlined
          class="q-mt-sm"
        />
        <q-input
          v-model.number="config.homepage.postsLimit"
          label="Posts Limit"
          type="number"
          dense
          outlined
          class="q-mt-sm"
        />
      </div>
    </template>

    <div v-else class="error-state">
      <q-icon name="error" size="24px" color="negative" />
      <span>Failed to load site config</span>
      <q-btn flat dense size="sm" label="Retry" @click="loadSiteConfig" class="q-ml-sm" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useSPGStore } from '../store';
import yaml from 'js-yaml';

interface NavLink {
  label: string;
  path: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface HeroButton {
  label: string;
  path: string;
  style: string;
}

interface SiteConfig {
  site: {
    title: string;
    description: string;
  };
  header: {
    title: string;
    nav: NavLink[];
  };
  footer: {
    copyright: string;
    github: string;
    socialLinks: SocialLink[];
  };
  homepage: {
    hero: {
      title: string;
      subtitle: string[];
      buttons: HeroButton[];
    };
    showFeaturedProjects: boolean;
    showRecentPosts: boolean;
    projectsLimit: number;
    postsLimit: number;
  };
}

const store = useSPGStore();

const loading = ref(false);
const saving = ref(false);
const config = ref<SiteConfig | null>(null);
const originalConfig = ref<string>('');

const SITE_CONFIG_PATH = 'app/public/content/site.yaml';

const hasChanges = computed(() => {
  if (!config.value) return false;
  return yaml.dump(config.value) !== originalConfig.value;
});

async function loadSiteConfig() {
  if (!store.settings.projectId) return;

  loading.value = true;
  try {
    const response = await fetch(`http://localhost:4446/files/${store.settings.projectId}/read?path=${encodeURIComponent(SITE_CONFIG_PATH)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('teamide-token') || 'default'}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const parsed = yaml.load(data.content) as SiteConfig;

      // Ensure all required fields exist
      config.value = {
        site: parsed.site || { title: '', description: '' },
        header: {
          title: parsed.header?.title || '',
          nav: parsed.header?.nav || []
        },
        footer: {
          copyright: parsed.footer?.copyright || '',
          github: parsed.footer?.github || '',
          socialLinks: parsed.footer?.socialLinks || []
        },
        homepage: {
          hero: {
            title: parsed.homepage?.hero?.title || '',
            subtitle: parsed.homepage?.hero?.subtitle || [],
            buttons: parsed.homepage?.hero?.buttons || []
          },
          showFeaturedProjects: parsed.homepage?.showFeaturedProjects ?? true,
          showRecentPosts: parsed.homepage?.showRecentPosts ?? true,
          projectsLimit: parsed.homepage?.projectsLimit ?? 4,
          postsLimit: parsed.homepage?.postsLimit ?? 3
        }
      };

      originalConfig.value = yaml.dump(config.value);
    } else {
      console.error('[SiteSettings] Failed to load:', response.status, await response.text());
      config.value = null;
    }
  } catch (e) {
    console.error('[SiteSettings] Failed to load config:', e);
    config.value = null;
  } finally {
    loading.value = false;
  }
}

async function saveSiteConfig() {
  if (!store.settings.projectId || !config.value) return;

  saving.value = true;
  try {
    const content = yaml.dump(config.value, { indent: 2, lineWidth: -1 });

    const response = await fetch(`http://localhost:4446/files/${store.settings.projectId}/write`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('teamide-token') || 'default'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: SITE_CONFIG_PATH, content })
    });

    if (response.ok) {
      originalConfig.value = content;
      console.log('[SiteSettings] Config saved');
    } else {
      console.error('[SiteSettings] Failed to save:', await response.text());
    }
  } catch (e) {
    console.error('[SiteSettings] Failed to save config:', e);
  } finally {
    saving.value = false;
  }
}

function addNavLink() {
  if (config.value) {
    config.value.header.nav.push({ label: '', path: '' });
  }
}

function removeNavLink(index: number) {
  if (config.value) {
    config.value.header.nav.splice(index, 1);
  }
}

function addSocialLink() {
  if (config.value) {
    if (!config.value.footer.socialLinks) {
      config.value.footer.socialLinks = [];
    }
    config.value.footer.socialLinks.push({ platform: '', url: '' });
  }
}

function removeSocialLink(index: number) {
  if (config.value?.footer.socialLinks) {
    config.value.footer.socialLinks.splice(index, 1);
  }
}

function addSubtitleLine() {
  if (config.value) {
    config.value.homepage.hero.subtitle.push('');
  }
}

function removeSubtitleLine(index: number) {
  if (config.value) {
    config.value.homepage.hero.subtitle.splice(index, 1);
  }
}

// Load config on mount
onMounted(() => {
  if (store.settings.projectId) {
    loadSiteConfig();
  }
});

// Reload when project changes
watch(() => store.settings.projectId, (newId) => {
  config.value = null;
  if (newId) {
    loadSiteConfig();
  }
});
</script>

<style scoped>
.site-settings {
  height: 100%;
}

.save-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  margin-bottom: 8px;
  background: rgba(156, 124, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(156, 124, 255, 0.3);
}

.unsaved-label {
  font-size: 12px;
  color: #9c7cff;
}

.loading,
.error-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  justify-content: center;
  opacity: 0.7;
}

.settings-section {
  margin-bottom: 16px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
}

.settings-section-title {
  font-size: 11px;
  font-weight: 600;
  color: #9c7cff;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.settings-section-subtitle {
  font-size: 10px;
  font-weight: 600;
  color: #888;
  margin: 8px 0 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link-row,
.subtitle-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.nav-link-input {
  flex: 1;
}

.subtitle-input {
  flex: 1;
}

.empty-hint {
  font-size: 12px;
  opacity: 0.5;
  padding: 8px;
  text-align: center;
}
</style>
