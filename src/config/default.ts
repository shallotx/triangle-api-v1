import * as mod from '@std/dotenv'

await mod.load({ export: true })

const config: {
	dbURL: string
	emailTo: string
	stripeKey: string
	jwtAccessExpiration: number
	jwtRefeshExpiration: number
	returnURL: string
	adminReturnURL: string
} = {
	dbURL: Deno.env.get('DATABASE_URL') as unknown as string,
	emailTo: Deno.env.get('EMAIL_ADDRESS_TO') as unknown as string,
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
