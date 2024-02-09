import { stripe } from '../deps.ts'

class StripeService {
	public static async getStripeActiveSubscript(
		stripeCustId: string,
	): Promise<boolean> {
		const statusFilter = 'active'
		try {
			const subscripts = await stripe.subscriptions.list({
				limit: 1,
				status: statusFilter,
				customer: stripeCustId,
			})
			if (subscripts.data.length > 0) {
				return true
			}
			return false
		} catch (error) {
			return false
		}
	}
	// deno-lint-ignore no-explicit-any
	public static async getStripeSubscriptsByCustId(
		stripeCustId: string,
	): Promise<any | string> {
		try {
			const subscripts = await stripe.subscriptions.list({
				limit: 5,
				status: 'all',
				customer: stripeCustId,
			})
			return subscripts
		} catch (error) {
			return error.message as string
		}
	}

	// deno-lint-ignore no-explicit-any
	public static async getStripePromotionCodes(): Promise<any | string> {
		try {
			const promotionCodes = await stripe.promotionCodes.list({
				active: true,
				limit: 3,
			})

			return promotionCodes
		} catch (error) {
			return error as string
		}
	}
}

export default StripeService
