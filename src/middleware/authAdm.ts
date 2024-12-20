import type { Context, MiddlewareHandler, Next } from '@hono/hono'
import { HTTPException } from '@hono/hono/http-exception'
import JwtHelper from '../helpers/jwt.helper.ts'
import PeopleService from '../services/people.service.ts'
import type { rolesType } from '../schema/zod.ts'

const checkRoles = (
	memberRoles: rolesType[],
	requiredRights: string[],
): boolean | Error => {
	let hasRequiredRights = true
	requiredRights.forEach((el) => {
		const result = memberRoles.find(({ roleName }) => roleName === el)
		if (!result) {
			hasRequiredRights = false
			return hasRequiredRights
		}
	})

	return hasRequiredRights
}

const authAdm = (requiredRights: string[]): MiddlewareHandler => {
	return async (c: Context, next: Next) => {
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
		let userId = 0
		const token = authHeader.split('Bearer ')[1]
		const payload = await JwtHelper.getJwtPayload(token)

		if (typeof payload === 'string') {
			const res = new Response('Unauthorized.', {
				status: 401,
			})
			throw new HTTPException(401, { res })
		} else {
			//good payload
			userId = payload.id as number
		}

		if (requiredRights.length > 0) {
			const roles = await PeopleService.getAdminUserRolesById(
				userId,
			) as rolesType[]
			const hasRights = checkRoles(roles, requiredRights)
			if (!hasRights) {
				return c.json({ message: 'Unauthorized' }, 401)
			}
		}
		await next()
	}
}

export default authAdm
