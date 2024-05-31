import { Hono } from '@hono/hono'
import authWS from '../middleware/authWS.ts'
import stripeHandler from '../handlers/stripe.handler.ts'

const router = new Hono()

/**
 ** Triangle Website
 */
router.get('/promotioncodes', ...stripeHandler.getPromotioncodes)
router.post('/donation', ...stripeHandler.createDonationCheckout)
router.post('/createSubscript', ...stripeHandler.createStripeSubscript)
router.get(
	'/subscriptions/:customerId',
	authWS(),
	...stripeHandler.getSubscriptionsForCust,
)

/**
 * Admin Website
 */

// router.get(
// 	'/admin/subscriptions/:customerId',
// 	auth([]),
// 	stripeController.getSubscriptionsForCustAdmin,
// )

router.post(
	'/portal/:customerId',
	authWS(),
	...stripeHandler.createBillingPortal,
)

export default router
