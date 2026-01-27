/**
 * Markdown Boot File
 *
 * Loads all content at app startup and populates the content store.
 */

import { boot } from 'quasar/wrappers'
import { useContentStore } from 'src/stores/content'
import { loadAllContent } from 'src/services/content'

export default boot(async ({ store }) => {
  console.log('Boot: markdown starting...')

  try {
    const contentStore = useContentStore(store)

    // Skip if already loaded
    if (contentStore.isLoaded) {
      console.log('Boot: Content already loaded')
      return
    }

    // Load all content from markdown files
    console.log('Boot: Loading content from markdown files...')
    const content = await loadAllContent()

    console.log('Boot: Loaded content:', {
      projects: content.projects.length,
      blogPosts: content.blogPosts.length,
      pages: content.pages.length
    })

    contentStore.setContent(content)

    // Set document title from site config
    console.log('Boot: siteConfig:', content.siteConfig)
    console.log('Boot: site.title:', content.siteConfig?.site?.title)
    if (content.siteConfig?.site?.title) {
      document.title = content.siteConfig.site.title
      console.log('Boot: Set document title to:', content.siteConfig.site.title)
    }

    console.log('Boot: Content store initialized')
  } catch (error) {
    console.error('Boot: Failed to initialize content store:', error)
  }
})
