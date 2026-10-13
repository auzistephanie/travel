import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Connect, type Plugin } from 'vite'
import { dispatchApi } from './proxy/router.ts'

function serverEnv(mode: string, root: string): Record<string, string | undefined> {
  return { ...loadEnv(mode, root, ''), ...process.env }
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host ?? '127.0.0.1'
  const url = `http://${host}${req.url ?? '/'}`
  const method = req.method ?? 'GET'
  if (method === 'GET' || method === 'HEAD') return new Request(url, { method })

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const headers = new Headers()
  const contentType = req.headers['content-type']
  if (typeof contentType === 'string') headers.set('content-type', contentType)
  return new Request(url, {
    method,
    headers,
    body: new Uint8Array(Buffer.concat(chunks)),
  })
}

async function writeResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  const bytes = new Uint8Array(await response.arrayBuffer())
  res.end(Buffer.from(bytes))
}

function attach(middlewares: Connect.Server, env: Record<string, string | undefined>) {
  middlewares.use((req, res, next) => {
    const url = req.url ?? ''
    if (!url.startsWith('/api/')) {
      next()
      return
    }
    void (async () => {
      try {
        const response = await dispatchApi(await toWebRequest(req), env)
        await writeResponse(res, response)
      } catch {
        if (res.headersSent) return
        res.statusCode = 500
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: 'proxy_error' }))
      }
    })()
  })
}

/** npm run dev / vite preview 用。正式環境由 Vercel 嘅 api/*.ts 接手，key 同樣只讀 server env。 */
export function travelApiDevPlugin(): Plugin {
  return {
    name: 'travel-api-dev',
    configureServer(server) {
      attach(server.middlewares, serverEnv(server.config.mode, server.config.root))
    },
    configurePreviewServer(server) {
      attach(server.middlewares, serverEnv(server.config.mode, server.config.root))
    },
  }
}
