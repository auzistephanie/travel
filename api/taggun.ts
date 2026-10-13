import { dispatchApi } from '../server/proxy/router.ts'

export function POST(request: Request): Promise<Response> {
  return dispatchApi(request, process.env)
}
