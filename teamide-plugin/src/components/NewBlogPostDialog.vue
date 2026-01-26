<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Create New Blog Post</div>
      </q-card-section>

      <q-card-section>
        <!-- Title -->
        <q-input
          v-model="title"
          label="Title"
          hint="Blog post title"
          outlined
          dense
          class="q-mb-md"
        />

        <!-- Date -->
        <q-input
          v-model="date"
          label="Date"
          hint="Publication date (YYYY-MM-DD)"
          outlined
          dense
          class="q-mb-md"
        >
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="date" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <!-- Tags -->
        <q-input
          v-model="tags"
          label="Tags"
          hint="Comma-separated list"
          outlined
          dense
          class="q-mb-md"
        />

        <!-- Related Project -->
        <q-select
          v-model="project"
          :options="projectOptions"
          label="Related Project"
          hint="Optional: Link to a project"
          outlined
          dense
          emit-value
          map-options
          clearable
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          label="Create Blog Post"
          :loading="creating"
          @click="createBlogPost"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSPGStore } from '../store';
import { slugify, formatDate, generateBlogPostMd } from '../services/templates';
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
const date = ref(formatDate(new Date()));
const tags = ref('');
const project = ref<string | null>(null);
const creating = ref(false);

const projectOptions = computed(() => {
  return [
    { label: 'None', value: null },
    ...store.projects.map(p => ({
      label: p.slug,
      value: p.slug
    }))
  ];
});

async function createBlogPost() {
  if (!title.value || !store.settings.projectId) {
    return;
  }

  creating.value = true;

  try {
    const projectId = store.settings.projectId;
    const tagList = tags.value.split(',').map(t => t.trim()).filter(t => t);

    // Generate filename
    const slug = slugify(title.value);
    const filename = `${date.value}-${slug}.md`;
    const filePath = `${CONTENT_PATH}/blog/${filename}`;

    // Ensure blog directory exists
    await ensureDirectory(projectId, `${CONTENT_PATH}/blog`);

    // Create blog post file
    const content = generateBlogPostMd(
      title.value,
      date.value,
      tagList,
      project.value || undefined
    );
    await writeFile(projectId, filePath, content);

    // Update manifest
    await manifestService.addBlogPost(projectId, {
      path: `/content/blog/${filename}`
    });

    // Reload manifest
    await store.loadManifest();

    // Close dialog and reset form
    emit('update:modelValue', false);
    resetForm();
  } catch (error) {
    console.error('Failed to create blog post:', error);
    store.error = error instanceof Error ? error.message : 'Failed to create blog post';
  } finally {
    creating.value = false;
  }
}

function resetForm() {
  title.value = '';
  date.value = formatDate(new Date());
  tags.value = '';
  project.value = null;
}
</script>
