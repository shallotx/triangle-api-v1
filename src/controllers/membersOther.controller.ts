import { Context } from '../deps.ts'
import { drizzle } from '../deps.ts'
import { and, desc, eq, like, lt, or, sql } from '../deps.ts'
import pgSql from '../db/db.ts'
import { membersOther } from '../db/schema/membersOther.ts'
import { addresses } from '../db/schema/addresses.ts'
import { paymentInfo } from '../db/schema/paymentInfo.ts'
import {
	addressInsert,
	addressInsertSchema,
	memberOtherInsert,
	memberOtherInsertSchema,
	paymentInfoInsert,
	paymentInfoInsertSchema,
} from '../db/schema/zod.ts'

import PeopleService from '../services/people.service.ts'

const getMembersOtherPaged = async (c: Context) => {
	const { rowlimit, startingid, isactive, search } = c.req.query()

	if (!rowlimit || !startingid) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}

	let p_rowlimit = 10
	let p_startingid = 1000000

	const rowlim = parseInt(rowlimit, 10)
	if (Number.isInteger(rowlim)) {
		p_rowlimit = rowlim
	}
	const startId = parseInt(startingid, 10)
	if (Number.isInteger(startId)) {
		p_startingid = startId
	}

	const countSql = sql.empty()
	// countSql.append(sql`SELECT COUNT(*) FROM members_other WHERE 1=1`)
	countSql.append(sql`SELECT CAST(COUNT(*) AS INTEGER) FROM members WHERE 1=1`)

	const finalSql = sql.empty()
	finalSql.append(sql`id < ${p_startingid}`)

	if (typeof isactive != 'undefined') {
		finalSql.append(sql` AND membership_is_active = ${isactive}`)
		countSql.append(sql` AND membership_is_active = ${isactive}`)
	}
	if (typeof search != 'undefined') {
		const searchParam = search + ':*'
		finalSql.append(sql` AND search_vector @@ to_tsquery(${searchParam})`)
		countSql.append(sql` AND search_vector @@ to_tsquery(${searchParam})`)
	}

	try {
		const db = drizzle(pgSql)
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
		})
			.from(membersOther).orderBy(desc(membersOther.id)).limit(p_rowlimit)
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
}

const getMemberOtherById = async (c: Context) => {
	const memberOtherId = parseInt(c.req.param('id'), 10)

	try {
		const db = drizzle(pgSql)
		const result = await db.select().from(membersOther)
			.leftJoin(addresses, eq(membersOther.address_id, addresses.id))
			.leftJoin(
				paymentInfo,
				eq(membersOther.id, paymentInfo.members_other_id),
			)
			.where(eq(membersOther.id, memberOtherId))

		// if (result?.paymentInfo) {
		//   const payId = result?.paymentInfo.id
		//   transRes= await adminDb.select().from(paymentTrans)
		//          .where((eq(paymentTrans.paymentInfoId, payId)))
		//          .orderBy(desc(paymentTrans.paymentDate))
		// }

		c.status(200)

		// const retVal = {members_other: result[0],
		//   addresses: result[0],
		//   // paymentInfo: result?.paymentInfo,
		//   // paymentTrans: transRes
		// }

		return c.json({ memberOther: result[0], status: 'success', result: 1 })
	} catch (error) {
		return c.json(
			{ error },
			400,
		)
	}
}

const createMemberOther = async (c: Context) => {
	const body = await c.req.json()
	const res = memberOtherInsertSchema.safeParse(body.toCreate)

	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const newMemberOther: memberOtherInsert = res.data

	const memberOther = await PeopleService.getMemberOtherByEmail(
		res.data.email,
		true,
	)

	if (typeof memberOther === 'string') {
		return c.json(
			{
				memberOther,
			},
			500,
		)
	}

	if (memberOther) {
		//email already in use in membersother
		c.status(400)
		return c.json({ status: 'failure', message: 'Email already exits' })
	}

	try {
		const db = drizzle(pgSql)
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
		console.log('error', error)
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

const updateMemberOther = async (c: Context) => {
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
		addressId?: number | undefined
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
		const db = drizzle(pgSql)
		await db.transaction(async (tx) => {
			const date = new Date()
			if (weHaveMemberData) {
				await tx.update(membersOther)
					.set({ updated_at: date, ...memberJsonData })
					.where(eq(membersOther.id, memberOtherId))
			}
			if (weHaveAddressData) {
				await tx.update(addresses)
					.set({ updated_at: date, ...addressJsonData })
					.where(eq(addresses.id, addressJsonData.id as number))
			}
			if (weHavePaymentInfoData) {
				await tx.update(paymentInfo)
					.set({ updated_at: date, ...paymentInfoJsonData })
					.where(eq(paymentInfo.id, paymentInfoJsonData.id as number))
			}
		})

		const result = await db.select().from(membersOther)
			.leftJoin(
				paymentInfo,
				eq(membersOther.id, paymentInfo.members_other_id),
			)
			.leftJoin(addresses, eq(membersOther.address_id, addresses.id))
			.where(eq(membersOther.id, memberOtherId))

		return c.json({ memberOther: result[0], status: 'success', results: 1 })
	} catch (error) {
		console.log('error', error)
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

const createMemberOtherAddress = async (c: Context) => {
	const memberOtherId = parseInt(c.req.param('id'), 10)
	const body = await c.req.json()
	const addrRes = addressInsertSchema.safeParse(body.address)
	if (!addrRes.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const newAddress: addressInsert = addrRes.data

	try {
		const db = drizzle(pgSql)
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
		console.log('error', error)
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

const createPaymentInfo = async (c: Context) => {
	const body = await c.req.json()
	const payRes = paymentInfoInsertSchema.safeParse(body.payInfo)
	if (!payRes.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const newPayment: paymentInfoInsert = payRes.data

	try {
		const db = drizzle(pgSql)
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
		console.log('error', error)
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

export default {
	getMembersOtherPaged,
	createMemberOther,
	getMemberOtherById,
	updateMemberOther,
	createMemberOtherAddress,
	createPaymentInfo,
}
