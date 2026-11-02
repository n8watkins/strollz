import { createClient } from "@sanity/client"
import imageUrlBuilder from "@sanity/image-url"

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo-project",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

export const blogPostsQuery = `
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    author->{
      name,
      image
    },
    categories[]->{
      title
    }
  }
`

export const blogPostQuery = `
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    body,
    author->{
      name,
      image
    },
    categories[]->{
      title
    }
  }
`