import type { MiddlewareHandler } from '../deps.ts'
import { Context } from '../deps.ts'
import JwtHelper from '../helpers/jwt.helper.ts'
import type { Payload } from '../deps.ts'
import PeopleService from '../services/people.service.ts'
import { rolesType } from '../db/schema/zod.ts'

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

const auth = (requiredRights: string[]): MiddlewareHandler => {
	return async (c: Context, next) => {
		if (!c.req.raw.headers.has('Authorization')) {
			return c.json({ message: 'Unauthorized' }, 401)
		}
		const authHeader = c.req.header('Authorization')

		if ((!authHeader) || !authHeader.startsWith('Bearer')) {
			return c.json({ message: 'Access Denied. No token provided.' }, 401)
		}

		const token = authHeader.split('Bearer ')[1]
		const payload: Payload | string = await JwtHelper.getJwtPayload(token)
		if (typeof payload === 'string') {
			return c.json(
				{
					status: 'failure',
					message: 'Unauthorized',
				},
				401,
			)
		}
		const userId = payload.id as number

		if (requiredRights.length > 0) {
			const roles = await PeopleService.getAdminUserRolesById(
				userId,
			) as rolesType[]
			const hasRights = checkRoles(roles, requiredRights)
			if (!hasRights) {
				return c.json({ message: 'Unauthorized' }, 401)
			}
		}
		return next()
	}
}

export default auth
