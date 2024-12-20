import { type Context, Hono, type Next } from '@hono/hono'
import { deleteCookie } from '@hono/hono/cookie'
import authHandler from '../handlers/auth.handler.ts'
import authWs from '../middleware/authWS.ts'
import authAdm from '../middleware/authAdm.ts'

const router = new Hono()

/**
 ** Triangle Website
 */
router.post('/login', ...authHandler.doMemberLogin)
router.get('/checktoken', authWs(), ...authHandler.checkToken)
router.post('/changepassword', authWs(), ...authHandler.changeMemberPassword)
router.post('/password/new', ...authHandler.newMemberPassword)
router.post('/password/reset', ...authHandler.doPasswordResetLink)

//check password reset token
router.get('/pword/link', ...authHandler.checkPwordLink)

/**
 ** Admin Website
 */
router.post('/login/adminuser', ...authHandler.doAdminUserLogin)

router.post('/logout/adminuser/:id', (c: Context) => {
	deleteCookie(c, 'refreshToken')
	c.status(200)
	return c.json({ status: 'success', results: 1 })
})

router.post('/changepassword/adminuser', async (c: Context, next: Next) => {
	const auth = await authAdm([])
	return auth(c, next)
})
router.post('/changepassword/adminuser', ...authHandler.changeAdminUserPassword)

router.post('/refresh', ...authHandler.doRefresh)

export default router
