import { Hono } from '@hono/hono'
import authHandler from '../handlers/auth.handler.ts'
import authWs from '../middleware/authWS.ts'

const router = new Hono()

/* Triangle Website */
router.post('/login', ...authHandler.doMemberLogin)
router.get('/checktoken', authWs(), ...authHandler.checkToken)

router.post('/refresh', ...authHandler.doRefresh)

// router.post('/test', auth(), async (c) => {
// 	return await c.text('Authorized!')
// })

export default router
