import {
	AdminUserKV,
	Discussion_Type,
	Donation_Code,
	Links,
	Meeting_Type,
	Product,
	Virtual_Meeting,
} from '../db/schema/kv/kv.models.ts'
import { adminUserInsert } from '../db/schema/zod.ts'
import { HTTPException } from '../deps.ts'

/*
  KV on Deno Deploy KV on Deno Deploy
 */

//const kv = await Deno.openKv();

/*
  KV on Deno Deploy KV on Deno Deploy for local dev
 */
Deno.env.set('DENO_KV_ACCESS_TOKEN', 'ddp_cVASLZzvhwQfIbd7ZrHuj1yeKPmROn1eLm7e')
const kv = await Deno.openKv(
	'https://api.deno.com/databases/62ce7b32-d1c9-4095-91c6-6399581aef77/connect',
)

class KVUtilityService {
	/*
     Discussion Types
  */
	public static async seedDiscussionTypes(): Promise<boolean | string> {
		const dt1: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'OD',
			is_active: true,
			name: 'Discussion',
		}
		const dt2: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'CD',
			is_active: true,
			name: 'Closed Discussion',
		}
		const dt3: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'C12',
			is_active: true,
			name: 'Closed 12 Step Study',
		}
		const dt4: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'OB',
			is_active: true,
			name: 'Open Big Book Study',
		}
		const dt5: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'CB',
			is_active: true,
			name: 'Closed Big Book Study',
		}
		const dt6: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'BG',
			is_active: true,
			name: 'Beginner',
		}
		const dt7: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'O12',
			is_active: true,
			name: 'Open 12 Step Study',
		}
		const dt8: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'OM',
			is_active: true,
			name: 'Open Men Only',
		}
		const dt9: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'OW',
			is_active: true,
			name: 'Open Women Only',
		}
		const dt10: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'OWB',
			is_active: true,
			name: 'Open Women Only Big Book',
		}
		const dt11: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'OMB',
			is_active: true,
			name: 'Open Men Only Big Book',
		}
		const dt12: Discussion_Type = {
			id: crypto.randomUUID(),
			code: 'OS',
			is_active: true,
			name: 'Open Speaker',
		}
		try {
			await this.deleteAllDiscussionTypes()

			await this.insertDiscussionType(dt1)
			await this.insertDiscussionType(dt2)
			await this.insertDiscussionType(dt3)
			await this.insertDiscussionType(dt4)
			await this.insertDiscussionType(dt5)
			await this.insertDiscussionType(dt6)
			await this.insertDiscussionType(dt7)
			await this.insertDiscussionType(dt8)
			await this.insertDiscussionType(dt9)
			await this.insertDiscussionType(dt10)
			await this.insertDiscussionType(dt11)
			await this.insertDiscussionType(dt12)
			return true
		} catch (error) {
			return error as string
		}
	}

	static async insertDiscussionType(dt: Discussion_Type) {
		const primaryKey = ['discussion_types', dt.id]
		const byCodeKey = ['discussion_types_by_code', dt.code]
		const res = await kv.atomic()
			.check({ key: primaryKey, versionstamp: null })
			.check({ key: byCodeKey, versionstamp: null })
			.set(primaryKey, dt)
			.set(byCodeKey, dt)
			.commit()
		if (!res.ok) {
			console.log('error', dt)
			throw new TypeError(
				'Discussion Type with ID or code already exists',
			)
		}
	}
	static async deleteAllDiscussionTypes() {
		for await (const res of kv.list({ prefix: ['discussion_types'] })) {
			const mt = res.value as Discussion_Type
			this.deleteDiscussionType(mt.id)
		}
	}
	static async deleteDiscussionType(id: string) {
		let res = { ok: false }
		while (!res.ok) {
			const getRes = await kv.get<Discussion_Type>([
				'discussion_types',
				id,
			])
			if (getRes.value === null) return
			res = await kv.atomic()
				.check(getRes)
				.delete(['discussion_types', id])
				.delete(['discussion_types_by_code', getRes.value.code])
				.commit()
		}
	}
	/*
     Meeting Types
  */
	public static async seedMeetingTypes(): Promise<boolean | string> {
		const mt1: Meeting_Type = {
			id: crypto.randomUUID(),
			code: 'AA',
			is_active: true,
			name: 'Alcoholics Anonymous',
		}
		const mt2: Meeting_Type = {
			id: crypto.randomUUID(),
			code: 'Al-Anon',
			is_active: true,
			name: 'Al-Anon',
		}
		const mt3: Meeting_Type = {
			id: crypto.randomUUID(),
			code: 'CMA',
			is_active: true,
			name: 'Crystal Meth Anonymous',
		}
		const mt4: Meeting_Type = {
			id: crypto.randomUUID(),
			code: 'CODA',
			is_active: true,
			name: 'CODA',
		}
		const mt5: Meeting_Type = {
			id: crypto.randomUUID(),
			code: 'HA',
			is_active: true,
			name: 'Heroin Anonymous',
		}
		const mt6: Meeting_Type = {
			id: crypto.randomUUID(),
			code: 'MA',
			is_active: true,
			name: 'Marijuana Anonymous',
		}
		const mt7: Meeting_Type = {
			id: crypto.randomUUID(),
			code: 'CA',
			is_active: true,
			name: 'Cocaine Anonymous',
		}
		const mt8: Meeting_Type = {
			id: crypto.randomUUID(),
			code: 'ACA',
			is_active: true,
			name: 'Adult Children of Alcoholics',
		}
		const mt9: Meeting_Type = {
			id: crypto.randomUUID(),
			code: 'NA',
			is_active: true,
			name: 'Narcotics Anonymous',
		}
		const mt10: Meeting_Type = {
			id: crypto.randomUUID(),
			code: 'OA',
			is_active: true,
			name: 'Overeaters Anonymous',
		}
		try {
			this.deleteAllMeetingTypes()

			await this.insertMeetingType(mt1)
			await this.insertMeetingType(mt2)
			await this.insertMeetingType(mt3)
			await this.insertMeetingType(mt4)
			await this.insertMeetingType(mt5)
			await this.insertMeetingType(mt6)
			await this.insertMeetingType(mt7)
			await this.insertMeetingType(mt8)
			await this.insertMeetingType(mt9)
			await this.insertMeetingType(mt10)
			return true
		} catch (error) {
			return error as string
		}
	}

	static async insertMeetingType(mt: Meeting_Type) {
		const primaryKey = ['meeting_types', mt.id]
		const byCodeKey = ['meeting_types_by_code', mt.code]
		const res = await kv.atomic()
			.check({ key: primaryKey, versionstamp: null })
			.check({ key: byCodeKey, versionstamp: null })
			.set(primaryKey, mt)
			.set(byCodeKey, mt)
			.commit()
		if (!res.ok) {
			console.log('error', mt)
			throw new TypeError('Meeting Type with ID or code already exists')
		}
	}
	static async deleteAllMeetingTypes() {
		for await (const res of kv.list({ prefix: ['meeting_types'] })) {
			const mt = res.value as Donation_Code
			this.deleteMeetingType(mt.id)
		}
	}
	static async deleteMeetingType(id: string) {
		let res = { ok: false }
		while (!res.ok) {
			const getRes = await kv.get<Meeting_Type>(['meeting_types', id])
			if (getRes.value === null) return
			res = await kv.atomic()
				.check(getRes)
				.delete(['meeting_types', id])
				.delete(['meeting_types_by_code', getRes.value.code])
				.commit()
		}
	}

	/*
     Virtual Meetings
  */
	public static async seedVirtualMeetings(): Promise<boolean | string> {
		for await (const res of kv.list({ prefix: ['virtual_meetings'] })) {
			const vm = res.value as Virtual_Meeting
			await kv.delete(['virtual_meetings', vm.id])
		}

		const vm1: Virtual_Meeting = {
			id: crypto.randomUUID(),
			name: 'Triangle Sunday Morning',
			note: 'Meeting ID: 385 376 1941, Passcode: Bill',
			href:
				'https://us06web.zoom.us/j/3853761941?pwd=ZVlobWlhRWFqR01QaS9INS9zTWFUdz09',
			meeting_time: '9:30 am',
			is_active: true,
		}
		const vm2: Virtual_Meeting = {
			id: crypto.randomUUID(),
			name: 'Early Bird Womens',
			note: 'Closed meeting, 7 days a week',
			href:
				'https://us06web.zoom.us/j/9676187792?pwd=T05jeHNFZGJQZFVBYXV1bm1qMTFoZz09',
			meeting_time: '7:30 am',
			is_active: true,
		}
		try {
			await kv.set(['virtual_meetings', vm1.id], vm1)
			await kv.set(['virtual_meetings', vm2.id], vm2)

			return true
		} catch (error) {
			return error as string
		}
	}

	/*
     Links
  */
	public static async seedLinks(): Promise<boolean | string> {
		for await (const res of kv.list({ prefix: ['recovery_links'] })) {
			const ln = res.value as Virtual_Meeting
			await kv.delete(['recovery_links', ln.id])
		}

		const mt1: Links = {
			id: crypto.randomUUID(),
			link_type: 'literature',
			href:
				'https://www.aa.org/pages/en_US/twelve-steps-and-twelve-traditions',
			name: '12 and 12',
		}
		const mt2: Links = {
			id: crypto.randomUUID(),
			link_type: 'twelvestep',
			href: 'https://www.aa.org',
			name: 'AA',
		}
		const mt3: Links = {
			id: crypto.randomUUID(),
			link_type: 'literature',
			href: 'https://www.aa.org/pages/en_US/alcoholics-anonymous',
			name: 'AA Big Book',
		}
		const mt4: Links = {
			id: crypto.randomUUID(),
			link_type: 'twelvestep',
			href: 'http://www.ca.org',
			name: 'Cocaine Anonymous',
		}
		const mt5: Links = {
			id: crypto.randomUUID(),
			link_type: 'twelvestep',
			href: 'http://www.debtorsanonymous.org',
			name: 'Debtors Anonymous',
		}
		const mt6: Links = {
			id: crypto.randomUUID(),
			link_type: 'twelvestep',
			href: 'http://www.marijuana-anonymous.org',
			name: 'Marijuana Anonymous',
		}
		const mt7: Links = {
			id: crypto.randomUUID(),
			link_type: 'twelvestep',
			href: 'http://www.na.org',
			name: 'Narcotics Anonymous',
		}
		const mt8: Links = {
			id: crypto.randomUUID(),
			link_type: 'twelvestep',
			href: 'https://atlantaaa.org',
			name: 'AA - Atlanta',
		}
		try {
			await kv.set(['recovery_links', mt1.id], mt1)
			await kv.set(['recovery_links', mt2.id], mt2)
			await kv.set(['recovery_links', mt3.id], mt3)
			await kv.set(['recovery_links', mt4.id], mt4)
			await kv.set(['recovery_links', mt5.id], mt5)
			await kv.set(['recovery_links', mt6.id], mt6)
			await kv.set(['recovery_links', mt7.id], mt7)
			await kv.set(['recovery_links', mt8.id], mt8)
			return true
		} catch (error) {
			return error as string
		}
	}
	/*
     Donation Codes
  */

	public static async seedDonationCodes(): Promise<boolean | string> {
		const dc1: Donation_Code = {
			id: crypto.randomUUID(),
			name: '11TH Step',
			is_active: true,
			code: '11THSTEP',
			notes: '',
		}
		const dc2: Donation_Code = {
			id: crypto.randomUUID(),
			name: '5:45 Attitude Adjustment',
			is_active: true,
			code: 'ATTITUDE',
			notes: '',
		}
		const dc3: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Early Bird Group',
			is_active: true,
			code: 'EARLYBIRD',
			notes: '',
		}
		const dc4: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Just 4 Today',
			is_active: true,
			code: '4TODAY',
			notes: '',
		}
		const dc5: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Saturday Mens',
			is_active: true,
			code: 'MENSMTG',
			notes: '',
		}
		const dc6: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Sunrise Al Anon',
			is_active: true,
			code: 'SUNRISE',
			notes: '',
		}
		const dc7: Donation_Code = {
			id: crypto.randomUUID(),
			name: '9:30am Sunday',
			is_active: true,
			code: '930SUN',
			notes: '',
		}
		const dc8: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Tri-Noon',
			is_active: true,
			code: 'TRINOON',
			notes: '',
		}
		const dc9: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Keep it Simple Womens Group',
			is_active: true,
			code: 'SIMPLE',
			notes: '',
		}
		const dc10: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'CMA – Ice Clean Sunday',
			is_active: true,
			code: 'ICECLEAN',
			notes: '',
		}
		const dc11: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'CMA Outsiders',
			is_active: true,
			code: 'OUTSIDERS',
			notes: '',
		}
		const dc12: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Keep off the Grass',
			is_active: true,
			code: 'OFFGRASS',
			notes: '',
		}
		const dc13: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Grateful CODA',
			is_active: true,
			code: 'GR8TFUL',
			notes: '',
		}
		const dc14: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Saturday CA Just B4 7',
			is_active: false,
			code: 'JUSTB47',
			notes: '',
		}
		const dc15: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Tri-Nite Flite',
			is_active: true,
			code: 'TRINITE',
			notes: '',
		}
		const dc16: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Our Primary Purpose',
			is_active: true,
			code: 'PRIMEPURPOSE',
			notes: '',
		}
		const dc17: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Out of Hell',
			is_active: true,
			code: 'OUTOFHELL',
			notes: '',
		}
		const dc18: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Triangle 8pm Evening Group',
			is_active: true,
			code: '8PMGROUP',
			notes: '',
		}
		const dc19: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Triangle Club',
			is_active: true,
			code: 'CLUBHOUSE',
			notes: 'Not a Give Lively',
		}
		const dc20: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Mens Big Book Study',
			is_active: true,
			code: 'TUESMENBB',
			notes: '',
		}
		const dc21: Donation_Code = {
			id: crypto.randomUUID(),
			name: 'Adult Children of Alcoholics',
			is_active: true,
			code: 'ACA7PM',
			notes: '',
		}
		const dc22: Donation_Code = {
			id: crypto.randomUUID(),
			name: '11th Step 5:45 Meditation',
			is_active: true,
			code: 'MEDITATE-545',
			notes: '',
		}

		try {
			await this.deleteAllDonationCodes()

			await this.insertDonationCode(dc1)
			await this.insertDonationCode(dc2)
			await this.insertDonationCode(dc3)
			await this.insertDonationCode(dc4)
			await this.insertDonationCode(dc5)
			await this.insertDonationCode(dc6)
			await this.insertDonationCode(dc7)
			await this.insertDonationCode(dc8)
			await this.insertDonationCode(dc9)
			await this.insertDonationCode(dc10)
			await this.insertDonationCode(dc11)
			await this.insertDonationCode(dc12)
			await this.insertDonationCode(dc13)
			await this.insertDonationCode(dc14)
			await this.insertDonationCode(dc15)
			await this.insertDonationCode(dc16)
			await this.insertDonationCode(dc17)
			await this.insertDonationCode(dc18)
			await this.insertDonationCode(dc19)
			await this.insertDonationCode(dc20)
			await this.insertDonationCode(dc21)
			await this.insertDonationCode(dc22)
			return true
		} catch (error) {
			return error as string
		}
	}
	static async insertDonationCode(dc: Donation_Code) {
		const primaryKey = ['donation_codes', dc.id]
		const byCodeKey = ['donation_codes_by_code', dc.code]
		const res = await kv.atomic()
			.check({ key: primaryKey, versionstamp: null })
			.check({ key: byCodeKey, versionstamp: null })
			.set(primaryKey, dc)
			.set(byCodeKey, dc)
			.commit()
		if (!res.ok) {
			console.log('error', dc)
			throw new TypeError('Doncation code with ID or code already exists')
		}
	}

	static async deleteAllDonationCodes() {
		for await (const res of kv.list({ prefix: ['donation_codes'] })) {
			const dc = res.value as Donation_Code
			this.deleteDonationCode(dc.id)
		}
	}
	static async deleteDonationCode(id: string) {
		let res = { ok: false }
		while (!res.ok) {
			const getRes = await kv.get<Donation_Code>(['donation_codes', id])
			if (getRes.value === null) return
			res = await kv.atomic()
				.check(getRes)
				.delete(['donation_codes', id])
				.delete(['donation_codes_by_code', getRes.value.code])
				.commit()
		}
	}
	/*
     Products
  */
	public static async seedProducts(): Promise<boolean | string> {
		const p1: Product = {
			id: crypto.randomUUID(),
			account: 'Tom',
			name: 'Donation',
			is_test_mode: true,
			price: 0,
			stripe_price_id: 'price_1JVH9EAiMbfPsWTOlzqMaoqS',
			stripe_product_id: 'prod_K9aJNd5v7HHo11',
			product_type: 'Donation',
			is_active: true,
		}

		const p2: Product = {
			id: crypto.randomUUID(),
			account: 'Triangle',
			name: 'Donation',
			is_test_mode: false,
			price: 0,
			stripe_price_id: 'price_1JgUpFHmLilEfNxWXZzdgAN2',
			stripe_product_id: 'prod_KLBBOdq5kqidc0',
			product_type: 'Donation',
			is_active: true,
		}

		const p3: Product = {
			id: crypto.randomUUID(),
			account: 'Triangle',
			name: 'Annual Membership',
			is_test_mode: false,
			price: 200,
			stripe_price_id: 'price_1JgUsfHmLilEfNxWfqUmSINA',
			stripe_product_id: 'prod_KLBFDKz5lj1wJJ',
			product_type: 'Subscription',
			is_active: true,
		}

		const p4: Product = {
			id: crypto.randomUUID(),
			account: 'Triangle',
			name: 'Monthly Membership',
			is_test_mode: true,
			price: 16.75,
			stripe_price_id: 'price_1JbB76HmLilEfNxWOlQaCTSJ',
			stripe_product_id: 'prod_KFgUaqevaq01Jx',
			product_type: 'Subscription',
			is_active: true,
		}

		const p5: Product = {
			id: crypto.randomUUID(),
			account: 'Tom',
			name: 'Annual Membership',
			is_test_mode: true,
			price: 200,
			stripe_price_id: 'price_1JVH1cAiMbfPsWTOXIMQnrdf',
			stripe_product_id: 'prod_K9aBGgieo4v58V',
			product_type: 'Subscription',
			is_active: true,
		}

		const p6: Product = {
			id: crypto.randomUUID(),
			account: 'Triangle',
			name: 'Donation',
			is_test_mode: true,
			price: 1,
			stripe_price_id: 'price_1JbB5qHmLilEfNxWArBYSBQl',
			stripe_product_id: 'prod_KFgSIIjGqNCbIM',
			product_type: 'Donation',
			is_active: true,
		}

		const p7: Product = {
			id: crypto.randomUUID(),
			account: 'Tom',
			name: 'Monthly Membership',
			is_test_mode: true,
			price: 0,
			stripe_price_id: 'price_1JVH2UAiMbfPsWTOpmEJIHaZ',
			stripe_product_id: 'prod_K9aCGe7Je0YKZm',
			product_type: 'Subscription',
			is_active: true,
		}

		const p8: Product = {
			id: crypto.randomUUID(),
			account: 'Triangle',
			name: 'Monthly Membership',
			is_test_mode: false,
			price: 16.75,
			stripe_price_id: 'price_1JgUrTHmLilEfNxWdHLO6UvM',
			stripe_product_id: 'prod_KLBD1BHK57v1DR',
			product_type: 'Subscription',
			is_active: true,
		}

		const p9: Product = {
			id: crypto.randomUUID(),
			account: 'Tom',
			name: 'Quarterly Membership',
			is_test_mode: true,
			price: 0,
			stripe_price_id: 'price_1JVH3HAiMbfPsWTOKhdcLYqj',
			stripe_product_id: 'prod_K9aDBizPtLz828',
			product_type: 'Subscription',
			is_active: true,
		}

		const p10: Product = {
			id: crypto.randomUUID(),
			account: 'Triangle',
			name: 'Quarterly Membership',
			is_test_mode: false,
			price: 50,
			stripe_price_id: 'price_1JgF61HmLilEfNxWgTrsyf3s',
			stripe_product_id: 'prod_KKuvw1elowtpBw',
			product_type: 'Subscription',
			is_active: true,
		}

		const p11: Product = {
			id: crypto.randomUUID(),
			account: 'Triangle',
			name: 'Annual Membership',
			is_test_mode: true,
			price: 200,
			stripe_price_id: 'price_1JgruIHmLilEfNxWHh2LANAl',
			stripe_product_id: 'prod_KFgVHOH0esiXY0',
			product_type: 'Subscription',
			is_active: true,
		}

		const p12: Product = {
			id: crypto.randomUUID(),
			account: 'Triangle',
			name: 'Quarterly Membership',
			is_test_mode: true,
			price: 50,
			stripe_price_id: 'price_1JbARFHmLilEfNxWs81jcH0p',
			stripe_product_id: 'prod_KFfm9kDyp2s0VR',
			product_type: 'Subscription',
			is_active: true,
		}

		try {
			await this.deleteAllProducts()

			await this.insertProduct(p1)
			await this.insertProduct(p2)
			await this.insertProduct(p3)
			await this.insertProduct(p4)
			await this.insertProduct(p5)
			await this.insertProduct(p6)
			await this.insertProduct(p7)
			await this.insertProduct(p8)
			await this.insertProduct(p9)
			await this.insertProduct(p10)
			await this.insertProduct(p11)
			await this.insertProduct(p12)
			return true
		} catch (error) {
			return error as string
		}
	}

	static async insertProduct(p: Product) {
		const primaryKey = ['products', p.id]
		const byProdIdKey = ['products_by_prodId', p.stripe_product_id]
		const res = await kv.atomic()
			.check({ key: primaryKey, versionstamp: null })
			.check({ key: byProdIdKey, versionstamp: null })
			.set(primaryKey, p)
			.set(byProdIdKey, p)
			.commit()
		if (!res.ok) {
			console.log('error', p)
			throw new TypeError('Products with ID or productId already exists')
		}
	}

	static async deleteAllProducts() {
		for await (const res of kv.list({ prefix: ['products'] })) {
			const pr = res.value as Product
			this.deleteProduct(pr.id)
		}
	}

	static async deleteProduct(id: string) {
		let res = { ok: false }
		while (!res.ok) {
			const getRes = await kv.get<Product>(['products', id])
			if (getRes.value === null) return
			// console.log(getRes.value)
			res = await kv.atomic()
				.check(getRes)
				.delete(['products', id])
				.delete(['products_by_prodId', getRes.value.stripe_product_id])
				.commit()
		}
	}
}

export default KVUtilityService
