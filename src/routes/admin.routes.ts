import { Hono } from '@hono/hono'
import membersHandler from '../handlers/members.handler.ts'
// import auth from '../middleware/auth.ts'

const router = new Hono()
/**
* Todo: Need auth here!
 */
router.get('/download/members', ...membersHandler.getMembersForCSV)

// router.post('/adminuser', adminUserController.createAdminUser)
// router.post('/userinvite', auth([]), adminUserController.createAdminUserInvite)
// router.post(
// 	'/userinvite/update',
// 	auth([]),
// 	adminUserController.updateUserInviteToken,
// )
// router.get('/invite/:id', adminUserController.checkInvite)

export default router
