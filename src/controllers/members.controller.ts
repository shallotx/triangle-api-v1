import { Context } from '../deps.ts'
import { drizzle } from '../deps.ts'
import { and, desc, eq, like, lt, or, sql } from '../deps.ts'
import config from '../config/default.ts'
import { stripe } from '../deps.ts'
import pgSql from '../db/db.ts'
import { Member, members } from '../db/schema/members.ts'
import {
	memberInsert,
	memberInsertSchema,
	membershipCheck,
} from '../db/schema/zod.ts'
import CryptoHelper from '../helpers/crypto.helper.ts'

//for admin site
const getMembersPaged = async (c: Context) => {
	const { rowlimit, startingid, isactive, search } = c.req.query()

	if (!rowlimit || !startingid) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	let p_rowlimit = 10
	let p_startingid = 1000000

	const rowlim = parseInt(rowlimit, 10)
	if (Number.isInteger(rowlim)) {
		p_rowlimit = rowlim
	}
	const startId = parseInt(startingid, 10)
	if (Number.isInteger(startId)) {
		p_startingid = startId
	}

	const countSql = sql.empty()
	// countSql.append(sql`SELECT COUNT(*) FROM members WHERE 1=1`)
	countSql.append(sql`SELECT CAST(COUNT(*) AS INTEGER) FROM members WHERE 1=1`)

	const finalSql = sql.empty()
	finalSql.append(sql`id < ${p_startingid}`)

	if (typeof isactive != 'undefined') {
		finalSql.append(sql` AND membership_is_active = ${isactive}`)
		countSql.append(sql` AND membership_is_active = ${isactive}`)
	}
	if (typeof search != 'undefined') {
		const searchParam = search + ':*'
		finalSql.append(sql` AND search_vector @@ to_tsquery(${searchParam})`)
		countSql.append(sql` AND search_vector @@ to_tsquery(${searchParam})`)
	}
 
	try {
		// const searchParam = "Shal:*"
		const db = drizzle(pgSql)
		const res = await db.execute(countSql)
		const rowCount = res[0].count 
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
}

const checkForMembership = async (c: Context) => {
	const { email } = await c.req.json()
	if (!email) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	const retVal: membershipCheck = {
		emailExists: false,
		stripeCustId: '',
		hasActiveSubscription: false,
	}

	try {
		const db = drizzle(pgSql)
		const result = await db.select().from(members).where(
			eq(members.email, email),
		)
		if (result.length > 0) {
			retVal.emailExists = true
		} else {
			c.status(200)
			return c.json({
				memberCheck: retVal,
				status: 'success',
				results: 1,
			})
		}
		if (result[0].stripe_cust_id && result[0].stripe_cust_id.length > 0) {
			retVal.stripeCustId = result[0].stripe_cust_id
			const subscript = await getStripeSubscript(
				result[0].stripe_cust_id,
				c.env.STRIPE_SECRET_KEY,
			)
			if (typeof subscript === 'boolean') {
				retVal.hasActiveSubscription = subscript
			}
		}

		c.status(200)
		return c.json({ memberCheck: retVal, status: 'success', results: 1 })
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

const checkForEmailExists = async (c: Context) => {
	const { email } = await c.req.json()
	if (!email) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	try {
		const isActive = true
		const db = drizzle(pgSql)
		const result = await db.select().from(members).where(
			eq(members.email, email),
		)
		const retVal = result.length > 0 ? true : false
		if (retVal) {
			return c.text('Email already exits', 400)
		}
		return c.text('Email does not exits', 200)
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

const getStripeSubscript = async (stripeCustId: string, stripeKey: string) => {
	const statusFilter = 'active'

	try {
		const subscripts = await stripe.subscriptions.list({
			limit: 1,
			status: statusFilter,
			customer: stripeCustId,
		})
		if (subscripts.data.length > 0) {
			return true
		}
		return false
	} catch (error) {
		return false
	}
}

const createMember = async (c: Context) => {
	const body = await c.req.json()
	const res = memberInsertSchema.safeParse(body)

	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const newMember: memberInsert = res.data

	/*
   creating a  new member...
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
		const db = drizzle(pgSql)
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
		console.log('error', error)
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

export default {
	getMembersPaged,
	checkForMembership,
	checkForEmailExists,
	createMember,
}
