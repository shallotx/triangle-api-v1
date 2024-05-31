import type { Context, MiddlewareHandler } from '@hono/hono'
import { HTTPException } from '@hono/hono/http-exception'
import JwtHelper from '../helpers/jwt.helper.ts'

const authWs = (): MiddlewareHandler => {
	return async (c: Context, next) => {
		if (!c.req.raw.headers.has('Authorization')) {
			const res = new Response('Unauthorized', {
				status: 401,
				headers: {
					'WWW-Authenticate': `PREFIX error="invalid_token"`,
				},
			})
			throw new HTTPException(401, { res })
		}
		const authHeader = c.req.header('Authorization')

		if (!authHeader || !authHeader.startsWith('Bearer')) {
			const res = new Response('Unauthorized.', {
				status: 401,
			})
			throw new HTTPException(401, { res })
		}

		const token = authHeader.split('Bearer ')[1]
		const payload = await JwtHelper.getJwtPayload(token)
		if (typeof payload === 'string') {
			const res = new Response('Unauthorized.', {
				status: 401,
			})
			throw new HTTPException(401, { res })
		}
		await next()
	}
}

export default authWs
