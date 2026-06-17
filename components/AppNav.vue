<script setup lang="ts">
// Barre de navigation partagée par toutes les pages : marque compacte + vrai menu
// (Labo · Influence · Cheerios) + actions propres à la page (slot) + GitHub / Buy me a beer.
// Le lien actif est mis en valeur via .router-link-exact-active (chaque page = chemin distinct).
</script>

<template>
  <header class="nav">
    <NuxtLink to="/" class="brand" title="Accueil — Fantasticar Combo Lab">
      <FantasticarMark class="brand-mark" />
      <span class="brand-name">Fantasticar <span class="accent">Combo Lab</span></span>
    </NuxtLink>

    <nav class="menu" aria-label="Navigation principale">
      <NuxtLink to="/" class="menu-link">Labo</NuxtLink>
      <NuxtLink to="/influence" class="menu-link">Influence</NuxtLink>
      <NuxtLink to="/cheerios" class="menu-link">Cheerios</NuxtLink>
    </nav>

    <div class="actions">
      <slot />
      <GithubButton />
      <BuyMeCoffee />
    </div>
  </header>
</template>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}
.brand-mark {
  flex-shrink: 0;
}
.brand-name {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text);
  white-space: nowrap;
}
.brand-name .accent {
  color: var(--accent);
}
/* Le vrai menu : onglets discrets, soulignement doré sur la page courante. */
.menu {
  display: flex;
  align-items: center;
  gap: 2px;
}
.menu-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim);
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: color 0.12s, background 0.12s, border-color 0.12s;
}
.menu-link:hover {
  color: var(--text);
  background: var(--bg-3);
}
.menu-link.router-link-exact-active {
  color: var(--accent);
  background: rgba(224, 169, 63, 0.12);
  border-color: rgba(224, 169, 63, 0.35);
}
.actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}
@media (max-width: 560px) {
  .actions {
    margin-left: 0;
  }
}
</style>
