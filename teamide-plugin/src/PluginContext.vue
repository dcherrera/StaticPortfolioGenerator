<template>
  <div class="spg-context">
    <div v-if="!store.isConfigured" class="not-configured">
      <q-icon name="info" size="48px" />
      <p>No project selected</p>
      <p class="hint">Open the Portfolio nav panel and configure a project ID in settings.</p>
    </div>

    <template v-else>
      <!-- Site Structure -->
      <SiteStructure
        @new-project="showNewProjectDialog = true"
        @new-blog-post="showNewBlogPostDialog = true"
        @new-page="showNewPageDialog = true"
        @delete-project="confirmDeleteProject"
        @delete-blog-post="confirmDeleteBlogPost"
        @delete-page="confirmDeletePage"
        @open-file="openFile"
      />

      <q-separator class="q-my-md" />

      <!-- Commit Curation -->
      <CommitCuration />

      <q-separator class="q-my-md" />

      <!-- Quick Actions -->
      <QuickActions
        @new-project="showNewProjectDialog = true"
        @new-blog-post="showNewBlogPostDialog = true"
        @new-page="showNewPageDialog = true"
      />
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
import SiteStructure from './components/SiteStructure.vue';
import CommitCuration from './components/CommitCuration.vue';
import QuickActions from './components/QuickActions.vue';
import NewProjectDialog from './components/NewProjectDialog.vue';
import NewBlogPostDialog from './components/NewBlogPostDialog.vue';
import NewPageDialog from './components/NewPageDialog.vue';
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog.vue';

const store = useSPGStore();

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
  if (!pendingDelete.value) return;

  // TODO: Implement actual deletion via manifest service
  console.log('Delete:', pendingDelete.value);

  pendingDelete.value = null;
  showDeleteDialog.value = false;

  // Reload manifest
  await store.loadManifest();
}
</script>

<style scoped>
.spg-context {
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
}

.not-configured p {
  margin: 8px 0 0;
}

.not-configured .hint {
  font-size: 12px;
  opacity: 0.7;
}
</style>
