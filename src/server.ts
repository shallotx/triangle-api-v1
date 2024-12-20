import { type Context, Hono } from '@hono/hono'
import { cors } from '@hono/hono/cors'
import { HTTPException } from '@hono/hono/http-exception'
// import { showRoutes } from "@hono/hono/dev"
import meetingRoutes from './routes/meeting.routes.ts'
import miscRoutes from './routes/misc.routes.ts'
import memberRoutes from './routes/member.routes.ts'
import memberOtherRoutes from './routes/memberOther.routes.ts'
import stripeRoutes from './routes/stripe.routes.ts'
import authRoutes from './routes/auth.routes.ts'
import adminRoutes from './routes/admin.routes.ts'

const app = new Hono().basePath('/api')
const corsConfig = {
	credentials: true,
	origin: [
		'https://atlantatriangleclub.org',
		'https://admin.atlantatriangleclub.org',
		'https://atlantatriangleclubadmin.org',
		'http://localhost:8000',
		'http://localhost:3000',
		'https://triangle-web-deno.deno.dev',
		'https://triangle-admin-fly.fly.dev',
	],
}
app.use('*', cors(corsConfig))

// Error handling
app.onError((err: Error, c: Context) => {
	console.error(`${err}`)
	if (err instanceof HTTPException) {
		return err.getResponse()
	}
	return c.text('Custom Error Message', 500)
})

app.notFound((c: Context) => c.json({ message: 'Not Found', ok: false }, 404))

app.get('/', (c: Context) => {
	return c.text('Hello Hono!')
})

app.route('/misc', miscRoutes)
app.route('/meetings', meetingRoutes)
app.route('/stripe', stripeRoutes)
app.route('/auth', authRoutes)
app.route('/members', memberRoutes)
app.route('/membersother', memberOtherRoutes)
app.route('/membersother', memberOtherRoutes)
app.route('/admin', adminRoutes)

// showRoutes(app)

Deno.serve(app.fetch)
