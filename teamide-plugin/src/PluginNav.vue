<template>
  <div class="spg-nav">
    <div class="spg-nav-header">
      <q-icon name="web" size="24px" />
      <span class="spg-nav-title">Portfolio</span>
    </div>

    <div class="spg-nav-status">
      <q-icon
        :name="store.isConfigured ? 'check_circle' : 'warning'"
        :color="store.isConfigured ? 'positive' : 'warning'"
        size="16px"
      />
      <span class="spg-nav-status-text">
        {{ store.isConfigured ? selectedRepoName : 'No project selected' }}
      </span>
    </div>

    <q-btn
      flat
      dense
      icon="settings"
      label="Plugin Settings"
      class="spg-nav-btn"
      @click="openSettings"
    />

    <!-- Settings Dialog -->
    <q-dialog v-model="showSettings">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Portfolio Generator Settings</div>
        </q-card-section>

        <q-card-section>
          <q-select
            v-model="projectIdInput"
            :options="repoOptions"
            label="Select Repository"
            hint="Choose the portfolio site repository"
            outlined
            dense
            emit-value
            map-options
            class="q-mb-md"
            :loading="isLoadingRepos"
          >
            <template #prepend>
              <q-icon name="folder" />
            </template>
            <template #option="{ itemProps, opt }">
              <q-item v-bind="itemProps">
                <q-item-section avatar>
                  <q-icon name="folder" size="sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ opt.label }}</q-item-label>
                  <q-item-label caption>{{ opt.caption }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Show token status or input -->
          <div v-if="hasTeamIDEToken" class="token-status">
            <q-icon name="check_circle" color="positive" size="20px" />
            <span>Using GitHub token from TeamIDE</span>
          </div>
          <q-input
            v-else
            v-model="tokenInput"
            label="GitHub Token (optional)"
            hint="For fetching commits and README from GitHub"
            outlined
            dense
            type="password"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" @click="saveSettingsAndClose" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSPGStore } from './store';

const store = useSPGStore();

const showSettings = ref(false);
const projectIdInput = ref(store.settings.projectId);
const tokenInput = ref(store.settings.githubToken);
const isLoadingRepos = ref(false);
const availableRepos = ref<Array<{ id: string; name: string; fullName: string }>>([]);

// Check if TeamIDE provides a GitHub token
const hasTeamIDEToken = computed(() => {
  return !!window.__teamide?.getGitHubToken?.();
});

// Compute repo options for dropdown
const repoOptions = computed(() => {
  return availableRepos.value.map(repo => ({
    label: repo.name,
    value: repo.id,
    caption: repo.fullName
  }));
});

// Get the name of the selected repo
const selectedRepoName = computed(() => {
  const repo = availableRepos.value.find(r => r.id === store.settings.projectId);
  return repo?.name || 'Connected';
});

async function fetchAvailableRepos() {
  isLoadingRepos.value = true;
  try {
    // Fetch environments from native-backend
    const response = await fetch('http://localhost:4446/environments', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('teamide-token') || 'default'}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      availableRepos.value = (data.environments || []).map((env: any) => ({
        id: env.id,
        name: env.name,
        fullName: env.repo_full_name || env.name
      }));
    }
  } catch (e) {
    console.error('[SPG] Failed to fetch repos:', e);
  } finally {
    isLoadingRepos.value = false;
  }
}

function openSettings() {
  projectIdInput.value = store.settings.projectId;
  tokenInput.value = store.settings.githubToken;
  showSettings.value = true;
  fetchAvailableRepos();
}

async function saveSettingsAndClose() {
  console.log('[SPG PluginNav] saveSettingsAndClose called, projectId:', projectIdInput.value);
  await store.setProjectId(projectIdInput.value);
  await store.setGitHubToken(tokenInput.value);
  showSettings.value = false;

  console.log('[SPG PluginNav] Settings saved to persistent storage');

  // Reload manifest if project changed
  if (projectIdInput.value) {
    store.loadManifest();
  }
}

onMounted(async () => {
  // Load settings from persistent storage first
  await store.loadSettings();

  // Load manifest if already configured
  if (store.isConfigured) {
    store.loadManifest();
  }
  // Fetch repos for the dropdown
  fetchAvailableRepos();
});
</script>

<style scoped>
.spg-nav {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spg-nav-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spg-nav-title {
  font-weight: 600;
  font-size: 16px;
}

.spg-nav-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--q-secondary);
}

.spg-nav-status-text {
  opacity: 0.8;
}

.spg-nav-btn {
  justify-content: flex-start;
}

.token-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
  font-size: 14px;
  color: #4caf50;
}
</style>
