import { Hono } from '../deps.ts'
import adminUserController from '../controllers/adminUser.controller.ts'
import auth from '../middleware/auth.ts'

const router = new Hono()
router.post('/adminuser', adminUserController.createAdminUser)
router.post('/userinvite', auth([]), adminUserController.createAdminUserInvite)
router.post(
	'/userinvite/update',
	auth([]),
	adminUserController.updateUserInviteToken,
)
router.get('/invite/:id', adminUserController.checkInvite)

export default router
