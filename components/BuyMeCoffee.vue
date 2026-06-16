<script setup lang="ts">
// Lien « Buy me a beer » (Buy Me a Coffee, slug mcouzinet) — restylé pour coller au design de l'app
// (ton ambré, police de l'app) plutôt que le bouton bleu officiel qui détonnerait.
</script>

<template>
  <a
    class="bmc"
    href="https://www.buymeacoffee.com/mcouzinet"
    target="_blank"
    rel="noopener noreferrer"
    title="Soutenir le projet — Buy me a beer"
  >
    <span class="emoji" aria-hidden="true">🍺</span>
    <span>Buy me a beer</span>
  </a>
</template>

<style scoped>
/* Aligné sur les boutons « ghost » de la barre, teinte ambrée discrète au survol. */
.bmc {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--border);
  text-decoration: none;
  padding: 4px 11px;
  border-radius: 8px;
  transition: background 0.12s, border-color 0.12s;
  white-space: nowrap;
}
.bmc:hover {
  background: rgba(224, 169, 63, 0.12);
  border-color: var(--accent);
}
.bmc .emoji {
  font-size: 14px;
}
</style>
