import { type emailSend, type emailType } from '../schema/zod.ts'

class EmailService {
	/*
	This is to send email from Contact page on Website.  It uses the
	Postmark mail api
	*/
	public static async sendContactEmail(
		emailData: emailType,
		emailTo: string,
		mailApiKey: string,
	): Promise<boolean> {
		const bdy = {
			From: 'contact@atlantatriangleclub.org',
			To: emailTo,
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
				'X-Postmark-Server-Token': mailApiKey,
			},
			body: JSON.stringify(bdy),
		})

		if (res.ok) {
			return true
		}
		return false
	}

	public static async sendResendEmail(
		emailPayload: emailSend,
		resendKey: string,
	): Promise<boolean> {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${resendKey}`,
			},
			body: JSON.stringify({
				from: emailPayload.from,
				to: emailPayload.email,
				subject: emailPayload.subject,
				html: emailPayload.html,
			}),
		})

		if (res.ok) {
			return true
		}
		return false
	}
}

export default EmailService
