import { env } from "node:process"

import { BskyAgent } from "@atproto/api"
import { type ViewImage } from "@atproto/api/dist/client/types/app/bsky/embed/images"
import { type PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs"
import { match } from "path-to-regexp"

import { Root } from "./root"
import { serve } from "./serve"

const POST = match<{ profile: string; post: string }>("/profile/:profile/post/:post")
const PROFILE = match<{ profile: string }>("/profile/:profile")

const { IDENTIFIER, PASSWORD, PORT, HOST } = env
if (!IDENTIFIER || !PASSWORD) {
  throw new Error("PORT, IDENTIFIER and PASSWORD must be set")
}

async function main() {
  const agent = new BskyAgent({ service: "https://bsky.social" })
  await agent.login({ identifier: IDENTIFIER!, password: PASSWORD! })

  await serve(
    { port: Number.parseInt(PORT!), host: HOST ?? undefined },
    async (request) => {
      const u = new URL(request.url ?? "/", "https://bsky.app")
      const t = await tags(u, agent)

      return <Root url={u}>{t}</Root>
    },
  )
}

async function profileData(profile: string, agent: BskyAgent) {
  const p = await agent.getProfile({ actor: profile })
  if (!p.success) return

  const at = `@${p.data.handle}`
  const name = p.data.displayName ? `${p.data.displayName} (${at})` : at

  return { data: p.data, at, name }
}

async function tags(url: URL, agent: BskyAgent) {
  const postPath = POST(url.pathname)
  const profilePath = PROFILE(url.pathname)

  if (postPath) {
    const profile = await profileData(postPath.params.profile, agent)
    if (!profile) return

    const post = await agent.getPost({
      repo: profile.data.did,
      rkey: postPath.params.post,
    })
    const postThread = await agent.getPostThread({ uri: post.uri })
    if (!postThread.success) return

    const postView = postThread.data.thread.post as PostView
    const images = postView.embed?.images as ViewImage[] | undefined
    console.dir(images, { depth: null })

    return (
      <>
        <meta name="og:type" content="article" />

        <meta name="og:title" content={profile.name} />
        <meta name="twitter:title" content={profile.name} />
        <meta name="article:author" content={profile.name} />

        <meta name="twitter:creator" content={profile.at} />

        <meta name="og:description" content={post.value.text} />
        <meta name="twitter:description" content={post.value.text} />
        <meta name="description" content={post.value.text} />

        <meta name="article:published_time" content={post.value.createdAt} />
      </>
    )
  } else if (profilePath) {
    const profile = await profileData(profilePath.params.profile, agent)
    if (!profile) return

    return (
      <>
        <meta name="og:type" content="profile" />

        <meta name="og:title" content={profile.name} />
        <meta name="twitter:title" content={profile.name} />

        <meta name="twitter:creator" content={profile.at} />

        {profile.data.description && (
          <>
            <meta name="og:description" content={profile.data.description} />
            <meta name="twitter:description" content={profile.data.description} />
            <meta name="description" content={profile.data.description} />
          </>
        )}

        {profile.data.avatar && (
          <>
            <meta name="og:image" content={profile.data.avatar} />
            <meta name="twitter:image" content={profile.data.avatar} />
          </>
        )}
      </>
    )
  } else {
    return
  }
}

main().catch(console.error)
