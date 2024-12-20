import type { Context } from '@hono/hono'
import { createFactory } from '@hono/hono/factory'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neon/serverless'
import { stripe } from '../deps.ts'
import { desc, eq, inArray, sql } from 'drizzle-orm'
import config from '../config/default.ts'
import CryptoHelper from '../helpers/crypto.helper.ts'
import CsvHelper from '../helpers/csv.helper.ts'
import {
	type emailSend,
	type memberInsert,
	memberInsertSchema,
} from '../schema/zod.ts'
import { lower, members } from '../schema/member.ts'
import { membersOther } from '../schema/membersOther.ts'
import EmailService from '../services/email.service.ts'

const factory = createFactory()

/**
 ** Triangle Website
 */

const createMember = factory.createHandlers(async (c: Context) => {
	const body = await c.req.json()
	const res = memberInsertSchema.safeParse(body)

	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const newMember: memberInsert = res.data

	/**
   ** creating a new member...
      - we have already checked on the client that the email DOES not exist in members table
      - if this is a new website member, we have already created a Stripe cust,
         and are passing the stripe_cust_id
  */

	// hash password
	const hres = await CryptoHelper.hash(newMember.password)
	if (!hres) {
		return c.json(
			{
				Error,
			},
			500,
		)
	}
	newMember.password = hres.hash
	const salt = hres.salt

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const inserted = await db.insert(members).values({
			firstname: newMember.firstname,
			lastname: newMember.lastname,
			phone: newMember.phone,
			email: newMember.email,
			is_volunteer: newMember.is_volunteer,
			membership_is_active: newMember.membership_is_active,
			stripe_cust_id: newMember.stripe_cust_id,
			password: newMember.password,
			salt: salt,
			notes: newMember.notes,
		}).returning({ insertedId: members.id })
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
})

const checkForMembership = factory.createHandlers(async (c: Context) => {
	const { email } = await c.req.json()
	if (!email) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	const membershipCheck = {
		emailExists: false,
		stripeCustId: '',
		hasActiveSubscription: false,
	}

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const result = await db.select().from(members).where(
			eq(lower(members.email), email.toLowerCase()),
		)
		if (result.length > 0) {
			membershipCheck.emailExists = true
			if (
				result[0].stripe_cust_id && result[0].stripe_cust_id.length > 0
			) {
				membershipCheck.stripeCustId = result[0].stripe_cust_id
				const subscript = await stripe.subscriptions.list({
					limit: 1,
					status: 'active',
					customer: membershipCheck.stripeCustId,
				})
				if (subscript.data[0]) {
					membershipCheck.hasActiveSubscription = true
				}
			}
		}

		let msg = ''
		if (membershipCheck.emailExists) {
			msg =
				`<p><b>This email <strong>has been used</strong> to signup online for membership.</b></p>
					<p><b>Please login to view your membership<b></p>
			`
			if (!membershipCheck.hasActiveSubscription) {
				msg =
					`<p><b>It looks like your membership was <strong>CANCELED</strong> </b></p>
				<p><b>You can still login to view your membership<b></p>
		`
			}
		} else {
			msg =
				`<p><b>There is <strong>NO</strong> online membership with this email.</b></p>
			       <p<b>You may have previously become a member directly through
					the Triangle Club Office - please check with them and they
					will be happy to review your membership status<b></p>
			`
		}

		const html = `<h3>Membership Check for ${email}</h3>
					<br>
					${msg}		
					`
		const emailPayload: emailSend = {
			email: email,
			name: '',
			text: '',
			subject: 'Membership Email Check',
			from: 'Triangle <support@support.atlantatriangleclub.dev>',
			html: html,
		}
		await EmailService.sendResendEmail(emailPayload, config.reSendApiKey)
		c.status(200)
		return c.json({ message: 'Membership Check in progress' })
		// deno-lint-ignore no-explicit-any
	} catch (error: any) {
		if (error.code === 'resource_missing') {
			c.status(404)
			return c.json({ message: 'Membership Check error' })
		}
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

/**
 ** Admin Website
 */
const getMembersPaged = factory.createHandlers(async (c: Context) => {
	const { rowlimit, startingid, isactive, search } = c.req.query()

	if (!rowlimit || !startingid) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	let p_rowlimit = 10
	let p_startingid = 1000000
	let p_active = false

	const rowlim = parseInt(rowlimit, 10)
	if (Number.isInteger(rowlim)) {
		p_rowlimit = rowlim
	}
	const startId = parseInt(startingid, 10)
	if (Number.isInteger(startId)) {
		p_startingid = startId
	}

	const countSql = sql.empty()
	countSql.append(
		sql`SELECT CAST(COUNT(*) AS INTEGER) FROM members WHERE 1=1`,
	)

	const finalSql = sql.empty()
	finalSql.append(sql`id < ${p_startingid}`)

	if (typeof isactive != 'undefined') {
		if (isactive === 'true') {
			p_active = true
		}
		finalSql.append(sql` AND membership_is_active = ${p_active}`)
		countSql.append(sql` AND membership_is_active = ${p_active}`)
	}

	if (typeof search != 'undefined') {
		const searchParam = search + ':*'
		finalSql.append(sql` AND search_vector @@ to_tsquery(${searchParam})`)
		countSql.append(sql` AND search_vector @@ to_tsquery(${searchParam})`)
	}

	try {
		// const searchParam = "Shal:*"
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const res = await db.execute(countSql)
		const rowCount = res.rows[0].count

		const result = await db.select({
			id: members.id,
			firstname: members.firstname,
			lastname: members.lastname,
			phone: members.phone,
			email: members.email,
			is_volunteer: members.is_volunteer,
			membership_is_active: members.membership_is_active,
			stripe_cust_id: members.stripe_cust_id,
			notes: members.notes,
		})
			.from(members).orderBy(desc(members.id)).limit(p_rowlimit)
			.where(finalSql)
		let lastId = 0
		if (result.length > 0) {
			lastId = result[result.length - 1].id
		}
		return c.json({
			members: result,
			status: 'success',
			lastId: lastId,
			rowCount: rowCount,
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

const getMembersForCSV = factory.createHandlers(async (c: Context) => {
	const { membershipIsActive } = c.req.query()
	const activeArray = [true, false]
	if (membershipIsActive) {
		if (membershipIsActive !== 'any') {
			const boolOutput = membershipIsActive === 'true'
			if (boolOutput) {
				activeArray.pop()
			} else {
				activeArray.shift()
			}
		}
	}
	interface memberForCSV {
		memberType: string
		firstname: string
		lastname: string
		phone: string
		email: string
		isVolunteer: string
		isActive: string
	}
	const membersToWrite: memberForCSV[] = []

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const result = await db.select().from(members).where(
			inArray(members.membership_is_active, activeArray),
		)

		result.forEach((el) => {
			membersToWrite.push({
				memberType: 'Online',
				firstname: el.firstname || '',
				lastname: el.lastname || '',
				phone: el.phone || '',
				email: el.email,
				isVolunteer: el.is_volunteer as unknown as string,
				isActive: el.membership_is_active as unknown as string,
			})
		})

		const result2 = await db.select().from(membersOther)
			.where(inArray(membersOther.membership_is_active, activeArray))

		result2.forEach((el) => {
			membersToWrite.push({
				memberType: 'Other',
				firstname: el.firstname || '',
				lastname: el.lastname || '',
				phone: el.phone || '',
				email: el.email || '',
				isVolunteer: el.is_volunteer as unknown as string,
				isActive: el.membership_is_active as unknown as string,
			})
		})

		// sort by name
		membersToWrite.sort((a, b) => {
			const nameA = a.lastname.toUpperCase() // ignore upper and lowercase
			const nameB = b.lastname.toUpperCase() // ignore upper and lowercase
			if (nameA < nameB) {
				return -1
			}
			if (nameA > nameB) {
				return 1
			}
			// names must be equal
			return 0
		})
		const stream = CsvHelper.encode(membersToWrite)
		return c.body(stream)
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

export default {
	createMember,
	checkForMembership,
	getMembersPaged,
	getMembersForCSV,
}
