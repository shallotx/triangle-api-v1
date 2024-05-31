// deno-lint-ignore-file no-unused-vars
import { createFactory } from '@hono/hono/factory'
import { loginSchema } from '../db/schema/zod.ts'
import { members } from '../db/schema/members.schema.ts'
import JwtHelper from '../helpers/jwt.helper.ts'
import HashHelper from '../helpers/hash.helper.ts'
import CryptoHelper from '../helpers/crypto.helper.ts'
import config from '../config/default.ts'
import { /* and, */ eq } from 'drizzle-orm'
import { getCookie, setCookie } from '@hono/hono/cookie'
import { neon } from '@neon/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { type JWTPayload } from '@cross/jwt'

const factory = createFactory()

const doMemberLogin = factory.createHandlers(async (c) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
	const res = loginSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	try {
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
		// using new password hash process, so verify with crypto and not bcryprt
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
			// verify with bcryprt and then update to new process
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
		const accessTokenExpires = nowTs + (config.jwtAccessExpiration * 1) // 3600 secs  or 1 hr
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

const doRefresh = factory.createHandlers(async (c) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
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
	const accessToken = await JwtHelper.generateAuthToken(decoded.id, 'access')

	const result = await db.select().from(members).where(
		eq(members.id, decoded.id),
	)

	const member = result[0]
	const {
		password,
		// salt,
		phone,
		created_at,
		updated_at,
		...returnMember
	} = member //omit unwanted props

	return c.json({
		data: { member: returnMember, token: accessToken },
		status: 'success',
		results: 1,
	})
})

const checkToken = factory.createHandlers(async (c) => {
	if (!c.req.raw.headers.has('Authorization')) {
		return c.json({ message: 'Unauthorized' }, 401)
	}
	const authHeader = c.req.header('Authorization')
	if ((!authHeader) || !authHeader.startsWith('Bearer')) {
		return c.json({ message: 'Access Denied. No token provided.' }, 401)
	}
	const token = authHeader.split('Bearer ')[1]
	const payload: JWTPayload | string = await JwtHelper.getJwtPayload(token)
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

const updateMemberForCryptoHash = async (id: number, password: string) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
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
	} catch (error) {
		return false
	}
}

export default { doMemberLogin, doRefresh, checkToken }
