<script setup lang="ts">
// Lien stylé façon « Buy Me a Coffee » (le script officiel s'injecte mal en SPA).
// Slug + apparence repris de la configuration BMC fournie (mcouzinet, 🍺 « Buy me a beer »).
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
    <span class="txt">Buy me a beer</span>
  </a>
</template>

<style scoped>
.bmc {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #5f7fff;
  color: #fff;
  text-decoration: none;
  padding: 3px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.4);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  transition: filter 0.12s, transform 0.12s;
  white-space: nowrap;
}
.bmc:hover {
  filter: brightness(1.07);
  transform: translateY(-1px);
}
.bmc .emoji {
  font-size: 15px;
}
.bmc .txt {
  font-family: 'Cookie', cursive;
  font-size: 19px;
  line-height: 1.1;
}
</style>
