import { dispatchApi } from '../server/proxy/router.ts'

export function GET(request: Request): Promise<Response> {
  return dispatchApi(request, process.env)
}
