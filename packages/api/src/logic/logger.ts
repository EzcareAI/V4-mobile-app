/**
 * Lightweight logger for EZCare AI POC
 */
export const logger = {
	info: (message: string, data?: any) => {
		console.log(
			`[INFO] ${new Date().toISOString()}: ${message}`,
			data ? JSON.stringify(data) : ""
		);
	},
	warn: (message: string, data?: any) => {
		console.warn(
			`[WARN] ${new Date().toISOString()}: ${message}`,
			data ? JSON.stringify(data) : ""
		);
	},
	error: (message: string, error?: any) => {
		console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
	},

	// Safety & Payment specific logs
	payment: (userId: string, action: string, status: string) => {
		console.log(
			`[PAYMENT] ${new Date().toISOString()}: User ${userId} ${action} -> ${status}`
		);
	},
	ai: (userId: string, type: string, duration: number) => {
		console.log(
			`[AI-STATS] ${new Date().toISOString()}: User ${userId} ${type} took ${duration}ms`
		);
	},
};
