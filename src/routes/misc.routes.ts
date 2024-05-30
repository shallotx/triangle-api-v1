import { Hono } from '@hono/hono'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neon/serverless'
import config from '../config/default.ts'
import {
	discussion_type,
	donation_code,
	links,
} from '../db/schema/misc.schema.ts'
import miscController from '../controllers/misc.controller.ts'
import kvService from '../services/kv.service.ts'

const router = new Hono()

// router.get('/donationcodes', async (c) => {
// 	const dts = await kvService.getDonationCodes()
// 	return c.json({
// 		donationCodes: dts,
// 		status: 'success',
// 		results: dts.length,
// 	})
// })

router.get('/donationcodes', async (c) => {
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

router.get('/recoverylinks', async (c) => {
	const dts = await kvService.getRecoveryLinks()
	return c.json({
		recoveryLinks: dts,
		status: 'success',
		results: dts.length,
	})
})
router.get('/products', async (c) => {
	const { testmode, account } = c.req.query()
	const dts = await kvService.getProducts(testmode, account)
	return c.json({
		products: dts,
		status: 'success',
		results: dts.length,
	})
})

router.post('/sendmail', miscController.sendmail)
// router.post('/sendInviteEmail', miscController.sendInviteEmail)
router.get('/download/members', miscController.getMembersForCSV)

export default router
