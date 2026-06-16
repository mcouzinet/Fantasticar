<script setup lang="ts">
// Bouton GitHub officiel (widget buttons.github.io, servi en iframe par ghbtns.com).
// Embarqué en iframe directement → fiable en SPA (pas de script à ré-exécuter au montage).
</script>

<template>
  <iframe
    class="gh-btn"
    src="https://ghbtns.com/github-btn.html?user=mcouzinet&repo=Fantasticar&type=star&count=true"
    title="Star mcouzinet/Fantasticar sur GitHub"
    frameborder="0"
    scrolling="0"
    width="100"
    height="20"
  />
</template>

<style scoped>
.gh-btn {
  display: block;
  border: 0;
  /* l'iframe a son propre fond clair ; on le laisse tel quel (rendu officiel GitHub) */
}
</style>
