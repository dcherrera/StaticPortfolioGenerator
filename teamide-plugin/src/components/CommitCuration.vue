<template>
  <div class="commit-curation">
    <div v-if="!store.selectedProjectSlug" class="empty-state">
      Select a project from the Structure tab to view commits
    </div>

    <template v-else>
      <!-- Project header with refresh -->
      <div class="project-header">
        <span class="project-name">{{ store.selectedProjectSlug }}</span>
        <q-btn
          flat
          dense
          round
          icon="sync"
          size="sm"
          :loading="store.isLoading"
          @click="refreshCommits"
        >
          <q-tooltip>Refresh commits from GitHub</q-tooltip>
        </q-btn>
      </div>

      <div v-if="store.selectedProjectCommits.length === 0" class="empty-state">
        <template v-if="store.isLoading">Loading commits...</template>
        <template v-else>
          No commits cached. Click refresh to fetch from GitHub.
        </template>
      </div>

      <div v-else class="commits-list">
        <div
          v-for="commit in store.selectedProjectCommits"
          :key="commit.sha"
          class="commit-item"
          :class="{ hidden: commit.hidden }"
        >
          <q-checkbox
            :model-value="!commit.hidden"
            dense
            @update:model-value="toggleVisibility(commit)"
          >
            <q-tooltip>{{ commit.hidden ? 'Show on site' : 'Hide from site' }}</q-tooltip>
          </q-checkbox>
          <div class="commit-info">
            <div class="commit-message">
              {{ truncateMessage(commit.message) }}
            </div>
            <div class="commit-meta">
              <span class="commit-sha">{{ commit.sha.substring(0, 7) }}</span>
              <span class="commit-sep">&bull;</span>
              <span class="commit-date">{{ formatDate(commit.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useSPGStore } from '../store';
import { formatRelativeDate } from '../services/templates';
import type { Commit } from '../types';

const store = useSPGStore();

function refreshCommits() {
  if (store.selectedProjectSlug) {
    store.refreshCommits(store.selectedProjectSlug);
  }
}

function toggleVisibility(commit: Commit) {
  if (store.selectedProjectSlug) {
    store.toggleCommitVisibility(store.selectedProjectSlug, commit.sha, !commit.hidden);
  }
}

function truncateMessage(message: string): string {
  const firstLine = message.split('\n')[0];
  return firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
}

function formatDate(dateStr: string): string {
  return formatRelativeDate(dateStr);
}
</script>

<style scoped>
.commit-curation {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.project-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.project-name {
  font-weight: 600;
  font-size: 13px;
  color: #9c7cff;
}

.commits-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
}

.commit-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 4px;
  border-radius: 4px;
}

.commit-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.commit-item.hidden {
  opacity: 0.5;
}

.commit-info {
  flex: 1;
  min-width: 0;
}

.commit-message {
  font-size: 13px;
  line-height: 1.3;
  word-break: break-word;
}

.commit-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  opacity: 0.6;
  margin-top: 2px;
}

.commit-sha {
  font-family: monospace;
}

.commit-sep {
  opacity: 0.5;
}

.empty-state {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  opacity: 0.5;
  font-style: italic;
}
</style>
