import { type emailType } from '../db/schema/zod.ts'
import config from '../config/default.ts'

class EmailService {
	/*
	This is to send email from Contact page on Website.  It uses the
	Postmark mail api
	*/
	public static async sendContactEmail(
		emailData: emailType,
	): Promise<boolean> {
		const bdy = {
			From: 'contact@atlantatriangleclub.org',
			To: config.emailTo,
			Subject: 'Contact Request from Website',
			TextBody: 'string',
			HtmlBody: `<h4>Contact</h4>
      <p><strong>Name: ${emailData.name}</strong></p>
      <p><strong>Email: ${emailData.email}</strong></p>
          ${emailData.text}`,
			MessageStream: 'outbound',
		}
		const url = 'https://api.postmarkapp.com/email'
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'X-Postmark-Server-Token':
					'9c1cb171-10c0-41e7-85e8-b56cca5bc1c0',
			},
			body: JSON.stringify(bdy),
		})

		if (res.ok) {
			return true
		}
		return false
	}

	/**
	 ** This is to send email from Support page on Website.  It uses the
	 ** Resend mail api
	 */
	public static async sendSupportEmail(toSend: emailType): Promise<boolean> {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${config.resendKey}`,
			},
			body: JSON.stringify({
				from: 'Triangle <support@support.atlantatriangleclub.dev>',
				to: ['dev@shallotx.com'],
				subject: 'Triangle Website Support',
				html: `<h3>Support Request from ${toSend.name}</h3>
						<br>
						<a href="mailto:${toSend.email}">Email from ${toSend.email}</a>
						<p>Message: ${toSend.text}</</p>
						`,
			}),
		})

		if (res.ok) {
			return true
		}
		return false
	}
}

export default EmailService
