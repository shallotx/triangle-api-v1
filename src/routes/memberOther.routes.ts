import { type Context, Hono, type Next } from '@hono/hono'
import membersOtherHandler from '../handlers/membersOther.handler.ts'
import authAdm from '../middleware/authAdm.ts'

const router = new Hono()

router.get('/', async (c: Context, next: Next) => {
	const auth = await authAdm([])
	return auth(c, next)
})
router.get('/', ...membersOtherHandler.getMembersOtherPaged)

router.post('/', async (c: Context, next: Next) => {
	const auth = await authAdm(['createMember'])
	return auth(c, next)
})
router.post(
	'/',
	...membersOtherHandler.createMemberOther,
)

router.post('/delete/:id', async (c: Context, next: Next) => {
	const auth = await authAdm(['deleteMember'])
	return auth(c, next)
})

router.post(
	'/delete/:id',
	...membersOtherHandler.deleteMemberOther,
)

router.get('/:id', async (c: Context, next: Next) => {
	const auth = await authAdm([])
	return auth(c, next)
})
router.get('/:id', ...membersOtherHandler.getMemberOtherById)

router.post('/address/:id', async (c: Context, next: Next) => {
	const auth = await authAdm(['createMember'])
	return auth(c, next)
})
router.post('/address/:id', ...membersOtherHandler.createMemberOtherAddress)

router.post('/paymentinfo', async (c: Context, next: Next) => {
	const auth = await authAdm(['createMember'])
	return auth(c, next)
})

router.post('/paymentinfo', ...membersOtherHandler.createPaymentInfo)

router.post('/payment', async (c: Context, next: Next) => {
	const auth = await authAdm(['createMember'])
	return auth(c, next)
})

router.post('/payment', ...membersOtherHandler.createPayment)

router.patch('/:id', async (c: Context, next: Next) => {
	const auth = await authAdm(['editMember'])
	return auth(c, next)
})
router.patch('/:id', ...membersOtherHandler.updateMemberOther)

router.patch('/status/:id', async (c: Context, next: Next) => {
	const auth = await authAdm(['editMember'])
	return auth(c, next)
})
router.patch('/status/:id', ...membersOtherHandler.updateMemberOtherStatus)

router.post('/payment/:id', async (c: Context, next: Next) => {
	const auth = await authAdm(['createMember'])
	return auth(c, next)
})

router.post('/payment/:id', ...membersOtherHandler.updatePayment)

router.post('/payment/delete/:id', async (c: Context, next: Next) => {
	const auth = await authAdm(['deleteMember'])
	return auth(c, next)
})

router.post(
	'/payment/delete/:id',
	...membersOtherHandler.deletePayment,
)

export default router
