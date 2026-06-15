<script setup lang="ts">
// Emblème ORIGINAL (voiture volante générique) — aucune référence visuelle à une œuvre
// protégée. Évoque simplement le thème "véhicule" du deck.
</script>

<template>
  <svg class="mark" viewBox="0 0 64 40" aria-hidden="true">
    <!-- lignes de vitesse -->
    <g class="speed" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
      <line x1="2" y1="15" x2="9" y2="15" opacity="0.55" />
      <line x1="0" y1="22" x2="6" y2="22" opacity="0.4" />
      <line x1="3" y1="29" x2="8" y2="29" opacity="0.25" />
    </g>
    <g class="craft">
      <!-- aileron arrière -->
      <path d="M48 19 L58 11 L58 19 Z" fill="currentColor" />
      <!-- carrosserie -->
      <rect x="9" y="18" width="46" height="12" rx="6" fill="currentColor" />
      <!-- cabine -->
      <path d="M22 19 Q26 8 33 8 Q40 8 45 19 Z" fill="currentColor" />
      <!-- séparation de pare-brise -->
      <line x1="33.5" y1="9" x2="33.5" y2="19" stroke="var(--bg)" stroke-width="2" />
      <!-- propulseurs / roues -->
      <circle cx="21" cy="30" r="5" fill="currentColor" />
      <circle cx="21" cy="30" r="2.1" fill="var(--bg)" />
      <circle cx="44" cy="30" r="5" fill="currentColor" />
      <circle cx="44" cy="30" r="2.1" fill="var(--bg)" />
    </g>
  </svg>
</template>

<style scoped>
.mark {
  width: 42px;
  height: 26px;
  color: var(--accent);
  display: block;
  animation: hover 3.4s ease-in-out infinite;
  filter: drop-shadow(0 3px 5px rgba(217, 164, 65, 0.25));
}
.speed {
  animation: dash 1.4s ease-in-out infinite;
}
@keyframes hover {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2.5px);
  }
}
@keyframes dash {
  0%,
  100% {
    opacity: 0.8;
    transform: translateX(0);
  }
  50% {
    opacity: 0.35;
    transform: translateX(-2px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .mark,
  .speed {
    animation: none;
  }
}
</style>
