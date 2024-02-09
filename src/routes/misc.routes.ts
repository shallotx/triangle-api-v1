import { Hono } from '../deps.ts'
import miscController from '../controllers/misc.controller.ts'

const router = new Hono()

router.get('/donationcodes', miscController.getDonationCodes)
router.get('/recoverylinks', miscController.getRecoveryLinks)
router.get('/products', miscController.getProducts)
router.post('/sendmail', miscController.sendmail)
// router.post('/sendInviteEmail', miscController.sendInviteEmail)
router.get('/download/members', miscController.getMembersForCSV)

export default router
