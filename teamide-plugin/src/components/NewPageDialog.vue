<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Create New Page</div>
      </q-card-section>

      <q-card-section>
        <!-- Title -->
        <q-input
          v-model="title"
          label="Title"
          hint="Page title"
          outlined
          dense
          class="q-mb-md"
          @update:model-value="onTitleChange"
        />

        <!-- Filename -->
        <q-input
          v-model="filename"
          label="Filename"
          hint="Without .md extension"
          outlined
          dense
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          label="Create Page"
          :loading="creating"
          @click="createPage"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSPGStore } from '../store';
import { slugify, generatePageMd } from '../services/templates';
import { writeFile, ensureDirectory } from '../services/files';
import * as manifestService from '../services/manifest';
import { CONTENT_PATH } from '../types';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const store = useSPGStore();

const title = ref('');
const filename = ref('');
const creating = ref(false);

function onTitleChange(value: string) {
  // Auto-generate filename from title
  filename.value = slugify(value);
}

async function createPage() {
  if (!title.value || !filename.value || !store.settings.projectId) {
    return;
  }

  creating.value = true;

  try {
    const projectId = store.settings.projectId;
    const filePath = `${CONTENT_PATH}/pages/${filename.value}.md`;

    // Ensure pages directory exists
    await ensureDirectory(projectId, `${CONTENT_PATH}/pages`);

    // Create page file
    const content = generatePageMd(title.value);
    await writeFile(projectId, filePath, content);

    // Update manifest
    await manifestService.addPage(projectId, {
      path: `/content/pages/${filename.value}.md`
    });

    // Reload manifest
    await store.loadManifest();

    // Close dialog and reset form
    emit('update:modelValue', false);
    resetForm();
  } catch (error) {
    console.error('Failed to create page:', error);
    store.error = error instanceof Error ? error.message : 'Failed to create page';
  } finally {
    creating.value = false;
  }
}

function resetForm() {
  title.value = '';
  filename.value = '';
}
</script>
