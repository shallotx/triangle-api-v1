import { createFactory } from '@hono/hono/factory'
import { stripe } from '../deps.ts'
import config from '../config/default.ts'
import { donationSchema,stripeSubscriptSchema } from '../db/schema/zod.ts'

const factory = createFactory()

const createStripeSubscript = factory.createHandlers(async (c) => {
	const res = stripeSubscriptSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	// we have already checked on the client that email DOES not exist in members table

	//create stripe customer
	// deno-lint-ignore no-explicit-any
	let stripeCust: any = {}
	try {
		// Create a new Stripe customer object
		stripeCust = await stripe.customers.create({
			email: res.data.emailToCreate,
			name: res.data.nameToCreate,
		})
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
	//create stripe subscription
	// deno-lint-ignore no-explicit-any
	let subscript: any = {}
	if (res.data.priceData) {
		subscript = {
			customer: stripeCust.id,
			items: [{
				price_data: {
					unit_amount: res.data.priceData.unit_amount,
					currency: 'usd',
					product: res.data.priceData.product,
					recurring: res.data.priceData.recurring,
				},
			}],
			payment_behavior: 'default_incomplete',
			expand: ['latest_invoice.payment_intent'],
		}
	} else {
		subscript = {
			customer: stripeCust.id,
			items: [{
				price: res.data.stripePriceId,
			}],
			payment_behavior: 'default_incomplete',
			expand: ['latest_invoice.payment_intent'],
		}
	}
	if (res.data.promotionCodeId && res.data.promotionCodeId.length > 3) {
		subscript.promotion_code = res.data.promotionCodeId
	}

	try {
		const subscription = await stripe.subscriptions.create(subscript)
		return c.json({
			data: {
				stripeCustId: stripeCust.id,
				subscriptionId: subscription.id,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore ignore for some Stripe ts thing with payment intnent
				clientSecret:
					subscription.latest_invoice.payment_intent.client_secret,
			},
			status: 'success',
			results: 1,
		})
	} catch (error) {
		return c.json(
			{
				error,
			},
			500,
		)
	}
})

const getPromotioncodes = factory.createHandlers(async (c) => {
	try {
		const promotionCodes = await stripe.promotionCodes.list({
			active: true,
			limit: 3,
		})
		return c.json({
			promotionCodes: promotionCodes.data,
			status: 'success',
			results: 3,
		})
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

const createDonationCheckout = factory.createHandlers(async (c) => {
	const res = donationSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	try {
		const session = await stripe.checkout.sessions.create({
			success_url: `${config.returnURL}${'success'}`,
			cancel_url: `${config.returnURL}${'cancel'}`,
			customer_email: res.data.custEmail,
			mode: 'payment',
			line_items: [
				{
					price_data: {
						currency: 'usd',
						unit_amount: res.data.amount,
						product: res.data.stripeProduct,
					},
					quantity: 1,
				},
			],
			payment_intent_data: {
				description: res.data.description,
				metadata: {
					donation_code: res.data.donationcode,
					customer_email: res.data.custEmail,
					customer_name: res.data.custName,
				},
			},
		})
		c.status(200)
		return c.json({ sessionId: session.id, status: 'success', results: 1 })
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

const createBillingPortal = factory.createHandlers(async (c) => {
	const custId = c.req.param('customerId')
	try {
		const session = await stripe.billingPortal.sessions.create({
			customer: custId,
			return_url: `${config.returnURL}${'membership/portalReturn'}`,
		})
		c.status(200)
		return c.json({ url: session.url, status: 'success', results: 1 })
	} catch (error) {
		return c.json(
			{
				error,
			},
			500,
		)
	}
})

const getSubscriptionsForCust = factory.createHandlers(async (c) => {
	const custId = c.req.param('customerId')
	const statusFilter = 'all'
	try {
		const subscripts = await stripe.subscriptions.list({
			limit: 5,
			status: statusFilter,
			customer: custId,
		})
		c.status(200)
		return c.json({
			subscripts: subscripts.data,
			status: 'success',
			results: subscripts.data.length,
		})
	} catch (error) {
		if (error.raw.message) {
			c.status(404)
			return c.json({
				status: 'failure',
				message: `No such Stripe customer ${custId}`,
			})
		} else {
			return c.json(
				{
					error,
				},
				500,
			)
		}
	}
})

export default {
	createStripeSubscript,
	getPromotioncodes,
	createDonationCheckout,
	createBillingPortal,
	getSubscriptionsForCust,
}
