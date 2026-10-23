const SITE_URL = 'https://www.ravennah.com'
const DEFAULT_IMAGE = `${SITE_URL}/ravennah-social.jpg`

/** Title, description, canonical link and social preview tags of a public page. */
export function usePageSeo(page: { title: string; description: string; path: string; image?: string }) {
  const url = `${SITE_URL}${page.path}`
  const image = page.image ?? DEFAULT_IMAGE

  useHead({ title: page.title, link: [{ rel: 'canonical', href: url }] })
  useSeoMeta({
    description: page.description,
    ogTitle: page.title,
    ogUrl: url,
    ogDescription: page.description,
    ogImage: image,
    twitterTitle: page.title,
    twitterDescription: page.description,
    twitterImage: image,
  })
}
