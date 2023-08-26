import { type VNode } from "preact"

export interface Params {
  url: URL
  children?: VNode
}
export function Root({ url, children }: Params) {
  const u = url.toString()

  return (
    <html lang="en">
      <head>
        <meta content="text/html; charset=utf-8" http-equiv="content-type" />
        <meta http-equiv="refresh" content={`0; url = ${u}`} />

        <meta content="#0085FF" name="theme-color" />
        <meta name="og:url" content={u} />
        <meta name="og:site_name" content="bsky.app" />
        <meta name="twitter:card" content="summary_large_image" />

        {children}
      </head>
      <body>
        <a href={u}>{u}</a>
      </body>
    </html>
  )
}
