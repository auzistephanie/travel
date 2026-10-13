import { json, notConfigured, readKey, type ServerEnv } from './http.ts'

const MAX_BYTES = 4 * 1024 * 1024

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
])

function allowedFile(file: File): boolean {
  const type = file.type === 'image/jpg' ? 'image/jpeg' : file.type
  if (ALLOWED_TYPES.has(type)) return true
  return type === '' && /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file.name)
}

export async function handleTaggun(request: Request, env: ServerEnv): Promise<Response> {
  const key = readKey(env, 'TAGGUN_API_KEY')
  if (!key) return notConfigured()

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ error: 'bad_request' }, 400)
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES || !allowedFile(file)) {
    return json({ error: 'bad_request' }, 415)
  }

  const outgoing = new FormData()
  outgoing.append('file', file, file.name)

  try {
    const upstream = await fetch('https://api.taggun.io/api/receipt/v1/simple/file', {
      method: 'POST',
      headers: { apikey: key },
      body: outgoing,
    })
    if (!upstream.ok) return json({ error: 'upstream' }, 502)
    const text = await upstream.text()
    return new Response(text, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch {
    return json({ error: 'upstream' }, 502)
  }
}
