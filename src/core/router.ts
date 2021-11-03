import {
	Router,
	Request,
	Response,
	NextFunction,
	RequestHandler
} from 'express'

export const asyncHandler = (fn: any): RequestHandler =>
	function asyncWareWrap(...args) {
		const fnReturn = fn(...args)
		const next = args[args.length - 1] as NextFunction
		return Promise.resolve(fnReturn).catch(next)
	}

export const paramWrapper = (fn: RequestHandler): RequestHandler =>
	// @ts-ignore
	function asyncParamWrap(
		req: Request,
		res: Response,
		next: NextFunction,
		val: string
	) {
		// @ts-ignore
		const fnReturn = fn(req, res, next, val)
		return Promise.resolve(fnReturn).catch(next)
	}

export type Ware = (
	req: Request,
	res: Response,
	next: NextFunction,
	val: string
) => any

export function wrapWare(ware: Ware | Ware[]): Ware | Ware[] {
	let wrapped: any | any[]
	if (Array.isArray(ware)) {
		wrapped = ware.map(w => wrapWare(w))
	} else {
		wrapped = asyncHandler(ware)
	}

	return wrapped
}

export interface IAppRouter extends Router {
	paramAsync: (paramName: string, handler: Ware) => IAppRouter
	getAsync: (
		path: string | RegExp | (string | RegExp)[],
		...wares: any[]
	) => IAppRouter
	postAsync: (
		path: string | RegExp | (string | RegExp)[],
		...wares: any[]
	) => IAppRouter
	patchAsync: (
		path: string | RegExp | (string | RegExp)[],
		...wares: any[]
	) => IAppRouter
	deleteAsync: (
		path: string | RegExp | (string | RegExp)[],
		...wares: any[]
	) => IAppRouter
	putAsync: (
		path: string | RegExp | (string | RegExp)[],
		...wares: any[]
	) => IAppRouter
}

export default (): IAppRouter => {
	const router = Router() as IAppRouter

	router.paramAsync = function paramAsync(paramName: string, handler: Ware) {
		// @ts-ignore
		return router.param(paramName, paramWrapper(handler))
	}

	router.getAsync = function getAsync(
		path: string | RegExp | (string | RegExp)[],
		...wares: any[]
	) {
		const wrappedWares = wares.map(w => wrapWare(w))

		// @ts-ignore
		return router.get(path, ...wrappedWares)
	}

	router.postAsync = function postAsync(
		path: string | RegExp | (string | RegExp)[],
		...wares: any[]
	) {
		const wrappedWares = wares.map(w => wrapWare(w))
		// @ts-ignore
		return router.post(path, ...wrappedWares)
	}

	router.patchAsync = function patchAsync(
		path: string | RegExp | (string | RegExp)[],
		...wares: any[]
	) {
		const wrappedWares = wares.map(w => wrapWare(w))
		// @ts-ignore
		return router.patch(path, ...wrappedWares)
	}

	router.deleteAsync = function deleteAsync(
		path: string | RegExp | (string | RegExp)[],
		...wares: any[]
	) {
		const wrappedWares = wares.map(w => wrapWare(w))
		// @ts-ignore
		return router.delete(path, ...wrappedWares)
	}

	router.putAsync = function putAsync(
		path: string | RegExp | (string | RegExp)[],
		...wares: any[]
	) {
		const wrappedWares = wares.map(w => wrapWare(w))
		// @ts-ignore
		return router.put(path, ...wrappedWares)
	}

	return router
}
