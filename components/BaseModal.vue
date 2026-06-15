<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="emit('close')">
      <div class="modal card" role="dialog" aria-modal="true">
        <button class="x" aria-label="Fermer" @click="emit('close')">×</button>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 7, 10, 0.66);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}
.modal {
  position: relative;
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  padding: 26px;
}
.x {
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  background: transparent;
  color: var(--text-faint);
  font-size: 22px;
  line-height: 1;
  padding: 2px 8px;
}
.x:hover {
  color: var(--text);
  background: transparent;
}
</style>
