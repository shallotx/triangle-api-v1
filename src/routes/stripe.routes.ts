import { Hono } from '../deps.ts'
import stripeController from '../controllers/stripe.controller.ts'
import auth from '../middleware/auth.ts'
const router = new Hono()

router.get('/promotioncodes', stripeController.getPromotionCodes)
router.post('/donation', stripeController.createDonationCheckout)
router.post('/createSubscript', stripeController.createStripeSubscript)
router.post(
	'/portal/:customerId',
	auth([]),
	stripeController.createPortalSession,
)
router.get(
	'/subscriptions/:customerId',
	auth([]),
	stripeController.getSubscriptionsForCust,
)
router.get(
	'/admin/subscriptions/:customerId',
	auth([]),
	stripeController.getSubscriptionsForCustAdmin,
)

export default router
