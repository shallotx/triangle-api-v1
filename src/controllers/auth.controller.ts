import { Context, deleteCookie, getCookie, setCookie } from '../deps.ts'
import { drizzle } from '../deps.ts'
import { and, eq, sql } from '../deps.ts'
import { members } from '../db/schema/members.ts'
import { AdminUser, adminUsers } from '../db/schema/adminUsers.ts'
import HashHelper from '../helpers/hash.helper.ts'
import CryptoHelper from '../helpers/crypto.helper.ts'
import JwtHelper from '../helpers/jwt.helper.ts'
import config from '../config/default.ts'
import pgSql from '../db/db.ts'
import {
	adminUserWithRoles,
	loginSchema,
	passwordSchema,
	rolesType,
} from '../db/schema/zod.ts'
import PeopleService from '../services/people.service.ts'

const doMemberLogin = async (c: Context) => {
	const res = loginSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	try {
		const db = drizzle(pgSql)
		const result = await db.select().from(members).where(
			eq(members.email, res.data.email),
		)
		if (!result[0]) {
			c.status(404)
			return c.json({
				status: 'failure',
				message: `This Email address ${res.data.email} does not exit`,
			})
		}

		const member = result[0]
		if (member.salt && member.salt.length > 1) {
			if (
				!await CryptoHelper.verify(
					res.data.password,
					member.salt,
					member.password,
				)
			) {
				c.status(400)
				return c.json({
					status: 'failure',
					message: 'This password is incorrect',
				})
			}
		} else {
			if (!await HashHelper.compare(res.data.password, member.password)) {
				c.status(400)
				return c.json({
					status: 'failure',
					message: 'This password is incorrect',
				})
			}
		}

		member.password = ''
		member.salt = ''
		const token = await generateAuthToken(member.id, 'access')
		c.status(200)
		return c.json({
			data: { member: member, token: token },
			status: 'success',
			results: 1,
		})
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

const changeMemberPassword = async (c: Context) => {
	const res = passwordSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const member = await PeopleService.getMemberByEmail(res.data.email, true)
	if (typeof member === 'string') {
		return c.json(
			{
				member,
			},
			500,
		)
	}
	if (member.salt && member.salt.length > 1) {
		if (
			!await CryptoHelper.verify(
				res.data.oldPassword,
				member.salt,
				member.password,
			)
		) {
			c.status(400)
			return c.json({
				status: 'failure',
				message: 'This password is incorrect',
			})
		}
	} else {
		if (!await HashHelper.compare(res.data.oldPassword, member.password)) {
			c.status(400)
			return c.json({
				status: 'failure',
				message: 'This password is incorrect',
			})
		}
	}
	try {
		await updateMemberForCryptoHash(member.id, res.data.newPassword)
		c.status(200)
		return c.json({ status: 'success', results: 1 })
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

const updateMemberForCryptoHash = async (id: number, password: string) => {
	// hash password
	const hres = await CryptoHelper.hash(password)
	if (!hres) {
		return false
	}
	try {
		const db = drizzle(pgSql)
		await db.update(members)
			.set({ password: hres.hash, salt: hres.salt })
			.where(eq(members.id, id))
		return true
	} catch (error) {
		return false
	}
}
const doAdminUserLogin = async (c: Context) => {
	const res = loginSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	try {
		const db = drizzle(pgSql)
		const existingUser = await PeopleService.getAdminUserByEmail(
			res.data.email,
			true,
		)
		if (typeof existingUser === 'string') {
			return c.json(
				{
					existingUser,
				},
				500,
			)
		}
		// const result = await db.select().from(adminUsers)
		// 	.where(
		// 		and(
		// 			eq(adminUsers.email, res.data.email),
		// 			eq(adminUsers.is_active, true),
		// 		),
		// 	)
		if (!existingUser) {
			c.status(404)
			return c.json({
				status: 'failure',
				message: `This Email address ${res.data.email} does not exit or 
                          User is not activated`,
			})
		}

		const adminUser = existingUser
		if (
			!await CryptoHelper.verify(
				res.data.password,
				adminUser.salt,
				adminUser.password,
			)
		) {
			c.status(400)
			return c.json({
				status: 'failure',
				message: 'This password is incorrect',
			})
		}
		const accesstoken = await generateAuthToken(adminUser.id, 'access')
		const refreshtoken = await generateAuthToken(adminUser.id, 'refresh')
		const {
			password,
			salt,
			created_at,
			updated_at,
			is_active,
			...returnUser
		} = adminUser //omit unwanted props

		const roles = await PeopleService.getAdminUserRolesById(
			returnUser.id,
		) as rolesType[]
		const userWithRoles: adminUserWithRoles = Object.assign(returnUser)
		if (roles) {
			userWithRoles.roles = roles
		}

		c.status(200)
		setTokenCookie(c, refreshtoken)
		return c.json({
			data: { adminUser: returnUser, token: accesstoken },
			status: 'success',
			results: 1,
		})
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

const doAdminUserLogout = (c: Context) => {
	deleteTokenCookie(c)
	c.status(200)
	return c.json({ status: 'success', results: 1 })
}

const generateAuthToken = async (memberId: number, tokenType: string) => {
	const nowTs = Math.round(Date.now() / 1000) //in secs
	let accessTokenExpires = 0
	if (tokenType === 'access') {
		accessTokenExpires = nowTs + (config.jwtAccessExpiration * 1) // 3600 secs  or 1 hr

		// for testing, make this 2 minutes
		//  accessTokenExpires = (nowTs + (120 * 1));
	} else {
		//refresh token
		accessTokenExpires = nowTs + (config.jwtRefeshExpiration * 1) // 86400 secs or 1 days
	}
	return await JwtHelper.getToken(accessTokenExpires, memberId)
}
const setTokenCookie = (c: Context, refreshToken: string) => {
	const nowTs = Math.round(Date.now() / 1000) //in secs
	setCookie(c, 'refreshToken', refreshToken, {
		httpOnly: true,
		// domain: 'atlantatriangleclub.org',
		path: '/',
		expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in millisecs
		secure: true,
		sameSite: 'None',
	})
}

const deleteTokenCookie = (c: Context) => {
	deleteCookie(c, 'refreshToken')
}

const doRefresh = async (c: Context) => {
	const refreshToken = getCookie(c, 'refreshToken')
	if (!refreshToken) {
		c.status(401)
		return c.json({
			status: 'failure',
			message: 'Access Denied. No refresh token provided.',
		})
	}
	const decoded = await JwtHelper.getJwtPayload(refreshToken)
	if (typeof decoded === 'string') {
		return c.json(
			{
				status: 'failure',
				message: 'Access Denied. Please login again',
			},
			401,
		)
	}
	try {
		const db = drizzle(pgSql)
		const accesstoken = await generateAuthToken(
			decoded.id as number,
			'access',
		)

		const result = await db.select().from(adminUsers)
			.where(eq(adminUsers.id, decoded.id as number))
		if (!result[0]) {
			c.status(404)
			return c.json({
				status: 'failure',
				message: `This Admin User does not exit`,
			})
		}
		const adminUser = result[0]
		const {
			password,
			salt,
			created_at,
			updated_at,
			is_active,
			...returnUser
		} = adminUser //omit unwanted props

		const roles = await PeopleService.getAdminUserRolesById(
			returnUser.id,
		) as rolesType[]
		const userWithRoles: adminUserWithRoles = Object.assign(returnUser)
		if (roles) {
			userWithRoles.roles = roles
		}
		c.status(200)
		return c.json({
			data: { adminUser: returnUser, token: accesstoken },
			status: 'success',
			results: 1,
		})
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

export default {
	doMemberLogin,
	doAdminUserLogin,
	changeMemberPassword,
	doRefresh,
	doAdminUserLogout,
}
