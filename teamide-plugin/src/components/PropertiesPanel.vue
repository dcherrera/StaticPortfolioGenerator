<template>
  <div class="properties-panel">
    <div class="properties-header" @click="expanded = !expanded">
      <q-icon :name="expanded ? 'expand_more' : 'chevron_right'" size="16px" />
      <span class="properties-title">Properties</span>
      <q-btn
        v-if="expanded"
        flat
        dense
        round
        icon="add"
        size="xs"
        class="add-btn"
        @click.stop="showAddDialog = true"
      />
    </div>

    <table v-if="expanded" class="properties-table">
      <tbody>
        <tr v-for="(value, key) in properties" :key="key" class="property-row">
          <td class="property-icon-cell">
            <q-icon :name="getIcon(String(key), value)" size="14px" color="grey-6" />
          </td>
          <td class="property-name-cell">{{ key }}</td>
          <td class="property-value-cell">
            <!-- Boolean -->
            <template v-if="typeof value === 'boolean'">
              <q-checkbox
                :model-value="value"
                dense
                size="sm"
                color="primary"
                @update:model-value="updateProperty(String(key), $event)"
              />
            </template>

            <!-- Number -->
            <template v-else-if="typeof value === 'number'">
              <input
                type="number"
                :value="value"
                class="value-input"
                @input="updateProperty(String(key), Number(($event.target as HTMLInputElement).value))"
              />
            </template>

            <!-- Status select -->
            <template v-else-if="String(key) === 'status'">
              <select
                :value="value"
                class="value-select"
                @change="updateProperty(String(key), ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </template>

            <!-- Object -->
            <template v-else-if="typeof value === 'object' && value !== null && !Array.isArray(value)">
              <span class="value-object">{{ formatObject(value) }}</span>
            </template>

            <!-- Array -->
            <template v-else-if="Array.isArray(value)">
              <span class="value-array">{{ (value as string[]).join(', ') }}</span>
            </template>

            <!-- String (default) -->
            <template v-else>
              <input
                type="text"
                :value="String(value ?? '')"
                class="value-input"
                @input="updateProperty(String(key), ($event.target as HTMLInputElement).value)"
              />
            </template>
          </td>
          <td class="property-action-cell">
            <button class="delete-btn" @click="removeProperty(String(key))">
              <q-icon name="close" size="12px" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="expanded && Object.keys(properties).length === 0" class="empty-state">
      No properties
    </div>

    <!-- Add Property Dialog -->
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Add Property</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newPropertyKey"
            label="Property name"
            dense
            outlined
            autofocus
            class="q-mb-md"
          />
          <q-select
            v-model="newPropertyType"
            label="Type"
            :options="typeOptions"
            dense
            outlined
            emit-value
            map-options
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Add"
            :disable="!newPropertyKey"
            @click="addProperty"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getPropertyIcon } from '../services/frontmatter';

const props = defineProps<{
  properties: Record<string, unknown>;
}>();

const emit = defineEmits<{
  update: [properties: Record<string, unknown>];
}>();

const expanded = ref(true);
const showAddDialog = ref(false);
const newPropertyKey = ref('');
const newPropertyType = ref('string');

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Maintained', value: 'maintained' },
  { label: 'Paused', value: 'paused' },
  { label: 'Archived', value: 'archived' },
  { label: 'Concept', value: 'concept' }
];

const typeOptions = [
  { label: 'Text', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Checkbox', value: 'boolean' },
  { label: 'Tags', value: 'array' }
];

function getIcon(key: string, value: unknown): string {
  return getPropertyIcon(key, value);
}

function formatObject(obj: unknown): string {
  if (typeof obj !== 'object' || obj === null) return String(obj);
  const entries = Object.entries(obj as Record<string, unknown>);
  return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
}

function updateProperty(key: string, value: unknown) {
  const updated = { ...props.properties, [key]: value };
  emit('update', updated);
}

function removeProperty(key: string) {
  const updated = { ...props.properties };
  delete updated[key];
  emit('update', updated);
}

function addProperty() {
  if (!newPropertyKey.value) return;

  let defaultValue: unknown;
  switch (newPropertyType.value) {
    case 'number': defaultValue = 0; break;
    case 'boolean': defaultValue = false; break;
    case 'array': defaultValue = []; break;
    default: defaultValue = '';
  }

  const updated = { ...props.properties, [newPropertyKey.value]: defaultValue };
  emit('update', updated);

  newPropertyKey.value = '';
  newPropertyType.value = 'string';
  showAddDialog.value = false;
}
</script>

<style scoped>
.properties-panel {
  background: rgba(40, 40, 40, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.properties-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.properties-header:hover {
  background: rgba(255, 255, 255, 0.03);
}

.properties-title {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  flex: 1;
}

.add-btn {
  opacity: 0;
  transition: opacity 0.15s;
}

.properties-header:hover .add-btn {
  opacity: 0.7;
}

.properties-table {
  width: 100%;
  border-collapse: collapse;
}

.property-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.property-row:last-child {
  border-bottom: none;
}

.property-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.property-row:hover .delete-btn {
  opacity: 0.5;
}

.property-icon-cell {
  width: 32px;
  padding: 8px 8px 8px 12px;
  vertical-align: middle;
}

.property-name-cell {
  width: 90px;
  padding: 8px 8px;
  font-size: 13px;
  color: #999;
  vertical-align: middle;
}

.property-value-cell {
  padding: 6px 8px;
  vertical-align: middle;
}

.property-action-cell {
  width: 28px;
  padding: 8px 8px 8px 0;
  vertical-align: middle;
}

.value-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  color: #ddd;
  padding: 4px 0;
}

.value-input:focus {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  padding: 4px 6px;
  margin: 0 -6px;
}

.value-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #ddd;
  font-size: 13px;
  padding: 4px 8px;
  outline: none;
  cursor: pointer;
}

.value-select:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.value-object {
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 12px;
  color: #e0a44a;
}

.value-array {
  font-size: 13px;
  color: #7ec8e3;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  padding: 4px;
  border-radius: 3px;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  opacity: 1 !important;
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.empty-state {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #666;
}
</style>
