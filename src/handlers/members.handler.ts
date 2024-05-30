import { eq, inArray } from 'drizzle-orm'
import { createFactory } from '@hono/hono/factory'
import { members } from '../db/schema/members.schema.ts'
import { membersOther } from '../db/schema/membersOther.schema.ts'
import StripeService from '../services/stripe.service.ts'
import config from '../config/default.ts'
import CsvHelper from '../helpers/csv.helper.ts'
import CryptoHelper from '../helpers/crypto.helper.ts'
import {
	memberInsert,
	memberInsertSchema,
	membershipCheck,
} from '../db/schema/zod.ts'
import { neon } from '@neon/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const factory = createFactory()

/**
 ** Triangle Website
 */
const checkForMembership = factory.createHandlers(async (c) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
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
			const subscript = await StripeService.getStripeSubscript(
				result[0].stripe_cust_id,
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
})

const createMember = factory.createHandlers(async (c) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
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

/**
 ** Triangle Admin
 */
const getMembersForCSV = factory.createHandlers(async (c) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
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

export default { checkForMembership, createMember, getMembersForCSV }
