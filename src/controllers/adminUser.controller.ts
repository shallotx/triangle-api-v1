import { Context } from '../deps.ts'
import { drizzle } from '../deps.ts'
import { eq, sql } from '../deps.ts'
import pgSql from '../db/db.ts'
import JwtHelper from '../helpers/jwt.helper.ts'
import config from '../config/default.ts'
import { nodemailer } from '../deps.ts'
// import { HTTPException } from '../deps.ts'
import CryptoHelper from '../helpers/crypto.helper.ts'
import { adminUsers } from '../db/schema/adminUsers.ts'
import { userInvite } from '../db/schema/userInvite.ts'
import { adminUserInsertSchema } from '../db/schema/zod.ts'
import PeopleService from '../services/people.service.ts'

const createAdminUser = async (c: Context) => {
	const body = await c.req.json()
	const res = adminUserInsertSchema.safeParse(body.adminUser)
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const newUser = res.data
	const existingUser = await PeopleService.getAdminUserByEmail(
		newUser.email,
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

	if (existingUser) {
		c.status(400)
		return c.json({
			status: 'failure',
			message: 'User with that Email address already exists',
		})
	}

	const checkInvite = checkAdminUserInvite(newUser.email)
	if (!checkInvite) {
		console.log('bad invite')
		return c.json({
			status: 'failure',
			message: 'Problem with Invite Token',
		}, 400)
	}

	if (newUser.password.length < 5) {
		c.status(500)
		return c.json({ status: 'failure', message: 'Password too short' })
	}
	// hash password
	const hres = await CryptoHelper.hash(newUser.password)
	if (!hres) {
		return c.json(
			{
				Error,
			},
			500,
		)
	}
	newUser.password = hres.hash
	const salt = hres.salt

	try {
		const db = drizzle(pgSql)
		const inserted = await db.insert(adminUsers).values({
			firstname: newUser.firstname,
			lastname: newUser.lastname,
			phone: newUser.phone,
			email: newUser.email,
			is_active: true,
			is_super: false,
			password: newUser.password,
			salt: salt,
			notes: newUser.notes,
		}).returning({ insertedId: adminUsers.id })

		//give user first role
		const roleId = 1 // getMembers, id# 1
		await db.execute(sql`INSERT INTO user_to_role(
			user_id, roles_id)
			VALUES (${inserted[0].insertedId}, ${roleId})`)

		c.status(200)
		return c.json({
			inserted: inserted[0].insertedId,
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
const checkAdminUserInvite = async (email: string) => {
	const existingInvite = await PeopleService.getUserInviteByEmail(
		email,
		true,
	)

	if (typeof existingInvite === 'string') {
		return false
	}

	if (existingInvite) {
		if (existingInvite.user_confirmed) {
			const decoded = await JwtHelper.getJwtPayload(
				existingInvite.token || '',
			)
			if (typeof decoded === 'string') {
				return false
			}
			// happy path
			return true
		} else {
			return false
		}
	} else {
		return false
	}

	//   c.status(200)
	//   return c.json({ userCheck: userCheck, status: 'success', result: 1 })
}

const createAdminUserInvite = async (c: Context) => {
	const body = await c.req.json()
	const emailToInvite = body.email

	if (!emailToInvite) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const existingUser = await PeopleService.getAdminUserByEmail(
		emailToInvite,
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

	if (existingUser) {
		//email already in use
		c.status(400)
		return c.json({
			status: 'failure',
			message: 'Email address already exists',
		})
	}
	const nowTs = Math.round(Date.now() / 1000) //in secs
	let accessTokenExpires = 0
	accessTokenExpires = nowTs + (config.jwtRefeshExpiration * 1) // 86400 secs or 1 days
	const token = await JwtHelper.getToken(accessTokenExpires, -1)

	try {
		const db = drizzle(pgSql)
		const inserted = await db.insert(userInvite).values({
			email: emailToInvite,
			token: token,
			expires: accessTokenExpires,
			user_confirmed: false,
			is_active: true,
		}).returning()

		const res = await sendInviteEmail(emailToInvite, token)
		if (!res) {
			await db.delete(userInvite).where(
				eq(userInvite.email, emailToInvite),
			)
			c.status(400)
			return c.json({
				status: 'failure',
				message: 'Problem sending Invite Email',
			})
		}
		c.status(200)
		return c.json({
			message: `${inserted[0].email} successfully invited`,
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

const updateUserInviteToken = async (c: Context) => {
	const body = await c.req.json()
	const emailToInvite = body.email

	if (!emailToInvite) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const existingInvite = await PeopleService.getUserInviteByEmail(
		emailToInvite,
		true,
	)
	if (typeof existingInvite === 'string') {
		return c.json(
			{
				existingInvite,
			},
			500,
		)
	}
	const nowTs = Math.round(Date.now() / 1000) //in secs
	let accessTokenExpires = 0
	accessTokenExpires = nowTs + (config.jwtRefeshExpiration * 1) // 86400 secs or 1 days
	const token = await JwtHelper.getToken(accessTokenExpires, -1)

	try {
		const db = drizzle(pgSql)
		await db.update(userInvite)
			.set({
				token: token,
				user_confirmed: false,
				expires: accessTokenExpires,
			})
			.where(eq(userInvite.email, emailToInvite))

		const res = await sendInviteEmail(emailToInvite, token)
		if (!res) {
			await db.delete(userInvite).where(
				eq(userInvite.email, emailToInvite),
			)
			c.status(400)
			return c.json({
				status: 'failure',
				message: 'Problem sending Invite Email',
			})
		}
		c.status(200)
		return c.json({
			updates: `${emailToInvite} token updated`,
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

const sendInviteEmail = async (toEmail: string, token: string) => {
	// const emailBody = await Deno.readTextFile('src/misc/email.html')
	const link = `http://localhost:8000/api/admin/invite/${token}`
	const transporter = nodemailer.createTransport({
		host: 'smtp.forwardemail.net',
		port: 465,
		secure: true,
		auth: {
			user: 'contact@atlantatriangleclub.dev',
			pass: 'cf72542c14a754f15b8f7b3a',
		},
	})

	try {
		const info = await transporter.sendMail({
			from: 'Triangle Club  <contact@atlantatriangleclub.dev>',
			to: toEmail, // list of receivers
			subject: 'Triangle Admin User Invite', // Subject line
			// text: `You are invited to become a user on the Triangle Admin site.
			// Please follow the link to register. `, // plain text body
			html: `<h1>Hello ${toEmail}!</h1>
			<b>You are invited to become a user on the Triangle Admin site</b>
			<p>Please follow the link to register.</p>
			<p>The link is valid for 24 hours.</p>
			<a href=${link}><b>Click to register<b></a> `,
		})

		return true
	} catch (error) {
		return false
	}
}

const checkInvite = async (c: Context) => {
	const token = c.req.param('id')
	const decoded = await JwtHelper.getJwtPayload(token)
	if (typeof decoded === 'string') {
		const return_url =
			`${config.adminReturnURL}${'adminUser'}?tokenok=false`
		return c.redirect(return_url)
		// 	return c.json(
		// 	{
		// 		status: 'failure',
		// 		message: 'You invite token has expired.',
		// 	},
		// 	401,
		// )
	}
	const existingInvite = await PeopleService.getUserInviteByToken(
		token,
		// true,
	)
	if (typeof existingInvite === 'string') {
		const return_url =
			`${config.adminReturnURL}${'adminUser'}?tokenok=false`
		return c.redirect(return_url)
	}
	if (existingInvite) {
		try {
			const db = drizzle(pgSql)
			await db.update(userInvite)
				.set({ user_confirmed: true })
				.where(eq(userInvite.email, existingInvite.email))
			c.status(200)
			const return_url = `${config.adminReturnURL}${'adminUser'}`
			return c.redirect(return_url)
		} catch (error) {
			return c.json(
				{
					error,
				},
				400,
			)
		}
	}
	c.status(400)
	return c.text('Something went wrong')
}

export default {
	createAdminUser,
	createAdminUserInvite,
	checkInvite,
	updateUserInviteToken,
}
