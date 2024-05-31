/// <reference lib="deno.unstable" />
import { Hono } from '@hono/hono'
import { cors } from '@hono/hono/cors'
import { HTTPException } from '@hono/hono/http-exception'
import { showRoutes } from '@hono/hono/dev'
import miscRoutes from './routes/misc.routes.ts'
import meetingRoutes from './routes/meeting.routes.ts'
import memberRoutes from './routes/member.routes.ts'
import adminRoutes from './routes/admin.routes.ts'
import stripeRoutes from './routes/stripe.routes.ts'
import authRoutes from './routes/auth.routes.ts'

// import memberOtherRoutes from './routes/memberOther.routes.ts'

const app = new Hono().basePath('/api')
// app.use('*', cors())
const corsConfig = {
	credentials: true,
	origin: [
		'https://atlantatriangleclub.org',
		'https://admin.atlantatriangleclub.org',
		'http://localhost:8000',
		'http://localhost:3000',
		'https://triangle-v10.deno.dev',
		'https://triangle-admin.netlify.app',
	],
}
app.use('*', cors(corsConfig))
// app.use("*", logger());
app.notFound((c) => c.json({ message: 'Not Found', ok: false }, 404))

// Error handling
app.onError((err, c) => {
	console.error(`${err}`)
	if (err instanceof HTTPException) {
		return err.getResponse()
	}
	return c.text('Custom Error Message', 500)
})

app.get('/', (c) => {
	return c.text('Hello Hono!')
})

app.route('/meetings', meetingRoutes)
app.route('/misc', miscRoutes)
app.route('/members', memberRoutes)
app.route('/admin', adminRoutes)
app.route('/stripe', stripeRoutes)
app.route('/auth', authRoutes)

// app.route('/membersother', memberOtherRoutes)

// showRoutes(app)

Deno.serve(app.fetch)
