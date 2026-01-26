<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Create New Project</div>
      </q-card-section>

      <q-card-section>
        <!-- GitHub Repo Dropdown -->
        <q-select
          v-model="selectedRepo"
          :options="repoOptions"
          label="GitHub Repository"
          hint="Select a repository from your GitHub account"
          outlined
          dense
          emit-value
          map-options
          class="q-mb-md"
          :loading="loadingRepos"
          @update:model-value="onRepoSelected"
        >
          <template v-slot:prepend>
            <q-icon name="code" />
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-icon :name="scope.opt.private ? 'lock' : 'public'" size="sm" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
                <q-item-label caption>{{ scope.opt.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Title -->
        <q-input
          v-model="title"
          label="Title"
          hint="Project display name"
          outlined
          dense
          class="q-mb-md"
          @update:model-value="onTitleChange"
        />

        <!-- Slug -->
        <q-input
          v-model="slug"
          label="Slug"
          hint="URL-friendly identifier"
          outlined
          dense
          class="q-mb-md"
        />

        <!-- Tagline -->
        <q-input
          v-model="tagline"
          label="Tagline"
          hint="Brief description"
          outlined
          dense
          class="q-mb-md"
        />

        <!-- Status -->
        <q-select
          v-model="status"
          :options="statusOptions"
          label="Status"
          outlined
          dense
          emit-value
          map-options
          class="q-mb-md"
        />

        <!-- Tech Stack -->
        <q-input
          v-model="techStack"
          label="Tech Stack"
          hint="Comma-separated list"
          outlined
          dense
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          label="Create Project"
          :loading="creating"
          @click="createProject"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSPGStore } from '../store';
import { slugify, generateProjectIndexMd, generateProjectConfigYaml } from '../services/templates';
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

const selectedRepo = ref<string | null>(null);
const title = ref('');
const slug = ref('');
const tagline = ref('');
const status = ref('concept');
const techStack = ref('');
const loadingRepos = ref(false);
const creating = ref(false);

const statusOptions = [
  { label: 'Concept', value: 'concept' },
  { label: 'Active', value: 'active' },
  { label: 'Maintained', value: 'maintained' },
  { label: 'Paused', value: 'paused' },
  { label: 'Archived', value: 'archived' }
];

const repoOptions = computed(() => {
  return store.userRepos.map(repo => ({
    label: repo.fullName,
    value: repo.fullName,
    private: repo.private,
    description: repo.description || 'No description'
  }));
});

function onRepoSelected(fullName: string | null) {
  if (!fullName) return;

  const repo = store.userRepos.find(r => r.fullName === fullName);
  if (repo) {
    title.value = repo.name;
    slug.value = slugify(repo.name);
    tagline.value = repo.description || '';
  }
}

function onTitleChange(value: string) {
  // Auto-generate slug if empty or matches previous auto-generation
  if (!slug.value || slug.value === slugify(title.value)) {
    slug.value = slugify(value);
  }
}

async function createProject() {
  if (!title.value || !slug.value || !store.settings.projectId) {
    return;
  }

  creating.value = true;

  try {
    const projectId = store.settings.projectId;
    const tech = techStack.value.split(',').map(t => t.trim()).filter(t => t);
    const repoUrl = selectedRepo.value || '';
    const isPrivate = store.userRepos.find(r => r.fullName === selectedRepo.value)?.private || false;

    // Create project directory
    const projectDir = `${CONTENT_PATH}/projects/${slug.value}`;
    await ensureDirectory(projectId, projectDir);

    // Create index.md
    const indexContent = generateProjectIndexMd(
      title.value,
      tagline.value || 'A new project',
      status.value as any,
      tech,
      repoUrl,
      isPrivate
    );
    await writeFile(projectId, `${projectDir}/index.md`, indexContent);

    // Create config.yaml
    const configContent = generateProjectConfigYaml(repoUrl);
    await writeFile(projectId, `${projectDir}/config.yaml`, configContent);

    // Create posts directory
    await ensureDirectory(projectId, `${projectDir}/posts`);

    // Update manifest
    await manifestService.addProject(projectId, {
      slug: slug.value,
      indexPath: `/content/projects/${slug.value}/index.md`,
      configPath: `/content/projects/${slug.value}/config.yaml`,
      posts: []
    });

    // Reload manifest
    await store.loadManifest();

    // Close dialog and reset form
    emit('update:modelValue', false);
    resetForm();
  } catch (error) {
    console.error('Failed to create project:', error);
    store.error = error instanceof Error ? error.message : 'Failed to create project';
  } finally {
    creating.value = false;
  }
}

function resetForm() {
  selectedRepo.value = null;
  title.value = '';
  slug.value = '';
  tagline.value = '';
  status.value = 'concept';
  techStack.value = '';
}

onMounted(async () => {
  if (store.hasGitHubToken && store.userRepos.length === 0) {
    loadingRepos.value = true;
    await store.fetchUserRepos();
    loadingRepos.value = false;
  }
});
</script>
