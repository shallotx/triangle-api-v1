// export { Hono } from 'https://deno.land/x/hono@v4.2.2/mod.ts'
// export type { MiddlewareHandler } from 'https://deno.land/x/hono@v4.2.2/mod.ts'

// export { cors, logger } from 'https://deno.land/x/hono@v4.2.2/middleware.ts'
// export { showRoutes } from 'npm:hono@4.2.2/helper.ts'
// export { zValidator } from 'npm:@hono/zod-validator'
// // export { showRoutes } from 'npm:hono@4.2.2/h
// export {
// 	deleteCookie,
// 	getCookie,
// 	setCookie,
// } from 'https://deno.land/x/hono@v4.2.2/helper/cookie/index.ts'
// export { HTTPException } from 'https://deno.land/x/hono@v4.2.2/http-exception.ts'
// export type { Context } from 'https://deno.land/x/hono@v4.2.2/mod.ts'
// export { load } from 'jsr:@std/dotenv'
// export { load } from 'https://deno.land/std@0.213.0/dotenv/mod.ts'

export * as z from 'https://deno.land/x/zod@v3.22.4/mod.ts'

export {
	compare,
	compareSync,
	genSalt,
	genSaltSync,
	hash,
	hashSync,
} from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'
export type { Header, Payload } from 'https://deno.land/x/djwt@v3.0.1/mod.ts'
export { create, decode, verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts'

export { drizzle } from 'npm:drizzle-orm@0.29.2/postgres-js'
export * as postgresjs from 'https://deno.land/x/postgresjs@v3.4.4/mod.js'
// import postgres from  'npm:postgres@3.4.3'
export {
	bigint,
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'npm:drizzle-orm@0.29.2/pg-core'
export {
	and,
	desc,
	eq,
	inArray,
	like,
	lt,
	or,
	sql,
} from 'npm:drizzle-orm@0.29.2'

export * as nodemailer from 'npm:nodemailer@6.9.8'

import config from './config/default.ts'
import Stripe from 'npm:stripe@14.10'

export const stripe = new Stripe(config.stripeKey ?? '', {
	apiVersion: '2023-10-16',
	typescript: true,
})
