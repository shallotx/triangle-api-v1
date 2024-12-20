import { type Context, Hono, type Next } from '@hono/hono'
import { drizzle } from 'drizzle-orm/neon-http'
import { /* and, */ eq } from 'drizzle-orm'
import { neon } from '@neon/serverless'
import config from '../config/default.ts'
import { lower, members } from '../schema/member.ts'
import membersHandler from '../handlers/members.handler.ts'
import authAdm from '../middleware/authAdm.ts'

const router = new Hono()

/**
 ** Triangle Website
 */
router.post('/', ...membersHandler.createMember)
router.post('/checkForMembership', ...membersHandler.checkForMembership)
router.post('/checkForEmailExists', async (c: Context) => {
	const { email } = await c.req.json()
	if (!email) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const result = await db.select().from(members)
			.where(eq(lower(members.email), email.toLowerCase()))
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

/**
 ** Admin Website
 */

router.get('/', async (c: Context, next: Next) => {
	const auth = await authAdm([])
	return auth(c, next)
})
router.get('/', ...membersHandler.getMembersPaged)

export default router
