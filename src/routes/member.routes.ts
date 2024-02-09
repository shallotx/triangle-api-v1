import { Hono } from '../deps.ts'
import membersController from '../controllers/members.controller.ts'
import auth from '../middleware/auth.ts'

const router = new Hono()

//for admin site
router.get('/', auth([]), membersController.getMembersPaged)

router.post('/', membersController.createMember)
router.post('/checkForMembership', membersController.checkForMembership)
router.post('/checkForEmailExists', membersController.checkForEmailExists)

export default router
