export type ServerEnv = Record<string, string | undefined>

export function readKey(env: ServerEnv, name: string): string | null {
  const value = env[name]?.trim()
  if (!value || value.length > 256 || value.includes('\n') || value.includes('\r') || value.includes('\0')) return null
  return value
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

export function notConfigured(): Response {
  return json({ error: 'not_configured' }, 503)
}

export async function upstreamJson(response: Response): Promise<Response> {
  if (!response.ok) return json({ error: 'upstream' }, 502)
  const text = await response.text()
  return new Response(text, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}
