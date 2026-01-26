<template>
  <div class="markdown-editor">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <div class="view-toggle">
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'edit' }"
          @click="viewMode = 'edit'"
          title="Edit"
        >
          <q-icon name="edit" size="16px" />
        </button>
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'split' }"
          @click="viewMode = 'split'"
          title="Split"
        >
          <q-icon name="vertical_split" size="16px" />
        </button>
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'preview' }"
          @click="viewMode = 'preview'"
          title="Preview"
        >
          <q-icon name="visibility" size="16px" />
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <span v-if="isModified" class="modified-indicator">
        <span class="dot"></span>
        Modified
      </span>

      <button
        class="save-btn"
        :class="{ disabled: !isModified }"
        :disabled="!isModified || isSaving"
        @click="$emit('save')"
        title="Save (Ctrl+S)"
      >
        <q-icon v-if="!isSaving" name="save" size="16px" />
        <q-spinner v-else size="14px" />
      </button>
    </div>

    <!-- Editor Container -->
    <div class="editor-container" :class="viewMode">
      <!-- Edit Pane -->
      <div v-if="viewMode !== 'preview'" class="edit-pane">
        <textarea
          ref="textareaRef"
          :value="content"
          class="markdown-textarea"
          placeholder="Write markdown here..."
          spellcheck="false"
          @input="onInput"
          @keydown="onKeydown"
        />
      </div>

      <!-- Preview Pane -->
      <div v-if="viewMode !== 'edit'" class="preview-pane">
        <div class="markdown-preview" v-html="renderedContent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

const props = defineProps<{
  content: string;
  isModified?: boolean;
  isSaving?: boolean;
}>();

const emit = defineEmits<{
  change: [content: string];
  save: [];
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const viewMode = ref<'edit' | 'preview' | 'split'>('preview');

const renderedContent = computed(() => {
  try {
    return md.render(props.content || '');
  } catch (e) {
    console.error('[SPG] Markdown render error:', e);
    return '<p class="error">Error rendering markdown</p>';
  }
});

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit('change', target.value);
}

function onKeydown(event: KeyboardEvent) {
  // Ctrl/Cmd + S to save
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    emit('save');
  }

  // Tab inserts spaces
  if (event.key === 'Tab') {
    event.preventDefault();
    const textarea = textareaRef.value;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    textarea.value = value.substring(0, start) + '  ' + value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + 2;
    emit('change', textarea.value);
  }
}

// Focus textarea when switching to edit mode
watch(viewMode, (mode) => {
  if (mode === 'edit' || mode === 'split') {
    setTimeout(() => textareaRef.value?.focus(), 100);
  }
});
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.view-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 2px;
}

.toggle-btn {
  background: transparent;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.toggle-btn:hover {
  color: #bbb;
}

.toggle-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.toolbar-spacer {
  flex: 1;
}

.modified-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #ffa726;
}

.modified-indicator .dot {
  width: 6px;
  height: 6px;
  background: #ffa726;
  border-radius: 50%;
}

.save-btn {
  background: transparent;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.save-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.save-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.editor-container {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.editor-container.edit .edit-pane {
  width: 100%;
}

.editor-container.preview .preview-pane {
  width: 100%;
}

.editor-container.split .edit-pane,
.editor-container.split .preview-pane {
  width: 50%;
}

.edit-pane {
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.preview-pane {
  overflow-y: auto;
}

.markdown-textarea {
  flex: 1;
  width: 100%;
  padding: 20px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #d4d4d4;
  tab-size: 2;
}

.markdown-textarea::placeholder {
  color: #555;
}

/* Markdown Preview Styles - using explicit px values to override global styles */
.markdown-preview {
  padding: 16px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 14px !important;
  line-height: 1.6;
  color: #d4d4d4;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h1:first-child) {
  font-size: 22px !important;
  font-weight: 600 !important;
  margin: 0 0 12px !important;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff !important;
  line-height: 1.3 !important;
}

.markdown-preview :deep(h2) {
  font-size: 18px !important;
  font-weight: 600 !important;
  margin: 20px 0 10px !important;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: #fff !important;
  line-height: 1.3 !important;
}

.markdown-preview :deep(h3) {
  font-size: 16px !important;
  font-weight: 600 !important;
  margin: 16px 0 8px !important;
  color: #fff !important;
  line-height: 1.3 !important;
}

.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  font-size: 14px !important;
  font-weight: 600 !important;
  margin: 12px 0 6px !important;
  color: #e0e0e0 !important;
  line-height: 1.3 !important;
}

.markdown-preview :deep(p) {
  margin: 0 0 10px !important;
  font-size: 14px !important;
}

.markdown-preview :deep(a) {
  color: #58a6ff;
  text-decoration: none;
}

.markdown-preview :deep(a:hover) {
  text-decoration: underline;
}

.markdown-preview :deep(strong) {
  font-weight: 600;
  color: #fff;
}

.markdown-preview :deep(em) {
  font-style: italic;
}

.markdown-preview :deep(code) {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 5px;
  border-radius: 3px;
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 13px !important;
}

.markdown-preview :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  padding: 12px 14px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0 !important;
}

.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 13px !important;
}

.markdown-preview :deep(blockquote) {
  margin: 10px 0 !important;
  padding: 4px 14px;
  border-left: 3px solid #58a6ff;
  color: #a0a0a0;
  background: rgba(88, 166, 255, 0.05);
  border-radius: 0 4px 4px 0;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 10px 0 !important;
  padding-left: 20px !important;
}

.markdown-preview :deep(li) {
  margin: 3px 0 !important;
  font-size: 14px !important;
}

.markdown-preview :deep(li > ul),
.markdown-preview :deep(li > ol) {
  margin: 3px 0 !important;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 10px 0 !important;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0 !important;
  font-size: 13px !important;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 6px 10px;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: rgba(255, 255, 255, 0.05);
  font-weight: 600;
}

.markdown-preview :deep(hr) {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  margin: 20px 0 !important;
}

.markdown-preview :deep(.error) {
  color: #ff6b6b;
  font-style: italic;
}
</style>
