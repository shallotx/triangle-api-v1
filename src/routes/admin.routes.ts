import { Hono } from '@hono/hono'
import membersHandler from '../handlers/members.handler.ts'

const router = new Hono()

router.get('/download/members', ...membersHandler.getMembersForCSV)

// // router.post('/sendInviteEmail', miscController.sendInviteEmail)

export default router
