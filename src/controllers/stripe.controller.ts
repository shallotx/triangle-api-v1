import { Context } from '../deps.ts'
import { stripe } from '../deps.ts'
import StripeService from '../services/stripe.service.ts'
import { donationSchema } from '../db/schema/zod.ts'
import {
	stripePriceType,
	stripeSubscriptInfoType,
	stripeSubscriptSchema,
} from '../db/schema/zod.ts'
import config from '../config/default.ts'

const getPromotionCodes = async (c: Context) => {
	try {
		const promotionCodes = await stripe.promotionCodes.list({
			active: true,
			limit: 3,
		})
		c.status(200)
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
			500,
		)
	}
}

const createDonationCheckout = async (c: Context) => {
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
}

const createStripeSubscript = async (c: Context) => {
	const res = stripeSubscriptSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	// we have already checked on the client that email DOES not exist in members table

	//create stripe customer

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
		// Create a new Stripe subscription
		const subscription = await stripe.subscriptions.create(subscript)
		c.status(200)

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
}

const createPortalSession = async (c: Context) => {
	console.log('we qre here')
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
}

const getSubscriptionsForCustAdmin = async (c: Context) => {
	//Used by Triangle Admin
	const searchArray = ['all', 'active', 'canceled', 'incomplete']
	let p_status = 'all'
	const { status } = c.req.query()
	const custId = c.req.param('customerId')
	if (status && searchArray.includes(status)) {
		p_status = status
	}

	const stripeSubscriptInfoLst: stripeSubscriptInfoType[] = []
	let subCount = 0
	let priceInfo: stripePriceType = {
		priceId: '',
		interval: '',
		interval_count: 0,
		unit_amount: 0,
	}
	try {
		for await (
			const subscript of stripe.subscriptions.list(
				{ limit: 3, customer: custId, status: 'all' },
			)
		) {
			subCount++
			subscript.items.data.forEach((el: any) => {
				priceInfo = {
					priceId: el.price.id,
					interval: el.price.recurring.interval,
					interval_count: el.price.recurring.interval_count,
					unit_amount: el.price.unit_amount,
				}
			})
			const customer = await stripe.customers.retrieve(custId)
			let custEmail = ''
			if (!customer.deleted) {
				custEmail = customer.email as string
			}
			const sub: stripeSubscriptInfoType = {
				subscriptId: subscript.id,
				customerId: custId,
				customerEmail: custEmail,
				status: subscript.status,
				currPeriodStart: new Date(
					subscript.current_period_start * 1000,
				),
				currPeriodEnd: new Date(subscript.current_period_end * 1000),
				created: new Date(subscript.created * 1000),
				priceInfo: priceInfo,
			}
			stripeSubscriptInfoLst.push(sub)
		}
		c.status(200)
		return c.json({
			subscripts: stripeSubscriptInfoLst,
			status: 'success',
			count: subCount,
		})
	} catch (error) {
		return c.json(
			{
				error,
			},
			500,
		)
	}
}

const getSubscriptionsForCust = async (c: Context) => {
	//Used by Triangle Website
	const custId = c.req.param('customerId')
	try {
		const subscripts = await StripeService.getStripeSubscriptsByCustId(
			custId,
		)

		if (typeof subscripts === 'string') { //means there was error
			if (subscripts.startsWith('No such customer')) {
				c.status(404)
				return c.json({
					status: 'failure',
					message: `No such Stripe customer ${custId}`,
				})
			} else {
				return c.json(
					{
						subscripts,
					},
					500,
				)
			}
		}

		c.status(200)
		return c.json({
			subscripts: subscripts.data,
			status: 'success',
			results: subscripts.data.length,
		})
	} catch (error) {
		return c.json(
			{
				error,
			},
			500,
		)
	}
}

export default {
	getPromotionCodes,
	createDonationCheckout,
	createPortalSession,
	createStripeSubscript,
	getSubscriptionsForCustAdmin,
	getSubscriptionsForCust,
}
