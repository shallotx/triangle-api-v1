// deno-lint-ignore-file
import type { Context } from '@hono/hono'
import { createFactory } from '@hono/hono/factory'
import { Stripe, stripe } from '../deps.ts'
import config from '../config/default.ts'
import {
	donationPaymentSchema,
	productPaymentsSchema,
	type stripePriceType,
	type stripeSubscriptInfoType,
	stripeSubscriptSchema,
	type SubscriptionInfo,
} from '../schema/zod.ts'

// const factory = createFactory<{ Bindings: Bindings }>()
const factory = createFactory()

const createStripeSubscript = factory.createHandlers(async (c: Context) => {
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
			// added 10.10.24 - payment_settings line below. Does this fix payment method issue?
			// 10.15.24 - yes it does!!!!
			payment_settings: {
				save_default_payment_method: 'on_subscription',
			},
			expand: ['latest_invoice.payment_intent'],
		}
	} else {
		subscript = {
			customer: stripeCust.id,
			items: [{
				price: res.data.stripePriceId,
			}],
			payment_behavior: 'default_incomplete',
			payment_settings: {
				save_default_payment_method: 'on_subscription',
			},
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
					subscription.latest_invoice!.payment_intent.client_secret,
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

const getPromotioncodes = factory.createHandlers(async (c: Context) => {
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

const createDonationCheckout = factory.createHandlers(async (c: Context) => {
	const res = donationPaymentSchema.safeParse(await c.req.json())
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

const createProductCheckout = factory.createHandlers(async (c: Context) => {
	const res = productPaymentsSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
	res.data.forEach((el) => {
		lineItems.push({
			price_data: {
				currency: 'usd',
				unit_amount: el.price,
				product_data: {
					name: el.productName,
					images: [el.img_url],
					description: el.productDescript,
				},
			},
			quantity: el.qty,
		})
	})
	try {
		const session = await stripe.checkout.sessions.create({
			success_url: `${config.returnURL}${'success'}`,
			cancel_url: `${config.returnURL}${'cancel'}`,
			mode: 'payment',
			line_items: lineItems,
			payment_intent_data: {
				description: 'Literature/Other Payment',
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

const createBillingPortal = factory.createHandlers(async (c: Context) => {
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

const getSubscriptionsForCust = factory.createHandlers(async (c: Context) => {
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
		if (error) {
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

const getSubscriptionsForCustAdmin = factory.createHandlers(
	async (c: Context) => {
		const custId = c.req.param('customerId')
		// const searchArray = ['all', 'active', 'canceled', 'incomplete']
		// let p_status = 'all'
		// const { status } = c.req.query()
		// if (status && searchArray.includes(status)) {
		// 	p_status = status
		// }
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
				// deno-lint-ignore no-explicit-any
				subscript.items.data.forEach((el: any) => {
					priceInfo = {
						priceId: el.price.id,
						interval: el.price.recurring.interval,
						interval_count: el.price.recurring.interval_count,
						unit_amount: el.price.unit_amount,
					}
				})
				const customer = await stripe.customers.retrieve(custId)
				const paymentMethods = await stripe.customers
					.listPaymentMethods(
						custId,
						{
							limit: 3,
						},
					)

				const custPm = paymentMethods.data[0]
				let custEmail = ''
				if (!customer.deleted) {
					custEmail = customer.email as string
				}
				const sub: stripeSubscriptInfoType = {
					subscriptId: subscript.id,
					customerId: custId,
					customerEmail: custEmail,
					defaultPaymentMethod: subscript
						.default_payment_method as string,
					custPaymentMethod: custPm.id,
					status: subscript.status,
					subscriptCreated: new Date(subscript.created * 1000),
					currPeriodStart: new Date(
						subscript.current_period_start * 1000,
					),
					currPeriodEnd: new Date(
						subscript.current_period_end * 1000,
					),
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
		} catch (error: any) {
			switch (error.type) {
				case 'StripeInvalidRequestError':
					// Invalid parameters were supplied to Stripe's API
					c.status(404)
					return c.json({
						status: 'failure',
						message: `No such Stripe customer ${custId}`,
					})
				case 'StripeAPIError':
					// An error occurred internally with Stripe's API
					break
				case 'StripeConnectionError':
					// Some kind of error occurred during the HTTPS communication
					break
				case 'StripeAuthenticationError':
					// You probably used an incorrect API key
					break
				default:
					// Handle any other types of unexpected errors
					break
			}
			return c.json(
				{
					error,
				},
				500,
			)
		}
	},
)

/**
 * TODO: For adding payment methods to new Subscriptions.
 * TODO: Not sure why we have to do this.
 * TODO: Works in test 6/11/2024, but possibly working in prod?
 */
const updateSubscriptionPaymentMethod = factory.createHandlers(
	async (c: Context) => {
		const subId = c.req.param('subscriptionId')
		const { paymentMethod } = await c.req.json()
		if (!paymentMethod) {
			c.status(400)
			return c.json({ status: 'failure', message: 'Incorrect Data' })
		}
		try {
			await stripe.subscriptions.update(
				subId,
				{
					default_payment_method: paymentMethod,
				},
			)
			c.status(200)
			return c.text('Payment Method Updated!')
		} catch (error) {
			return c.json(
				{
					error,
				},
				500,
			)
		}
	},
)

const processWebhook = factory.createHandlers(async (c: Context) => {
	console.log('we are processing webhook')
	// const { STRIPE_SECRET_API_KEY, STRIPE_WEBHOOK_SECRET  } = env(c)
	const STRIPE_WEBHOOK_SECRET =
		'whsec_e58f4aa75f87c07d39558f1baf9f8251866c11906d757e52b2f6016bd9f9448f'
	const signature = c.req.header('stripe-signature')
	try {
		if (!signature) {
			return c.text('', 400)
		}
		const body = await c.req.text()
		const event = await stripe.webhooks.constructEventAsync(
			body,
			signature,
			STRIPE_WEBHOOK_SECRET as string,
		)
		switch (event.type) {
			case 'customer.subscription.created': {
				console.log(event.data.object)
				break
			}
			case 'customer.subscription.deleted': {
				console.log(event.data.object)
				break
			}
			case 'customer.subscription.updated': {
				console.log(event.data.object)
				break
			}
			default:
				console.log(event.data.object)
				break
		}
		return c.text('', 200)
	} catch (err) {
		const errorMessage = `⚠️  Webhook signature verification failed. ${
			err instanceof Error ? err.message : 'Internal server error'
		}`
		console.log(errorMessage)
		return c.text(errorMessage, 400)
	}
})

const getSubscriptionEvents = factory.createHandlers(async (c: Context) => {
	const { numOfDays } = c.req.query()
	const stripe = new Stripe(config.stripeKey)
	let p_numOfDays = 10
	const parseNumOf = parseInt(numOfDays, 10)
	if (Number.isInteger(parseNumOf)) {
		p_numOfDays = parseNumOf
	}
	const getDaysPastDate = (daysBefore: number, date: any = new Date()) =>
		new Date(date - (1000 * 60 * 60 * 24 * daysBefore))
	// const today = new Date()
	const d = getDaysPastDate(p_numOfDays)
	d.setHours(0, 0, 0, 0)
	// console.log(d)
	try {
		const events = await stripe.events.list({
			limit: 20,
			created: { gte: d.valueOf() / 1000 },
			// created: { gte: d.valueOf() },
			types: [
				'customer.subscription.created',
				'customer.subscription.updated',
				'customer.subscription.deleted',
			],
		})
		const retVal: SubscriptionInfo[] = []
		events.data.forEach((el) => {
			const subInfo = getDataObject(el)
			retVal.push(subInfo)
		})
		c.status(200)
		return c.json({
			events: retVal,
			rowCount: retVal.length,
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

const getDataObject = (event: Stripe.Event) => {
	const date = new Date(event.created * 1000)
	date.setHours(0, 0, 0, 0)
	const subInfo: SubscriptionInfo = {
		eventId: event.id,
		type: event.type,
		eventDate: date,
	}

	switch (event.type) {
		case 'customer.subscription.created': {
			const x = event as Stripe.CustomerSubscriptionCreatedEvent
			subInfo.customer = x.data.object.customer as string
			break
		}
		case 'customer.subscription.updated': {
			const y = event as Stripe.CustomerSubscriptionUpdatedEvent
			subInfo.customer = y.data.object.customer as string
			break
		}
		case 'customer.subscription.deleted': {
			const z = event as Stripe.CustomerSubscriptionDeletedEvent
			subInfo.customer = z.data.object.customer as string
			break
		}
	}
	return subInfo
}

export default {
	createStripeSubscript,
	getPromotioncodes,
	createDonationCheckout,
	createProductCheckout,
	createBillingPortal,
	getSubscriptionsForCust,
	getSubscriptionsForCustAdmin,
	updateSubscriptionPaymentMethod,
	processWebhook,
	getSubscriptionEvents,
}
