import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts'

export const stripePriceSchema = z.object({
	priceId: z.string(),
	interval: z.string(),
	interval_count: z.number(),
	unit_amount: z.number(),
})
export type stripePriceType = z.infer<typeof stripePriceSchema>

const stripeSubscriptInfoSchema = z.object({
	subscriptId: z.string(),
	customerId: z.string(),
	customerEmail: z.string(),
	defaultPaymentMethod: z.string(),
	custPaymentMethod: z.string(),
	status: z.string(),
	subscriptCreated: z.date(),
	currPeriodStart: z.date(),
	currPeriodEnd: z.date(),
	priceInfo: stripePriceSchema,
})
export type stripeSubscriptInfoType = z.infer<typeof stripeSubscriptInfoSchema>

const priceData = z.object({
	unit_amount: z.number(),
	currency: z.string(),
	product: z.string(),
	recurring: z.object({ interval: z.string(), interval_count: z.number() }),
})

export const stripeSubscriptSchema = z.object({
	emailToCreate: z.string(),
	nameToCreate: z.string(),
	priceData: priceData,
	stripePriceId: z.string(),
	promotionCodeId: z.string(),
})

export const stripeCreateCustomerSchema = z.object({
	email: z.string(),
	name: z.string(),
})

export const stripeRenewSubscriptSchema = z.object({
	priceData: priceData,
	stripeCustId: z.string(),
	stripePriceId: z.string(),
	promotionCodeId: z.string(),
})

export const productPaymentSchema = z.object({
	price: z.number(),
	qty: z.number(),
	img_url: z.string(),
	productDescript: z.string(),
	payIntentDescript: z.string(),
	productName: z.string(),
	stripeProduct: z.string(),
})

export const productPaymentsSchema = z.array(productPaymentSchema)

export const donationPaymentSchema = z.object({
	amount: z.number(),
	stripeProduct: z.string(),
	custEmail: z.string(),
	custName: z.string(),
	donationcode: z.string(),
	description: z.string(),
})

export const loginSchema = z.object({
	email: z.string(),
	password: z.string(),
})

export const rolesSchema = z.object({
	id: z.number(),
	roleName: z.string(),
})
export type rolesType = z.infer<typeof rolesSchema>

export const passwordSchema = z.object({
	email: z.string(),
	oldPassword: z.string(),
	newPassword: z.string(),
})

export const emailSchema = z.object({
	email: z.string(),
	name: z.string(),
	text: z.string(),
})

export type emailType = z.infer<typeof emailSchema>

export const emailSendSchema = emailSchema.extend({
	subject: z.string(),
	from: z.string(),
	html: z.string(),
})

export type emailSend = z.infer<typeof emailSendSchema>

export const memberInsertSchema = z.object({
	firstname: z.string(),
	lastname: z.string(),
	password: z.string(),
	phone: z.string().optional(),
	email: z.string(),
	is_volunteer: z.boolean(),
	membership_is_active: z.boolean(),
	stripe_cust_id: z.string().optional(),
	notes: z.string().optional(),
})
export type memberInsert = z.infer<typeof memberInsertSchema>

export const memberOtherInsertSchema = z.object({
	firstname: z.string(),
	lastname: z.string(),
	phone: z.string().optional(),
	email: z.string(),
	is_volunteer: z.boolean(),
	membership_is_active: z.boolean(),
	notes: z.string().optional(),
	address: z.number().optional(),
})
export type memberOtherInsert = z.infer<typeof memberOtherInsertSchema>

export const memberOtherUpdateStatusSchema = z.object({
	updated_by_id: z.number(),
	updateReason: z.string(),
	currentStatus: z.boolean(),
})
export type memberOtherUpdateStatus = z.infer<
	typeof memberOtherUpdateStatusSchema
>

export const addressInsertSchema = z.object({
	address1: z.string(),
	address2: z.string().optional(),
	city: z.string(),
	state: z.string(),
	country: z.string(),
	zip: z.string(),
})

export type addressInsert = z.infer<typeof addressInsertSchema>

export const paymentInfoInsertSchema = z.object({
	payment_method: z.string(),
	next_due_text: z.string().optional(),
	note: z.string().optional(),
	members_other_id: z.number(),
})

export type paymentInfoInsert = z.infer<typeof paymentInfoInsertSchema>

export const paymentInsertSchema = z.object({
	pay_amount: z.number(),
	last_pay_date: z.number(),
	note: z.string().optional(),
	payment_info_id: z.number(),
})

export type paymentInsert = z.infer<typeof paymentInsertSchema>

export const adminUserInsertSchema = z.object({
	firstname: z.string(),
	lastname: z.string(),
	email: z.string(),
	phone: z.string().optional(),
	password: z.string(),
	notes: z.string().optional(),
})
export type adminUserInsert = z.infer<typeof adminUserInsertSchema>

export const adminUserWithRolesSchema = z.object({
	id: z.number(),
	firstname: z.string(),
	lastname: z.string(),
	phone: z.string().optional(),
	email: z.string(),
	is_super: z.boolean(),
	is_active: z.boolean(),
	notes: z.string().optional(),
	roles: z.array(rolesSchema).optional(),
})
export type adminUserWithRoles = z.infer<typeof adminUserWithRolesSchema>

export interface HashResult {
	hash: string
	salt: string
}

export interface EmailSend {
	emailTo: string
	emailFrom: string
	subject: string
	textBody?: string
	htmlBody?: string
}

export interface SubscriptionInfo {
	eventId: string
	type: string
	stripeCustomer?: string
	eventDate: Date
	member: {
		id: number
		firstname: string
		lastname: string
		email: string
	}
}
