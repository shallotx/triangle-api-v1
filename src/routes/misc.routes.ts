import { Hono } from '../deps.ts'
import miscController from '../controllers/misc.controller.ts'
import kvService from '../services/kv.service.ts'
const router = new Hono()
 
router.get('/donationcodes', async (c) => {
    const dts = await kvService.getDonationCodes()
    return c.json({
        donationCodes: dts,
        status: 'success',
        results: dts.length,
    })
  }) 
 
router.get('/recoverylinks', async (c) => {
    const dts = await kvService.getRecoveryLinks()
    return c.json({
        recoveryLinks: dts,
        status: 'success',
        results: dts.length,
    })
  }) 
  router.get('/products', async (c) => {
    const { testmode, account } = c.req.query()
    const dts = await kvService.getProducts(testmode, account)
    return c.json({
        products: dts,
        status: 'success',
        results: dts.length,
    })
  }) 
 
 
router.post('/sendmail', miscController.sendmail)
// router.post('/sendInviteEmail', miscController.sendInviteEmail)
router.get('/download/members', miscController.getMembersForCSV)

export default router
