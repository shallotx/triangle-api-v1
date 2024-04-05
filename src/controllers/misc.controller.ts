// import { drizzle as drizzlserv, drizzlePool} from '../deps.ts';
import { Context } from '../deps.ts'
import { drizzle } from '../deps.ts'
import { and, eq, inArray, sql } from '../deps.ts'
import pgSql from '../db/db.ts'
import config from '../config/default.ts'
import { donation_code, links } from '../db/schema/misc.ts'
import { products } from '../db/schema/products.ts'
import { members } from '../db/schema/members.ts'
import { membersOther } from '../db/schema/membersOther.ts'
import { nodemailer } from '../deps.ts'
import { emailSchema } from '../db/schema/zod.ts'
import CsvHelper from '../helpers/csv.helper.ts'
 
 
const getMembersForCSV = async (c: Context) => {
	const { membershipIsActive } = c.req.query()
	const activeArray = [true, false]
	if (membershipIsActive) {
		if (membershipIsActive !== 'any') {
			const boolOutput = membershipIsActive === 'true'
			if (boolOutput) {
				activeArray.pop()
			} else {
				activeArray.shift()
			}
		}
	}
	interface memberForCSV {
		memberType: string
		firstname: string
		lastname: string
		phone: string
		email: string
		isVolunteer: string
		isActive: string
	}
	const membersToWrite: memberForCSV[] = []
	try {
		const isActive = true
		const db = drizzle(pgSql)
		const result = await db.select().from(members).where(
			inArray(members.membership_is_active, activeArray),
		)

		result.forEach((el) => {
			membersToWrite.push({
				memberType: 'Online',
				firstname: el.firstname || '',
				lastname: el.lastname || '',
				phone: el.phone || '',
				email: el.email,
				isVolunteer: el.is_volunteer as unknown as string,
				isActive: el.membership_is_active as unknown as string,
			})
		})

		const result2 = await db.select().from(membersOther)
			.where(inArray(membersOther.membership_is_active, activeArray))

		result2.forEach((el) => {
			membersToWrite.push({
				memberType: 'Admin',
				firstname: el.firstname || '',
				lastname: el.lastname || '',
				phone: el.phone || '',
				email: el.email,
				isVolunteer: el.is_volunteer as unknown as string,
				isActive: el.membership_is_active as unknown as string,
			})
		})
		// sort by name
		membersToWrite.sort((a, b) => {
			const nameA = a.lastname.toUpperCase() // ignore upper and lowercase
			const nameB = b.lastname.toUpperCase() // ignore upper and lowercase
			if (nameA < nameB) {
				return -1
			}
			if (nameA > nameB) {
				return 1
			}

			// names must be equal
			return 0
		})
		// console.log(membersToWrite)
		const stream = CsvHelper.encode(membersToWrite)
		return c.body(stream)
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

const parseBool = (str: string | null) => {
	if (str == null) {
		return false
	}

	if (typeof str === 'boolean') {
		if (str === true) {
			return true
		}

		return false
	}

	if (typeof str === 'string') {
		if (str == '') {
			return false
		}

		str = str.replace(/^\s+|\s+$/g, '')
		if (str.toLowerCase() == 'true' || str.toLowerCase() == 'yes') {
			return true
		}

		str = str.replace(/,/g, '.')
		str = str.replace(/^\s*\-\s*/g, '-')
	}
	return false
}

const sendmail = async (c: Context) => {
	const res = emailSchema.safeParse(await c.req.json())
	if (!res.success) {
		c.status(400)
		return c.json({ status: 'failure', message: 'Incorrect Data' })
	}
	const bdy = {
		From: 'contact@atlantatriangleclub.org',
		To: config.emailTo,
		Subject: 'Contact Request from Website',
		TextBody: 'string',
		HtmlBody: `<h4>Contact</h4>
      <p><strong>Name: ${res.data.name}</strong></p>
      <p><strong>Email: ${res.data.email}</strong></p>
          ${res.data.text}`,
		MessageStream: 'outbound',
	}

	try {
		const url = 'https://api.postmarkapp.com/email'
		const resp = await fetch(url, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'X-Postmark-Server-Token':
					'9c1cb171-10c0-41e7-85e8-b56cca5bc1c0',
			},
			body: JSON.stringify(bdy),
		})

		return c.json('Email sent', 200)
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

// const sendInviteEmail = async (c: Context) => {
// 	const transporter = nodemailer.createTransport({
// 		host: 'smtp.forwardemail.net',
// 		port: 465,
// 		secure: true,
// 		auth: {
// 			user: 'contact@atlantatriangleclub.dev',
// 			pass: 'cf72542c14a754f15b8f7b3a',
// 		},
// 	})

// 	try {
// 		const info = await transporter.sendMail({
// 			from: 'Triangle Club  <contact@atlantatriangleclub.dev>',
// 			to: 'shallotx@gmail.com', // list of receivers
// 			subject: 'Triangle Admin App Invite', // Subject line
// 			// subject: "Hello ✔", // Subject line
// 			text: 'Hello world?', // plain text body
// 			html: '<b>Hello world?</b>', // html body
// 		})

// 		return c.json('Email sent', 200)
// 	} catch (error) {
// 		return c.json(
// 			{
// 				error,
// 			},
// 			400,
// 		)
// 	}
// }

export default {
 
	sendmail,
	// sendInviteEmail,
	getMembersForCSV,
}
