import postgres from 'https://deno.land/x/postgresjs@v3.4.3/mod.js'
import config from '../config/default.ts'

// const sql = postgres({ /* options */ }) // will use psql environment variables
const pgSql = postgres(config.dbURL, {
	idle_timeout: 20,
	max_lifetime: 60 * 10, //10 min
	types: {
		bigint: postgres.BigInt,
	},
})

export default pgSql
