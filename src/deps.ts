export { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts'
export {
	compare,
	compareSync,
	genSalt,
	genSaltSync,
	hash,
	hashSync,
} from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

import config from './config/default.ts'
import Stripe from 'npm:stripe@14.10'

export const stripe = new Stripe(config.stripeKey ?? '', {
	apiVersion: '2023-10-16',
	typescript: true,
})
