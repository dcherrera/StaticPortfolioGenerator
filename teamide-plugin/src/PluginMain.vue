<template>
  <div class="spg-main">
    <!-- Not configured state -->
    <div v-if="!store.isConfigured" class="empty-state">
      <q-icon name="settings" size="64px" color="grey-6" />
      <h3>No Project Selected</h3>
      <p>Open the Portfolio nav panel and select a project in settings.</p>
    </div>

    <!-- No file selected state -->
    <div v-else-if="!store.currentFilePath" class="empty-state">
      <q-icon name="description" size="64px" color="grey-6" />
      <h3>No File Selected</h3>
      <p>Select a project, blog post, or page from the Site Structure panel.</p>
    </div>

    <!-- File editor -->
    <div v-else class="file-editor">
      <!-- File header -->
      <div class="file-header">
        <q-icon name="description" size="20px" />
        <span class="file-path">{{ store.currentFilePath }}</span>
        <q-space />
        <q-btn
          flat
          dense
          round
          icon="refresh"
          size="sm"
          :loading="store.isLoading"
          @click="reloadFile"
        >
          <q-tooltip>Reload file</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          round
          icon="close"
          size="sm"
          @click="closeFile"
        >
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </div>

      <!-- Loading state -->
      <div v-if="store.isLoading" class="loading-state">
        <q-spinner-dots size="40px" color="primary" />
        <p>Loading file...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="store.error" class="error-state">
        <q-icon name="error" size="48px" color="negative" />
        <p>{{ store.error }}</p>
        <q-btn flat color="primary" label="Retry" @click="reloadFile" />
      </div>

      <!-- Editor content -->
      <template v-else>
        <!-- Properties Panel (for markdown files with frontmatter) -->
        <PropertiesPanel
          v-if="isMarkdownFile && parsedContent.hasFrontmatter"
          :properties="parsedContent.frontmatter"
          class="properties-section"
          @update="onFrontmatterUpdate"
        />

        <!-- Markdown Editor -->
        <MarkdownEditor
          v-if="isMarkdownFile"
          :content="parsedContent.content"
          :is-modified="store.isFileModified"
          :is-saving="isSaving"
          class="editor-section"
          @change="onContentChange"
          @save="saveFile"
        />

        <!-- Non-markdown: show raw content -->
        <div v-else class="raw-content">
          <pre>{{ store.currentFileContent }}</pre>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSPGStore } from './store';
import { parseFrontmatter, serializeFrontmatter } from './services/frontmatter';
import PropertiesPanel from './components/PropertiesPanel.vue';
import MarkdownEditor from './components/MarkdownEditor.vue';

const store = useSPGStore();
const isSaving = ref(false);

// Check if current file is markdown
const isMarkdownFile = computed(() => {
  const path = store.currentFilePath;
  if (!path) return false;
  const ext = path.split('.').pop()?.toLowerCase();
  return ext === 'md' || ext === 'mdx' || ext === 'markdown';
});

// Parse frontmatter from content
const parsedContent = computed(() => {
  return parseFrontmatter(store.currentFileContent || '');
});

function onFrontmatterUpdate(newFrontmatter: Record<string, unknown>) {
  // Serialize frontmatter + body back together
  const newContent = serializeFrontmatter(newFrontmatter, parsedContent.value.content);
  store.updateFileContent(newContent);
}

function onContentChange(newBody: string) {
  // Keep frontmatter, update body
  if (parsedContent.value.hasFrontmatter) {
    const newContent = serializeFrontmatter(parsedContent.value.frontmatter, newBody);
    store.updateFileContent(newContent);
  } else {
    store.updateFileContent(newBody);
  }
}

async function saveFile() {
  isSaving.value = true;
  try {
    await store.saveCurrentFile();
  } finally {
    isSaving.value = false;
  }
}

async function reloadFile() {
  if (store.currentFilePath) {
    await store.openFileInPlugin(store.currentFilePath);
  }
}

function closeFile() {
  store.closeCurrentFile();
}
</script>

<style scoped>
.spg-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #121212;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #888;
  padding: 24px;
}

.empty-state h3 {
  margin: 16px 0 8px;
  font-weight: 500;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  opacity: 0.7;
}

.file-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.file-path {
  font-size: 12px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
  color: #888;
}

.properties-section {
  margin: 12px;
  flex-shrink: 0;
}

.editor-section {
  flex: 1;
  min-height: 0;
}

.raw-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.raw-content pre {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #ddd;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
