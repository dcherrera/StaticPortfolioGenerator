<template>
  <div class="spg-context">
    <div v-if="!store.isConfigured" class="not-configured">
      <q-icon name="info" size="48px" />
      <p>No project selected</p>
      <p class="hint">Open the Portfolio nav panel and configure a project ID in settings.</p>
    </div>

    <template v-else>
      <!-- Quick Actions (at top) -->
      <QuickActions
        @new-project="showNewProjectDialog = true"
        @new-blog-post="showNewBlogPostDialog = true"
        @new-page="showNewPageDialog = true"
      />

      <!-- Tabs -->
      <q-tabs
        v-model="activeTab"
        dense
        class="context-tabs"
        active-color="primary"
        indicator-color="primary"
        narrow-indicator
      >
        <q-tab name="structure" label="Structure" />
        <q-tab name="commits" label="Commits" />
        <q-tab name="settings" label="Settings" />
      </q-tabs>

      <q-separator />

      <!-- Tab Panels -->
      <q-tab-panels v-model="activeTab" animated class="tab-panels">
        <q-tab-panel name="structure" class="tab-panel">
          <SiteStructure
            @new-project="showNewProjectDialog = true"
            @new-blog-post="showNewBlogPostDialog = true"
            @new-page="showNewPageDialog = true"
            @delete-project="confirmDeleteProject"
            @delete-blog-post="confirmDeleteBlogPost"
            @delete-page="confirmDeletePage"
            @open-file="openFile"
          />
        </q-tab-panel>

        <q-tab-panel name="commits" class="tab-panel">
          <CommitCuration />
        </q-tab-panel>

        <q-tab-panel name="settings" class="tab-panel">
          <SiteSettings />
        </q-tab-panel>
      </q-tab-panels>
    </template>

    <!-- Dialogs -->
    <NewProjectDialog v-model="showNewProjectDialog" />
    <NewBlogPostDialog v-model="showNewBlogPostDialog" />
    <NewPageDialog v-model="showNewPageDialog" />
    <ConfirmDeleteDialog
      v-model="showDeleteDialog"
      :item-name="deleteItemName"
      :item-type="deleteItemType"
      @confirm="executeDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSPGStore } from './store';
import { deleteFile } from './services/files';
import * as manifestService from './services/manifest';
import { CONTENT_PATH } from './types';
import SiteStructure from './components/SiteStructure.vue';
import CommitCuration from './components/CommitCuration.vue';
import QuickActions from './components/QuickActions.vue';
import SiteSettings from './components/SiteSettings.vue';
import NewProjectDialog from './components/NewProjectDialog.vue';
import NewBlogPostDialog from './components/NewBlogPostDialog.vue';
import NewPageDialog from './components/NewPageDialog.vue';
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog.vue';

const store = useSPGStore();

// Tab state
const activeTab = ref('structure');

// Dialog visibility
const showNewProjectDialog = ref(false);
const showNewBlogPostDialog = ref(false);
const showNewPageDialog = ref(false);
const showDeleteDialog = ref(false);

// Delete confirmation state
const deleteItemName = ref('');
const deleteItemType = ref<'project' | 'blog' | 'page'>('project');
const pendingDelete = ref<{ type: string; data: any } | null>(null);

function openFile(path: string) {
  console.log('[SPG Plugin] openFile called:', path);
  // Open file in the plugin's embedded editor (stays in plugin module)
  store.openFileInPlugin(path);
}

function confirmDeleteProject(project: { slug: string }) {
  deleteItemName.value = project.slug;
  deleteItemType.value = 'project';
  pendingDelete.value = { type: 'project', data: project };
  showDeleteDialog.value = true;
}

function confirmDeleteBlogPost(post: { path: string }) {
  deleteItemName.value = post.path.split('/').pop() || post.path;
  deleteItemType.value = 'blog';
  pendingDelete.value = { type: 'blog', data: post };
  showDeleteDialog.value = true;
}

function confirmDeletePage(page: { path: string }) {
  deleteItemName.value = page.path.split('/').pop() || page.path;
  deleteItemType.value = 'page';
  pendingDelete.value = { type: 'page', data: page };
  showDeleteDialog.value = true;
}

async function executeDelete() {
  if (!pendingDelete.value || !store.settings.projectId) return;

  const projectId = store.settings.projectId;

  try {
    if (pendingDelete.value.type === 'project') {
      const slug = pendingDelete.value.data.slug;
      // Remove from manifest
      await manifestService.removeProject(projectId, slug);
      // Delete project directory
      await deleteFile(projectId, `${CONTENT_PATH}/projects/${slug}`);
      // Close file if it was open
      if (store.currentFilePath?.includes(`/projects/${slug}/`)) {
        store.closeCurrentFile();
      }
    } else if (pendingDelete.value.type === 'blog') {
      const path = pendingDelete.value.data.path;
      await manifestService.removeBlogPost(projectId, path);
      const fullPath = path.startsWith('/content') ? `app/public${path}` : path;
      await deleteFile(projectId, fullPath);
      if (store.currentFilePath === fullPath) {
        store.closeCurrentFile();
      }
    } else if (pendingDelete.value.type === 'page') {
      const path = pendingDelete.value.data.path;
      await manifestService.removePage(projectId, path);
      const fullPath = path.startsWith('/content') ? `app/public${path}` : path;
      await deleteFile(projectId, fullPath);
      if (store.currentFilePath === fullPath) {
        store.closeCurrentFile();
      }
    }
  } catch (e) {
    console.error('[SPG] Delete failed:', e);
    store.error = e instanceof Error ? e.message : 'Failed to delete';
  }

  pendingDelete.value = null;
  showDeleteDialog.value = false;

  // Reload manifest
  await store.loadManifest();
}
</script>

<style scoped>
.spg-context {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.context-tabs {
  margin-top: 8px;
  flex-shrink: 0;
}

.tab-panels {
  flex: 1;
  overflow: hidden;
  background: transparent;
}

.tab-panel {
  padding: 12px;
  height: 100%;
  overflow-y: auto;
}

.not-configured {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  opacity: 0.6;
  padding: 12px;
}

.not-configured p {
  margin: 8px 0 0;
}

.not-configured .hint {
  font-size: 12px;
  opacity: 0.7;
}
</style>
