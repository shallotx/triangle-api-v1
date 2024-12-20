import { Context, Hono } from '@hono/hono'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neon/serverless'
import config from '../config/default.ts'
import UtilsHelper from '../helpers/utils.helper.ts'
import {
	discussion_type,
	donation_code,
	links,
} from '../db/schema/misc.schema.ts'
import { productsSubscription, productsOther } from '../db/schema/products.ts'
import { eventsCalender} from '../db/schema/event.ts'
import { emailSchema, type emailType } from '../db/schema/zod.ts'
import EmailService from '../services/email.service.ts'

const router = new Hono()

router.get('/donationcodes', async (c: Context) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
	const isActive = true
	const result = await db.select().from(donation_code).where(
		eq(donation_code.is_active, isActive),
	)
	return c.json({
		donationCodes: result,
		status: 'success',
		results: result.length,
	})
})
router.get('/recoverylinks', async (c: Context) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
	const result = await db.select().from(links)
	return c.json({
		recoveryLinks: result,
		status: 'success',
		results: result.length,
	})
})

router.get('/discussiontypes', async (c: Context) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
	const result = await db.select().from(discussion_type)
	return c.json({
		discussionTypes: result,
		status: 'success',
		results: result.length,
	})
})

router.get('/products/subscription', async (c: Context) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
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
})

router.get('/products/other', async (c: Context) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
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
  })

  router.get('/events/calendar', async (c: Context) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
	const isActive = true
	const result = await db.select().from(eventsCalender)
	.orderBy(eventsCalender.eventDate )
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
}) 

/**
 ** Send Contact email from Triangle Website
 */
router.post('/sendmail', async (c: Context) => {
	const res = emailSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const emailData: emailType = res.data
	await EmailService.sendContactEmail(emailData)
	return c.json('Email sent', 200)
})

/**
 ** Send Support email from Triangle Website
 */
router.post('/sendmail/support', async (c: Context) => {
	const res = emailSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const emailData: emailType = res.data
	await EmailService.sendSupportEmail(emailData)
	return c.json('Email sent', 200)
})
// // router.post('/sendInviteEmail', miscController.sendInviteEmail)
// router.get('/download/members', miscController.getMembersForCSV)

export default router
