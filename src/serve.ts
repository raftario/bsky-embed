import { createServer, type IncomingMessage, type Server } from "node:http"

import { type VNode } from "preact"
import { render } from "preact-render-to-string"

export type Handler = (request: IncomingMessage) => Promise<VNode>

export interface Options {
  host?: string
  port?: number
}

export function serve(options: Options, handler: Handler): Promise<Server> {
  const server = createServer((req, res) => {
    handler(req)
      .then((element) => {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" })
        res.end(render(element))
      })
      .catch((error) => {
        console.error(error)
        res.writeHead(500)
        res.end()
      })
  })

  return new Promise((res) =>
    server.listen(options.port, options.host, () => {
      res(server)
    }),
  )
}
