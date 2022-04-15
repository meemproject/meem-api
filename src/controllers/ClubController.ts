import AWS from 'aws-sdk'
import BigNumber from 'bignumber.js'
import type { ethers as Ethers } from 'ethers'
import { Response } from 'express'
import { parse } from 'json2csv'
import _ from 'lodash'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import sharp from 'sharp'
import TwitterApi, { UserV2 } from 'twitter-api-v2'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import {
	IAPIRequestPaginated,
	IAuthenticatedRequest,
	IRequest,
	IResponse
} from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class ClubController {
	public static async searchClubs(
		req: IAPIRequestPaginated<MeemAPI.v1.SearchClubs.IDefinition>,
		res: IResponse<MeemAPI.v1.SearchClubs.IResponseBody>
	): Promise<Response> {
		const { page, limit: requestedLimit } = req
		const { displayName, tokenName } = req.query
		const limit = requestedLimit && requestedLimit > 100 ? 100 : requestedLimit
		const or = []

		if (tokenName && tokenName !== '') {
			or.push({
				tokenName: {
					[Op.iLike]: `%${tokenName?.toLowerCase()}%`
				}
			})
		}

		if (displayName && displayName !== '') {
			or.push({
				displayName: {
					[Op.iLike]: `%${displayName?.toLowerCase()}%`
				}
			})
		}

		const clubsQuery = await orm.models.Club.findAndCountAll({
			where: {
				[Op.or]: or
			},
			order: [['displayName', 'ASC']],
			offset: page * limit,
			limit
		})
		const clubs = clubsQuery.rows.map(c => services.club.clubToIClub(c))
		return res.json({
			clubs,
			itemsPerPage: limit,
			totalItems: clubsQuery.count
		})
	}

	public static async createOrUpdateClubConnection(
		req: IRequest<MeemAPI.v1.CreateOrUpdateClubConnection.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateOrUpdateClubConnection.IResponseBody>
	): Promise<Response> {
		const { tokenId, connectionType } = req.params
		if (config.DISABLE_ASYNC_MINTING) {
			switch (connectionType) {
				case 'twitter': {
					services.club.createOrUpdateTwitterConnection({
						tokenId,
						signature: '',
						twitterAccessToken: req.body.twitterAccessToken,
						twitterAccessSecret: req.body.twitterAccessSecret
					})
					break
				}
				default:
					break
			}
		} else {
			// TODO: Async Function
			// const lambda = new AWS.Lambda({
			// 	accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			// 	secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
			// 	region: 'us-east-1'
			// })
			// await lambda
			// 	.invoke({
			// 		InvocationType: 'Event',
			// 		FunctionName: config.LAMBDA_MEEMID_UPDATE_FUNCTION,
			// 		Payload: JSON.stringify(data)
			// 	})
			// 	.promise()
		}
		return res.json({
			status: 'success'
		})
	}
}
