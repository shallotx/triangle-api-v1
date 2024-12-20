import * as mod from '@std/dotenv'

await mod.load({ export: true })

const config: {
	dbURL: string
	apiPath: string
	emailTo: string
	postMarkApiKey: string
	reSendApiKey: string
	supportEmail: string
	inviteEmail: string
	inviteEmailPwd: string
	stripeKey: string
	jwtAccessExpiration: number
	jwtRefeshExpiration: number
	returnURL: string
	adminReturnURL: string
} = {
	dbURL: Deno.env.get('DATABASE_URL') as unknown as string ||
		'postgresql://...',
	apiPath: Deno.env.get('API_PATH') as unknown as string,
	emailTo: Deno.env.get('EMAIL_ADDRESS_TO') as unknown as string,
	postMarkApiKey: Deno.env.get('POSTMARK_API_KEY') as unknown as string,
	reSendApiKey: Deno.env.get('RESEND_API_KEY') as unknown as string,
	supportEmail: Deno.env.get('SUPPORT_EMAIL') as unknown as string,
	inviteEmail: Deno.env.get('INVITE_EMAIL') as unknown as string,
	inviteEmailPwd: Deno.env.get('INVITE_EMAIL_PWORD') as unknown as string,
	stripeKey: Deno.env.get('STRIPE_SECRET_KEY') as unknown as string,
	jwtAccessExpiration: Number(
		Deno.env.get('JWT_ACCESS_TOKEN_EXP'),
	) as unknown as number,
	jwtRefeshExpiration: Number(
		Deno.env.get('JWT_REFESH_TOKEN_EXP'),
	) as unknown as number,

	returnURL: Deno.env.get('RETURN_URL') as unknown as string,
	adminReturnURL: Deno.env.get('ADMIN_RETURN_URL') as unknown as string,
}

export default config
