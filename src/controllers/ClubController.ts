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
	// TODO: Move to dedicated MeemID controller?
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
}
