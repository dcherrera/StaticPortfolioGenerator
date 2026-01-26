<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Confirm Delete</div>
      </q-card-section>

      <q-card-section>
        <p>
          Are you sure you want to delete this {{ itemType }}?
        </p>
        <p class="text-weight-bold">{{ itemName }}</p>
        <p class="text-negative text-caption">
          This action cannot be undone. All associated files will be removed.
        </p>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          color="negative"
          label="Delete"
          @click="confirmDelete"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  itemName: string;
  itemType: 'project' | 'blog' | 'page';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'confirm': [];
}>();

function confirmDelete() {
  emit('confirm');
  emit('update:modelValue', false);
}
</script>
