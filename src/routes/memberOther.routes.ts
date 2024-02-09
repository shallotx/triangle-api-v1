import { Hono } from '../deps.ts'
import membersOtherController from '../controllers/membersOther.controller.ts'
import auth from '../middleware/auth.ts'

const router = new Hono()

router.get('/', auth([]), membersOtherController.getMembersOtherPaged)
router.post(
	'/',
	auth(['createMember']),
	membersOtherController.createMemberOther,
)
router.get('/:id', auth([]), membersOtherController.getMemberOtherById)
router.patch(
	'/:id',
	auth(['editMember']),
	membersOtherController.updateMemberOther,
)

router.post(
	'/address/:id',
	auth(['createMember']),
	membersOtherController.createMemberOtherAddress,
)
router.post(
	'/paymentinfo',
	auth(['createMember']),
	membersOtherController.createPaymentInfo,
)

router.patch(
	'/:id',
	auth(['editMember']),
	membersOtherController.updateMemberOther,
)

export default router
