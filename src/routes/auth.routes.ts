import { Hono } from '@hono/hono'
import authController from '../controllers/auth.controller.ts'
import auth from '../middleware/auth.ts'

const router = new Hono()

router.post('/login', authController.doMemberLogin)
router.post('/login/adminuser', authController.doAdminUserLogin)
router.post('/logout/adminuser', authController.doAdminUserLogout)
router.post('/changepassword', authController.changeMemberPassword)
router.post('/refresh', authController.doRefresh)

export default router
