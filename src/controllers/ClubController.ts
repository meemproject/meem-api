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
import Meem from '../models/Meem'
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
		req: IRequest<MeemAPI.v1.SearchClubs.IDefinition>,
		res: IResponse<MeemAPI.v1.SearchClubs.IResponseBody>
	): Promise<Response> {
		const { page, limit: requestedLimit } = req
		const { query } = req.query
		const limit = requestedLimit && requestedLimit > 100 ? 100 : requestedLimit
		const q = query.toLowerCase()
		const clubs = await orm.models.Club.findAndCountAll({
			where: {
				tokenName: {
					[Op.iLike]: `%${q}%`
				}
			},
			order: [['displayName', 'ASC']],
			offset: page * limit,
			limit
		})
		return res.json({
			clubs: clubs.rows,
			itemsPerPage: limit,
			totalItems: clubs.count
		})
	}
}
