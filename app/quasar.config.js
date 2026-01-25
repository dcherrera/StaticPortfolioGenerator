/* eslint-env node */
const { configure } = require('quasar/wrappers')

module.exports = configure(function (ctx) {
  return {
    boot: ['markdown'],

    css: ['app.scss'],

    extras: ['roboto-font', 'material-icons'],

    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20'
      },
      vueRouterMode: 'history',
      extendViteConf(viteConf) {
        // Treat .md and .yaml files as static assets for raw imports
        viteConf.assetsInclude = viteConf.assetsInclude || []
        if (Array.isArray(viteConf.assetsInclude)) {
          viteConf.assetsInclude.push('**/*.md', '**/*.yaml')
        }
      }
    },

    devServer: {
      open: true
    },

    framework: {
      config: {
        dark: true
      },
      plugins: ['Notify', 'Loading']
    },

    // Pinia store - src/stores/index.ts
    store: true,

    ssg: {
      concurrency: 10,
      interval: 0,
      routes: [],
      includeStaticRoutes: true,
      distDir: 'dist/ssg',
      fallback: '404.html',
      crawler: true,
      inlineCriticalCss: true,

      onPageGenerated({ html, route }) {
        console.log(`Generated: ${route}`)
        return html
      }
    }
  }
})
