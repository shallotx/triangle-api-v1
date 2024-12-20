import type { Context } from '@hono/hono'
import { createFactory } from '@hono/hono/factory'
import { drizzle } from 'drizzle-orm/neon-http'
import { desc, eq, /* inArray, */ sql } from 'drizzle-orm'
import { neon } from '@neon/serverless'
import config from '../config/default.ts'
import { membersOther } from '../schema/membersOther.ts'
import { addresses } from '../schema/address.ts'
import { paymentInfo } from '../schema/payment.ts'
import { /* type Payment, */ payment } from '../schema/payment.ts'
import { membersOtherTrans } from '../schema/membersOther.ts'
// import * as schema from'../schema/membersOther.ts'

import {
	type addressInsert,
	addressInsertSchema,
	type memberOtherInsert,
	memberOtherInsertSchema,
	type memberOtherUpdateStatus,
	memberOtherUpdateStatusSchema,
	type paymentInfoInsert,
	paymentInfoInsertSchema,
	type paymentInsert,
	paymentInsertSchema,
} from '../schema/zod.ts'

const factory = createFactory()

/**
 ** Admin Website
 */
const getMembersOtherPaged = factory.createHandlers(async (c: Context) => {
	const { rowlimit, startingid, isactive, search } = c.req.query()

	if (!rowlimit || !startingid) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	let p_rowlimit = 10
	let p_startingid = 1000000
	let p_active = false

	const rowlim = parseInt(rowlimit, 10)
	if (Number.isInteger(rowlim)) {
		p_rowlimit = rowlim
	}
	const startId = parseInt(startingid, 10)
	if (Number.isInteger(startId)) {
		p_startingid = startId
	}

	const countSql = sql.empty()
	countSql.append(
		sql`SELECT CAST(COUNT(*) AS INTEGER) FROM members WHERE 1=1`,
	)

	const finalSql = sql.empty()
	finalSql.append(sql`id < ${p_startingid}`)

	if (typeof isactive != 'undefined') {
		if (isactive === 'true') {
			p_active = true
		}
		finalSql.append(sql` AND membership_is_active = ${p_active}`)
		countSql.append(sql` AND membership_is_active = ${p_active}`)
	}

	if (typeof search != 'undefined') {
		const searchParam = search + ':*'
		finalSql.append(sql` AND search_vector @@ to_tsquery(${searchParam})`)
		countSql.append(sql` AND search_vector @@ to_tsquery(${searchParam})`)
	}

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		//get row count
		const res = await db.execute(countSql)
		const rowCount = res[0].count
		const result = await db.select({
			id: membersOther.id,
			firstname: membersOther.firstname,
			lastname: membersOther.lastname,
			phone: membersOther.phone,
			email: membersOther.email,
			is_volunteer: membersOther.is_volunteer,
			membership_is_active: membersOther.membership_is_active,
			notes: membersOther.notes,
		}).from(membersOther).orderBy(desc(membersOther.id)).limit(p_rowlimit)
			.where(finalSql)

		let lastId = 0
		if (result.length > 0) {
			lastId = result[result.length - 1].id
		}
		return c.json({
			membersOther: result,
			status: 'success',
			lastId: lastId,
			rowCount: rowCount,
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

const getMemberOtherById = factory.createHandlers(async (c: Context) => {
	const memberOtherId = parseInt(c.req.param('id'), 10)

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const result = await db.select()
			.from(membersOther)
			.leftJoin(addresses, eq(membersOther.address_id, addresses.id))
			.leftJoin(
				paymentInfo,
				eq(membersOther.id, paymentInfo.members_other_id),
			)
			.where(eq(membersOther.id, memberOtherId))
		let paymentsResp = [{}]
		if (result[0].payment_info) {
			const payId = result[0].payment_info.id
			paymentsResp = await db.select().from(payment)
				.where(eq(payment.payment_info_id, payId))
				.orderBy(desc(payment.last_pay_date))
		}
		c.status(200)

		const retVal = {
			members_other: result[0].members_other,
			addresses: result[0].addresses,
			paymentInfo: result[0].payment_info,
			payments: paymentsResp,
		}
		return c.json({
			memberOther: retVal,
			status: 'success',
			results: 1,
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

const createMemberOther = factory.createHandlers(async (c: Context) => {
	const body = await c.req.json()
	const res = memberOtherInsertSchema.safeParse(body.toCreate)
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const newMemberOther: memberOtherInsert = res.data
	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const inserted = await db.insert(membersOther)
			.values({
				firstname: newMemberOther.firstname,
				lastname: newMemberOther.lastname,
				phone: newMemberOther.phone,
				email: newMemberOther.email,
				is_volunteer: newMemberOther.is_volunteer,
				membership_is_active: newMemberOther.membership_is_active,
				notes: newMemberOther.notes,
			}).returning()

		c.status(200)
		return c.json({ newMember: inserted[0], status: 'success', results: 1 })
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

const deleteMemberOther = factory.createHandlers(async (c: Context) => {
	const memberOtherId = parseInt(c.req.param('id'), 10)
	if (!memberOtherId) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Id is required' })
	}

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const paymentInfoRes = await db.select().from(paymentInfo)
			.where(eq(paymentInfo.members_other_id, memberOtherId))
		const memberOtherRes = await db.select().from(membersOther)
			.where(eq(membersOther.id, memberOtherId))
		await db.transaction(async (tx) => {
			await tx.delete(membersOtherTrans).where(
				eq(membersOtherTrans.members_other_id, memberOtherId),
			)
			if (paymentInfoRes[0]) {
				await tx.delete(payment).where(
					eq(payment.payment_info_id, paymentInfoRes[0].id),
				)
			}
			await tx.delete(paymentInfo).where(
				eq(paymentInfo.members_other_id, memberOtherId),
			)
			await tx.delete(membersOther).where(
				eq(membersOther.id, memberOtherId),
			)
			if (memberOtherRes[0].address_id) {
				await db.delete(addresses).where(
					eq(addresses.id, memberOtherRes[0].address_id),
				)
			}
		})

		c.status(200)
		return c.text('Member successfully deleted')
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

const createMemberOtherAddress = factory.createHandlers(async (c: Context) => {
	const memberOtherId = parseInt(c.req.param('id'), 10)
	const body = await c.req.json()
	const addrRes = addressInsertSchema.safeParse(body.address)
	if (!addrRes.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const newAddress: addressInsert = addrRes.data

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const addr = await db.insert(addresses).values(
			{
				address1: newAddress.address1,
				address2: newAddress.address2,
				city: newAddress.city,
				state: newAddress.state,
				country: newAddress.country,
				zip: newAddress.zip,
				is_active: true,
			},
		).returning()

		await db.update(membersOther)
			.set({ updated_at: new Date(), address_id: addr[0].id })
			.where(eq(membersOther.id, memberOtherId))
		c.status(200)
		return c.json({ newAddress: addr[0], status: 'success', results: 1 })
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})
const createPaymentInfo = factory.createHandlers(async (c: Context) => {
	const body = await c.req.json()
	const payRes = paymentInfoInsertSchema.safeParse(body.payInfo)
	if (!payRes.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const newPayment: paymentInfoInsert = payRes.data

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const payInfo = await db.insert(paymentInfo).values(
			{
				members_other_id: newPayment.members_other_id,
				payment_method: newPayment.payment_method,
				next_due_text: newPayment.next_due_text,
				note: newPayment.note,
			},
		).returning()

		c.status(200)
		return c.json({
			newPaymentInfo: payInfo[0],
			status: 'success',
			results: 1,
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

const createPayment = factory.createHandlers(async (c: Context) => {
	const body = await c.req.json()
	const payRes = paymentInsertSchema.safeParse(body.payment)

	if (!payRes.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	const newPayment: paymentInsert = payRes.data

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		await db.insert(payment).values(
			{
				pay_amount: newPayment.pay_amount,
				last_pay_date: newPayment.last_pay_date,
				note: newPayment.note,
				payment_info_id: newPayment.payment_info_id,
			},
		)

		const payments = await db.select().from(payment)
			.where(eq(payment.payment_info_id, newPayment.payment_info_id))
			.orderBy(desc(payment.last_pay_date))
		c.status(200)

		return c.json({
			payments: payments,
			status: 'success',
			results: 1,
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

const updatePayment = factory.createHandlers(async (c: Context) => {
	const body = await c.req.json()
	const payRes = paymentInsertSchema.safeParse(body.payment)
	const paymentId = parseInt(c.req.param('id'), 10)

	if (!payRes.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	const updatePayment: paymentInsert = payRes.data

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })

		await sql(`UPDATE payment SET pay_amount = ${updatePayment.pay_amount}, 
							 last_pay_date = ${updatePayment.last_pay_date},
							  note = ${updatePayment.note}
							where id = ${paymentId}`)
		const payments = await db.select().from(payment)
			.where(eq(payment.payment_info_id, updatePayment.payment_info_id))
			.orderBy(desc(payment.last_pay_date))

		c.status(200)

		return c.json({
			payments: payments,
			status: 'success',
			results: 1,
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

const deletePayment = factory.createHandlers(async (c: Context) => {
	const paymentId = parseInt(c.req.param('id'), 10)
	if (!paymentId) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Id is required' })
	}
	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		await db.delete(payment).where(eq(payment.id, paymentId))
		c.status(200)
		return c.text('Payment successfully deleted')
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

const updateMemberOther = factory.createHandlers(async (c: Context) => {
	const body = await c.req.json()
	const memberOtherId = parseInt(c.req.param('id'), 10)
	if (!memberOtherId) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Id is required' })
	}
	const memberJsonData: {
		firstname?: string | undefined
		lastname?: string | undefined
		phone?: string | undefined
		email?: string | undefined
		is_volunteer?: boolean | undefined
		membership_is_active?: boolean | undefined
		notes?: string | undefined
		address?: number | undefined
	} = await body.member
	const addressJsonData: {
		id?: number | undefined
		address1?: string | undefined
		address2?: string | undefined
		city?: string | undefined
		state?: string | undefined
		country?: string | undefined
		zip?: string | undefined
	} = await body.address
	const paymentInfoJsonData: {
		id?: number | undefined
		payment_method?: string | undefined
		next_due_text?: string | undefined
		note?: string | undefined
	} = await body.payInfo

	const weHaveMemberData = Object.keys(memberJsonData).length ? true : false
	const weHaveAddressData = Object.keys(addressJsonData).length ? true : false
	const weHavePaymentInfoData = Object.keys(paymentInfoJsonData).length
		? true
		: false

	if (!weHaveMemberData && !weHaveAddressData && !weHavePaymentInfoData) {
		return c.json({
			status: 'failure',
			message: 'No data is being updated!',
		})
	}

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		const date = new Date()
		if (weHaveMemberData) {
			await db.update(membersOther)
				.set({ updated_at: date, ...memberJsonData })
				.where(eq(membersOther.id, memberOtherId))
		}
		if (weHaveAddressData) {
			await db.update(addresses)
				.set({ updated_at: date, ...addressJsonData })
				.where(eq(addresses.id, addressJsonData.id as number))
		}
		if (weHavePaymentInfoData) {
			await db.update(paymentInfo)
				.set({ updated_at: date, ...paymentInfoJsonData })
				.where(eq(paymentInfo.id, paymentInfoJsonData.id as number))
		}

		const result = await db.select().from(membersOther)
			.leftJoin(
				paymentInfo,
				eq(membersOther.id, paymentInfo.members_other_id),
			)
			.leftJoin(addresses, eq(membersOther.address_id, addresses.id))
			.where(eq(membersOther.id, memberOtherId))

		let paymentsResp = [{}]
		if (result[0].payment_info) {
			const payId = result[0].payment_info.id
			paymentsResp = await db.select().from(payment)
				.where(eq(payment.payment_info_id, payId))
				.orderBy(desc(payment.last_pay_date))
		}

		c.status(200)
		const retVal = {
			members_other: result[0].members_other,
			addresses: result[0].addresses,
			paymentInfo: result[0].payment_info,
			payments: paymentsResp,
		}

		return c.json({ memberOther: retVal, status: 'success', results: 1 })
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

const updateMemberOtherStatus = factory.createHandlers(async (c: Context) => {
	const body = await c.req.json()
	const memberOtherId = parseInt(c.req.param('id'), 10)
	if (!memberOtherId) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Id is required' })
	}

	const res = memberOtherUpdateStatusSchema.safeParse(body.statusChangeDTO)
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const newUpdateStatus: memberOtherUpdateStatus = res.data

	try {
		const sql = neon(config.dbURL)
		const db = drizzle({ client: sql })
		await db.update(membersOther)
			.set({
				updated_at: new Date(),
				membership_is_active: !newUpdateStatus.currentStatus,
			})
			.where(eq(membersOther.id, memberOtherId))

		await db.insert(membersOtherTrans).values({
			members_other_id: memberOtherId,
			updated_by_id: newUpdateStatus.updated_by_id,
			update_status_to: !newUpdateStatus.currentStatus,
			update_reason: newUpdateStatus.updateReason,
		})

		const result = await db.select().from(membersOther)
			.where(eq(membersOther.id, memberOtherId))

		return c.json({ memberOther: result[0], status: 'success', results: 1 })
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
})

export default {
	getMembersOtherPaged,
	getMemberOtherById,
	createMemberOther,
	deleteMemberOther,
	createMemberOtherAddress,
	createPaymentInfo,
	createPayment,
	updatePayment,
	deletePayment,
	updateMemberOther,
	updateMemberOtherStatus,
}
