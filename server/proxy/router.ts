import { handleFlights } from './flights.ts'
import { json, type ServerEnv } from './http.ts'
import { handleTaggun } from './taggun.ts'
import { handleTomTomRoute } from './tomtomRoute.ts'
import { handleTomTomSearch } from './tomtomSearch.ts'

const ROUTES = new Set(['/api/flights', '/api/tomtom-search', '/api/tomtom-route', '/api/taggun'])

export async function dispatchApi(request: Request, env: ServerEnv): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/$/, '') || '/'

  if (path === '/api/flights' && request.method === 'GET') return handleFlights(url, env)
  if (path === '/api/tomtom-search' && request.method === 'GET') return handleTomTomSearch(url, env)
  if (path === '/api/tomtom-route' && request.method === 'GET') return handleTomTomRoute(url, env)
  if (path === '/api/taggun' && request.method === 'POST') return handleTaggun(request, env)

  if (ROUTES.has(path)) return json({ error: 'method_not_allowed' }, 405)
  return json({ error: 'not_found' }, 404)
}
