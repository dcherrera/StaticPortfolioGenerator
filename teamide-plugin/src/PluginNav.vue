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
        {{ store.isConfigured ? 'Connected' : 'No project selected' }}
      </span>
    </div>

    <q-btn
      flat
      dense
      icon="settings"
      label="Settings"
      class="spg-nav-btn"
      @click="showSettings = true"
    />

    <!-- Settings Dialog -->
    <q-dialog v-model="showSettings">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Plugin Settings</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="projectIdInput"
            label="Project ID"
            hint="The repository identifier for file operations"
            outlined
            dense
            class="q-mb-md"
          />

          <q-input
            v-model="tokenInput"
            label="GitHub Token"
            hint="Personal access token for GitHub API"
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
import { ref, onMounted } from 'vue';
import { useSPGStore } from './store';

const store = useSPGStore();

const showSettings = ref(false);
const projectIdInput = ref(store.settings.projectId);
const tokenInput = ref(store.settings.githubToken);

function saveSettingsAndClose() {
  store.setProjectId(projectIdInput.value);
  store.setGitHubToken(tokenInput.value);
  showSettings.value = false;

  // Reload manifest if project changed
  if (projectIdInput.value) {
    store.loadManifest();
  }
}

onMounted(() => {
  // Load manifest if already configured
  if (store.isConfigured) {
    store.loadManifest();
  }
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
</style>
