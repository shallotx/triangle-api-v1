// deno-lint-ignore-file no-unused-vars
import type { Context } from '@hono/hono'
import { createFactory } from '@hono/hono/factory'
import { getCookie /* , setCookie  */ } from '@hono/hono/cookie'
import { neon } from '@neon/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { and, eq } from 'drizzle-orm'
import config from '../config/default.ts'
import { members, type PasswordToken, passwordToken } from '../schema/member.ts'
import { admin_users } from '../schema/admin_user.ts'
import JwtHelper from '../helpers/jwt.helper.ts'
import CryptoHelper from '../helpers/crypto.helper.ts'
import cryptoRandomString from 'crypto-random-string'
import {
	type adminUserWithRoles,
	type emailSend,
	type emailType,
	loginSchema,
	passwordSchema,
	type rolesType,
} from '../schema/zod.ts'
import PeopleService from '../services/people.service.ts'
import EmailService from '../services/email.service.ts'
import HashHelper from '../helpers/hash.helper.ts'
import UtilsHelper from '../helpers/utils.helper.ts'
import type { Header, Payload } from '@zaubrik/djwt'

const factory = createFactory()

/**
 ** Triangle Website
 */

const doMemberLogin = factory.createHandlers(async (c: Context) => {
	const res = loginSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	try {
		const existingMember = await PeopleService.getMemberByEmail(
			res.data.email,
			true,
		)

		if (typeof existingMember != 'object') {
			c.status(404)
			return c.json({
				status: 'failure',
				message: `This Email address ${res.data.email} does not exist`,
			})
		}

		const member = existingMember
		// using new password hash process, so verify with crypto and not bcrypt
		if (member.salt && member.salt.length > 1) {
			const veri = await CryptoHelper.verify(
				res.data.password,
				member.salt,
				member.password,
			)
			if (!veri) {
				c.status(400)
				return c.json({
					status: 'failure',
					message: 'This password is incorrect',
				})
			}
		} else {
			// verify with bcrypt and then update to new process
			if (!await HashHelper.compare(res.data.password, member.password)) {
				c.status(400)
				return c.json({
					status: 'failure',
					message: 'This password is incorrect',
				})
			}
			await updateMemberForCryptoHash(member.id, res.data.password)
		}

		const {
			password,
			salt,
			phone,
			created_at,
			updated_at,
			...returnMember
		} = member //omit unwanted props

		const nowTs = Math.round(Date.now() / 1000) //in secs
		const accessTokenExpires = nowTs + (config.jwtAccessExpiration * 1) // 3600 secs or 1 hr
		const token = await JwtHelper.createToken(accessTokenExpires, member.id)
		c.status(200)
		return c.json({
			data: { member: returnMember, token: token },
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
})

const changeMemberPassword = factory.createHandlers(async (c: Context) => {
	const res = passwordSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	const member = await PeopleService.getMemberByEmail(res.data.email, true)
	if (typeof member != 'object') {
		return c.json(
			{
				member,
			},
			500,
		)
	}

	if (member.salt && member.salt.length > 1) {
		const veri = await CryptoHelper.verify(
			res.data.oldPassword,
			member.salt,
			member.password,
		)

		if (!veri) {
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
})

const newMemberPassword = factory.createHandlers(async (c: Context) => {
	const { token, id } = c.req.query()
	const { newPassword } = await c.req.json()
	let p_id = 0
	const parseId = parseInt(id, 10)
	if (Number.isInteger(parseId)) {
		p_id = parseId
	}

	if (!token || p_id === 0 || !newPassword) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const result = await db.select().from(passwordToken)
			.where(
				and(
					eq(passwordToken.is_active, true),
					eq(passwordToken.memberId, p_id),
				),
			)
		const res = await verifyPasswordToken(token, result[0])
		if (!res) {
			c.status(400)
			return c.json({ status: 'failure', message: 'Invalid Token' })
		}

		const hres = await CryptoHelper.hash(newPassword)
		if (!hres) {
			return c.json({ status: 'failure', message: 'Invalid Hash' })
		}

		await db.update(passwordToken)
			.set({ is_active: false })
			.where(
				and(
					eq(passwordToken.is_active, true),
					eq(passwordToken.memberId, p_id),
				),
			)

		await db.update(members)
			.set({ password: hres.hash, salt: hres.salt })
			.where(eq(members.id, p_id))

		return c.json('Password Changed', 200)
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

const checkPwordLink = factory.createHandlers(async (c: Context) => {
	const { token, id } = c.req.query()
	let p_id = 0
	const parseId = parseInt(id, 10)
	if (Number.isInteger(parseId)) {
		p_id = parseId
	}

	if (!token || p_id === 0) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	let return_url = ''
	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const result = await db.select().from(passwordToken)
			.where(
				and(
					eq(passwordToken.is_active, true),
					eq(passwordToken.memberId, p_id),
				),
			)
		c.status(200)
		const res = await verifyPasswordToken(token, result[0])
		if (res) {
			return_url =
				`${config.returnURL}${'membership/passwordReset/'}${token}?&id=${p_id}`
		} else {
			return_url =
				`${config.returnURL}${'membership/passwordReset/badToken'}`
		}
		return c.redirect(return_url)
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

const verifyPasswordToken = async (
	token: string,
	pwordToken: PasswordToken,
) => {
	let retVal = false
	let isExpired = false

	const veri = await CryptoHelper.verify(
		token,
		pwordToken.salt,
		pwordToken.hash,
	)
	const rightNow = Math.round(Date.now() / 1000) //in secs
	const expireWhen = Math.round(pwordToken.created_at.getTime() / 1000) +
		pwordToken.expires

	//const expireWhen = pwordToken.created_at as number + pwordToken.expires
	// console.log('rightNow',rightNow )
	// console.log('expireWhen',expireWhen )

	if (expireWhen < rightNow) {
		isExpired = true
	}

	if (veri && !isExpired) {
		retVal = true
	}
	return retVal
}

const doPasswordResetLink = factory.createHandlers(async (c: Context) => {
	// const host = `http://localhost:8787/api/`
	//const host = `https://triangle-api-cf.dev-a10.workers.dev/api/`
	const { email } = await c.req.json()
	if (!email) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	const emailPayload: emailSend = {
		email: email,
		name: '',
		text: '',
		subject: 'Triangle Club Password Reset',
		from: 'Triangle <support@support.atlantatriangleclub.dev>',
		html: '',
	}

	const member = await PeopleService.getMemberByEmail(email, true)
	if (typeof member != 'object') {
		emailPayload.html =
			`<p><b>There is no member with the email address <strong>${email}</strong></b></p>
				 `
		await EmailService.sendResendEmail(emailPayload, config.reSendApiKey)
		return c.json('No such email', 200)
	}
	// generate token
	const resetToken = cryptoRandomString({ length: 16, type: 'url-safe' })

	//hash reset token
	const hashedToken = await CryptoHelper.hash(resetToken)

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const result = await db.select().from(passwordToken)
			.where(
				and(
					eq(passwordToken.is_active, true),
					eq(passwordToken.memberId, member.id),
				),
			)
		if (result.length > 0) {
			//update
			const nowTs = Math.round(Date.now() / 1000) //in secs
			await db.update(passwordToken)
				.set({
					hash: hashedToken.hash,
					salt: hashedToken.salt,
					created_at: new Date(),
				})
				.where(eq(passwordToken.id, result[0].id))
		} else {
			//insert
			await db.insert(passwordToken)
				.values({
					memberId: member.id,
					hash: hashedToken.hash,
					salt: hashedToken.salt,
					is_active: true,
					expires: 3600, // 1 hour
					created_at: new Date(),
				})
		}

		c.status(200)
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}

	const link =
		`${config.apiPath}auth/pword/link?token=${resetToken}&id=${member.id}`

	emailPayload.html = `<h3>Password Reset for ${
		member.firstname + ' ' + member.lastname
	}</h3>
						<br>
						<p>The link is valid for 1 hour.</p>
						<a href=${link}><b>Click to reset password<b></a> 					
						`
	const res = await EmailService.sendResendEmail(
		emailPayload,
		config.reSendApiKey,
	)

	if (res) {
		return c.json('Email sent', 200)
	} else {
		return c.json('Email not sent', 404)
	}
})

const updateMemberForCryptoHash = async (id: number, password: string) => {
	const sql = neon(config.dbURL)
	const db = drizzle({ client: sql })
	// hash password
	const hres = await CryptoHelper.hash(password)
	if (!hres) {
		return false
	}
	try {
		await db.update(members)
			.set({ password: hres.hash, salt: hres.salt })
			.where(eq(members.id, id))
		return true
	} catch (_error) {
		return false
	}
}

/**
 ** Admin Website
 */
const doAdminUserLogin = factory.createHandlers(async (c: Context) => {
	const res = loginSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	try {
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
		if (!existingUser) {
			c.status(404)
			return c.json({
				status: 'failure',
				message:
					`This Email address ${res.data.email} does not exit or User is not activated`,
			})
		}
		const adminUser = existingUser
		if (
			!await CryptoHelper.verify(
				res.data.password,
				adminUser.salt as string,
				adminUser.password,
			)
		) {
			c.status(400)
			return c.json({
				status: 'failure',
				message: 'This password is incorrect',
			})
		}

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

		const nowTs = Math.round(Date.now() / 1000) //in secs
		const accessTokenExpires = nowTs + (config.jwtAccessExpiration * 1) // 3600 secs or 1 hr
		const refreshTokenExpires = nowTs + (config.jwtRefeshExpiration * 1) // 86400 secs or 1 day
		const accessToken = await JwtHelper.createToken(
			accessTokenExpires,
			adminUser.id,
		)
		const refreshToken = await JwtHelper.createToken(
			refreshTokenExpires,
			adminUser.id,
		)
		const cookieExpiresIn = new Date(
			Date.now() + config.jwtRefeshExpiration * 1000,
		)
		UtilsHelper.setRefreshTokenCookie(c, refreshToken, cookieExpiresIn)
		return c.json({
			data: { adminUser: returnUser, token: accessToken },
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
})

const doRefresh = factory.createHandlers(async (c: Context) => {
	const sql = neon(config.dbURL)
	const db = drizzle({ client: sql })
	const refreshToken = getCookie(c, 'refreshToken')
	if (!refreshToken) {
		c.status(401)
		return c.json({
			status: 'failure',
			message: `Access Denied. No refresh token provided`,
		})
	}

	const decoded = await JwtHelper.getJwtPayload(refreshToken as string)
	if (typeof decoded === 'string') {
		c.status(401)
		return c.json({
			status: 'failure',
			message: `Token is invalid or session has expired`,
		})
	}

	const result = await db.select().from(admin_users).where(
		eq(admin_users.id, decoded.id as number),
	)

	const adminUser = result[0]
	const {
		password,
		// salt,
		phone,
		created_at,
		updated_at,
		...returnUser
	} = adminUser //omit unwanted props

	const roles = await PeopleService.getAdminUserRolesById(
		returnUser.id,
	) as rolesType[]

	const userWithRoles: adminUserWithRoles = Object.assign(returnUser)

	if (roles) {
		userWithRoles.roles = roles
	}

	const nowTs = Math.round(Date.now() / 1000) //in secs
	const accessTokenExpires = nowTs + (config.jwtAccessExpiration * 1) // 3600 secs or 1 hr
	const accessToken = await JwtHelper.createToken(
		accessTokenExpires,
		adminUser.id,
	)

	return c.json({
		data: { adminUser: returnUser, token: accessToken },
		status: 'success',
		results: 1,
	})
})

const changeAdminUserPassword = factory.createHandlers(async (c: Context) => {
	const res = passwordSchema.safeParse(await c.req.json())

	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	const user = await PeopleService.getAdminUserByEmail(res.data.email, true)
	if (typeof user === 'string') {
		return c.json(
			{
				user,
			},
			500,
		)
	}

	const veri = await CryptoHelper.verify(
		res.data.oldPassword,
		user.salt,
		user.password,
	)

	if (!veri) {
		c.status(400)
		return c.json({
			status: 'failure',
			message: 'This password is incorrect',
		})
	}

	// hash new password
	const hres = await CryptoHelper.hash(res.data.newPassword)
	if (!hres) {
		c.status(400)
		return c.json({
			status: 'failure',
			message: 'Something went wrong',
		})
	}

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		await db.update(admin_users)
			.set({ password: hres.hash, salt: hres.salt })
			.where(eq(admin_users.id, user.id))
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
})

const checkToken = factory.createHandlers(async (c: Context) => {
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
	} else {
		c.status(200)
		return c.text('Your are authorized!')
	}
})

export default {
	doMemberLogin,
	changeMemberPassword,
	doPasswordResetLink,
	checkPwordLink,
	newMemberPassword,
	changeAdminUserPassword,
	doAdminUserLogin,
	doRefresh,
	checkToken,
}
