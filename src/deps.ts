import config from './config/default.ts'
import Stripe from 'npm:stripe@17.4.0'
export { Stripe } from 'npm:stripe@17.4.0'

export const stripe = new Stripe(config.stripeKey ?? '', {
	typescript: true,
})

export {
	compare,
	compareSync,
	genSalt,
	genSaltSync,
	hash,
	hashSync,
} from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'
