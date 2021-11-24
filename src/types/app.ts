import { Request, Response } from 'express'

export interface IQueryParams {}

export interface IPathParams {}

export interface IRequestBody {}

export interface IResponseBody {}

export interface IEndpoint {
	pathParams?: IPathParams
	queryParams?: IQueryParams
	requestBody?: IRequestBody
	responseBody?: IResponseBody
}
export interface IRequest<TDefinition extends IEndpoint = IEndpoint>
	extends Omit<Request, 'params' | 'query' | 'body'> {
	params: TDefinition['pathParams']
	query: TDefinition['queryParams'] & { [key: string]: string }
	body: TDefinition['requestBody']
}

export interface IResponse<TBodyParams> extends Omit<Response, 'body'> {
	json: (body?: Omit<TBodyParams, 'apiVersion'>) => Response<any>
	error(e: Error): any
}
