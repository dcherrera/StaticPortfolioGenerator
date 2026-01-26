<template>
  <div class="site-structure">
    <!-- Projects Section -->
    <div class="section">
      <div class="section-header" @click="projectsExpanded = !projectsExpanded">
        <q-icon :name="projectsExpanded ? 'expand_more' : 'chevron_right'" size="20px" />
        <span class="section-title">Projects</span>
        <span class="section-count">({{ store.projects.length }})</span>
        <q-btn
          flat
          dense
          round
          icon="add"
          size="sm"
          class="add-btn"
          @click.stop="$emit('newProject')"
        />
      </div>

      <div v-if="projectsExpanded" class="section-items">
        <div
          v-for="project in store.projects"
          :key="project.slug"
          class="item"
          :class="{ selected: store.selectedProjectSlug === project.slug }"
          @click="selectProject(project)"
        >
          <span class="status-dot" :class="'status-' + getProjectStatus(project)" />
          <span class="item-name">{{ project.slug }}</span>
          <div class="item-actions">
            <q-btn
              flat
              dense
              round
              icon="sync"
              size="xs"
              title="Pull README"
              @click.stop="store.pullReadme(project.slug)"
            />
            <q-btn
              flat
              dense
              round
              icon="delete"
              size="xs"
              title="Delete"
              @click.stop="$emit('deleteProject', project)"
            />
          </div>
        </div>
        <div v-if="store.projects.length === 0" class="empty-state">
          No projects yet
        </div>
      </div>
    </div>

    <!-- Blog Posts Section -->
    <div class="section">
      <div class="section-header" @click="blogExpanded = !blogExpanded">
        <q-icon :name="blogExpanded ? 'expand_more' : 'chevron_right'" size="20px" />
        <span class="section-title">Blog Posts</span>
        <span class="section-count">({{ store.blogPosts.length }})</span>
        <q-btn
          flat
          dense
          round
          icon="add"
          size="sm"
          class="add-btn"
          @click.stop="$emit('newBlogPost')"
        />
      </div>

      <div v-if="blogExpanded" class="section-items">
        <div
          v-for="post in store.blogPosts"
          :key="post.path"
          class="item"
          @click="openFile(post.path)"
        >
          <q-icon name="article" size="16px" class="item-icon" />
          <span class="item-name">{{ getFileName(post.path) }}</span>
          <span class="item-meta">{{ getDate(post.path) }}</span>
          <q-btn
            flat
            dense
            round
            icon="delete"
            size="xs"
            class="delete-btn"
            @click.stop="$emit('deleteBlogPost', post)"
          />
        </div>
        <div v-if="store.blogPosts.length === 0" class="empty-state">
          No blog posts yet
        </div>
      </div>
    </div>

    <!-- Pages Section -->
    <div class="section">
      <div class="section-header" @click="pagesExpanded = !pagesExpanded">
        <q-icon :name="pagesExpanded ? 'expand_more' : 'chevron_right'" size="20px" />
        <span class="section-title">Pages</span>
        <span class="section-count">({{ store.pages.length }})</span>
        <q-btn
          flat
          dense
          round
          icon="add"
          size="sm"
          class="add-btn"
          @click.stop="$emit('newPage')"
        />
      </div>

      <div v-if="pagesExpanded" class="section-items">
        <div
          v-for="page in store.pages"
          :key="page.path"
          class="item"
          @click="openFile(page.path)"
        >
          <q-icon name="description" size="16px" class="item-icon" />
          <span class="item-name">{{ getFileName(page.path) }}</span>
          <q-btn
            flat
            dense
            round
            icon="delete"
            size="xs"
            class="delete-btn"
            @click.stop="$emit('deletePage', page)"
          />
        </div>
        <div v-if="store.pages.length === 0" class="empty-state">
          No pages yet
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSPGStore } from '../store';
import type { ProjectEntry } from '../types';

const store = useSPGStore();

const projectsExpanded = ref(true);
const blogExpanded = ref(true);
const pagesExpanded = ref(true);

const emit = defineEmits<{
  newProject: [];
  newBlogPost: [];
  newPage: [];
  deleteProject: [project: ProjectEntry];
  deleteBlogPost: [post: { path: string }];
  deletePage: [page: { path: string }];
  openFile: [path: string];
}>();

function selectProject(project: ProjectEntry) {
  store.selectProject(project.slug);
  emit('openFile', project.indexPath);
}

function openFile(path: string) {
  emit('openFile', path);
}

function getProjectStatus(project: ProjectEntry): string {
  // Could parse frontmatter for status, but for now return 'active'
  return 'active';
}

function getFileName(path: string): string {
  return path.split('/').pop()?.replace('.md', '') || path;
}

function getDate(path: string): string {
  // Extract date from filename like "2024-01-15-post-title.md"
  const match = path.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}
</script>

<style scoped>
.site-structure {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section {
  border-radius: 4px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
}

.section-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.section-title {
  font-weight: 600;
  font-size: 13px;
}

.section-count {
  color: var(--q-secondary);
  font-size: 12px;
  opacity: 0.7;
}

.add-btn {
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.15s;
}

.section-header:hover .add-btn {
  opacity: 1;
}

.section-items {
  padding-left: 8px;
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.item.selected {
  background: rgba(var(--q-primary-rgb), 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-active { background: #4caf50; }
.status-maintained { background: #2196f3; }
.status-paused { background: #ff9800; }
.status-archived { background: #9e9e9e; }
.status-concept { background: #9c27b0; }

.item-icon {
  opacity: 0.6;
}

.item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  font-size: 11px;
  opacity: 0.5;
}

.item-actions {
  display: flex;
  opacity: 0;
  transition: opacity 0.15s;
}

.item:hover .item-actions,
.item:hover .delete-btn {
  opacity: 1;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.15s;
}

.empty-state {
  padding: 8px 16px;
  font-size: 12px;
  opacity: 0.5;
  font-style: italic;
}
</style>
