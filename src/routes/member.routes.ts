import { Hono } from '@hono/hono'
import { drizzle } from 'drizzle-orm/neon-http'
import { /* and, */ eq } from 'drizzle-orm'
import { neon } from '@neon/serverless'
import config from '../config/default.ts'
import { members } from '../db/schema/members.schema.ts'
import membersHandler from '../handlers/members.handler.ts'

const router = new Hono()

/**
 ** Triangle Website
 */
router.post('/', ...membersHandler.createMember)
router.post('/checkForMembership', ...membersHandler.checkForMembership)
router.post('/checkForEmailExists', async (c) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
	const { email } = await c.req.json()
	if (!email) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	try {
		// const isActive = true
		const result = await db.select().from(members).where(
			eq(members.email, email),
		)
		const retVal = result.length > 0 ? true : false
		if (retVal) {
			return c.text('Email already exists', 400)
		}
		return c.text('Email does not exist', 200)
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

export default router
