// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 100 % client, déployable en site statique (spec §6).
  ssr: false,
  devtools: { enabled: false },
  compatibilityDate: '2024-11-01',
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Fantasticar Combo Lab',
      htmlAttrs: { lang: 'fr' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Simulateur Monte Carlo du combo The Fantasticar (Duel Commander).' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap',
        },
      ],
    },
  },
})
