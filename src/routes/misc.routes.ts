import { type Context, Hono } from '@hono/hono'
import { and, eq, SQL } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neon/serverless'
import UtilsHelper from '../helpers/utils.helper.ts'
import { discussion_type, donation_code, links } from '../schema/misc.ts'
import {
	productsOther,
	productsPricing,
	productsSubscription,
} from '../schema/product.ts'
import { eventsCalender } from '../schema/event.ts'
import { emailSchema, type emailSend, type emailType } from '../schema/zod.ts'
import EmailService from '../services/email.service.ts'
import membersHandler from '../handlers/members.handler.ts'
import config from '../config/default.ts'

const router = new Hono()

router.get('/donationcodes', async (c: Context) => {
	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const isActive = true
		const result = await db.select().from(donation_code).where(
			eq(donation_code.is_active, isActive),
		)
		return c.json({
			donationCodes: result,
			status: 'success',
			results: result.length,
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

router.get('/recoverylinks', async (c: Context) => {
	try {
		const isActive = true
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const result = await db.select().from(links).where(
			eq(links.is_active, isActive),
		)
		return c.json({
			recoveryLinks: result,
			status: 'success',
			results: result.length,
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

router.get('/discussiontypes', async (c: Context) => {
	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const result = await db.select().from(discussion_type)
		return c.json({
			discussionTypes: result,
			status: 'success',
			results: result.length,
		})
	} catch (e) {
		return c.json({ e }, 400)
	}
})

router.get('/products/subscription', async (c: Context) => {
	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		let p_testMode = false
		const { testMode } = c.req.query()
		if (testMode) {
			p_testMode = UtilsHelper.parseBool(testMode)
		}
		const isActive = true
		const result = await db.select().from(productsSubscription)
			.where(
				and(
					eq(productsSubscription.is_active, isActive),
					eq(productsSubscription.is_test_mode, p_testMode),
				),
			)
		return c.json({
			subscriptionProducts: result,
			status: 'success',
			results: result.length,
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

router.get('/products/other', async (c: Context) => {
	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		let p_testMode = false
		const { testMode } = c.req.query()
		if (testMode) {
			p_testMode = UtilsHelper.parseBool(testMode)
		}
		const isActive = true
		const result = await db.select().from(productsOther)
			.orderBy(productsOther.sort_order)
			.where(
				and(
					eq(productsOther.is_active, isActive),
					eq(productsOther.is_test_mode, p_testMode),
				),
			)
		return c.json({
			otherProducts: result,
			status: 'success',
			results: result.length,
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

router.get('/products/prices', async (c: Context) => {
	const { testMode, unitAmount } = c.req.query()
	let p_testMode = false
	let p_unitAmount = 0

	if (testMode) {
		p_testMode = UtilsHelper.parseBool(testMode)
	}
	const unitAmt = parseInt(unitAmount, 10)
	if (Number.isInteger(unitAmt)) {
		p_unitAmount = unitAmt
	}
	const filters: SQL[] = []
	// filters.push(ilike(posts.title, 'AI'));
	// filters.push(inArray(posts.category, ['Tech', 'Art', 'Science']));
	if (p_unitAmount > 0) {
		filters.push(eq(productsPricing.unit_amount, p_unitAmount))
	}
	filters.push(eq(productsPricing.is_active, true))
	filters.push(eq(productsPricing.is_test_mode, p_testMode))

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const result = await db.select().from(productsPricing)
			.where(and(...filters))
		return c.json({
			productsPricing: result,
			status: 'success',
			results: result.length,
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

router.get('/events/calendar', async (c: Context) => {
	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const isActive = true
		const result = await db.select().from(eventsCalender)
			.orderBy(eventsCalender.eventDate)
			.where(
				and(
					eq(eventsCalender.is_active, isActive),
				),
			)
		return c.json({
			events: result,
			status: 'success',
			results: result.length,
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

// /**
//  ** Send Contact email from Triangle Website
//  */

router.post('/sendmail', async (c: Context) => {
	const res = emailSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const emailData: emailType = res.data
	await EmailService.sendContactEmail(
		emailData,
		config.emailTo,
		config.postMarkApiKey,
	)
	return c.json('Email sent', 200)
})

// /**
//  ** Send Support email from Triangle Website
//  */
router.post('/sendmail/support', async (c: Context) => {
	const res = emailSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const emailData: emailType = res.data
	const emailPayload: emailSend = {
		email: config.supportEmail,
		name: '',
		text: '',
		subject: 'Triangle Website Support',
		from: 'Triangle <support@support.atlantatriangleclub.dev>',
		html: `<h3>Support Request from ${emailData.name}</h3>
						<br>
						<a href="mailto:${config.supportEmail}">Email from ${emailData.email}</a>
						<p>Message: ${emailData.text}</</p>
						`,
	}
	await EmailService.sendResendEmail(emailPayload, config.reSendApiKey)
	return c.json('Email sent', 200)
})

// /**
//  ** Admin Website
//  */
router.get('/download/members', ...membersHandler.getMembersForCSV)

export default router
