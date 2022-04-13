/* eslint-disable import/no-extraneous-dependencies */
import * as path from 'path'
import type { ethers as Ethers } from 'ethers'
import fs from 'fs-extra'
import _ from 'lodash'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import sharp from 'sharp'
import request from 'superagent'
import { v4 as uuidv4 } from 'uuid'
import ERC721ABI from '../abis/ERC721.json'
import MeemABI from '../abis/Meem.json'
import errors from '../config/errors'
import meemAccessListTesting from '../lib/meem-access-testing.json'
import meemAccessList from '../lib/meem-access.json'
import type MeemModel from '../models/Meem'
import MeemIdentification from '../models/MeemIdentification'
import { Meem, ERC721 } from '../types'
import {
	MeemPermissionStructOutput,
	MeemPropertiesStructOutput,
	MeemStructOutput,
	SplitStructOutput
} from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
import {
	MeemMetadataStorageProvider,
	MeemType
} from '../types/shared/meem.shared'

function errorcodeToErrorString(contractErrorName: string) {
	const allErrors: Record<string, any> = config.errors
	const errorKeys = Object.keys(allErrors)
	const errIdx = errorKeys.findIndex(
		k => allErrors[k].contractErrorCode === contractErrorName
	)
	if (errIdx > -1) {
		return errorKeys[errIdx]
	}
	return 'UNKNOWN_CONTRACT_ERROR'
}

function genericError(message?: string) {
	return {
		status: 'failure',
		code: 'SERVER_ERROR',
		reason: 'Unable to find specific error',
		friendlyReason:
			message ||
			'Sorry, something went wrong. Please try again in a few minutes.'
	}
}

function handleStringErrorKey(errorKey: string) {
	let err = config.errors.SERVER_ERROR
	// @ts-ignore
	if (errorKey && config.errors[errorKey]) {
		// @ts-ignore
		err = config.errors[errorKey]
	} else {
		log.warn(
			`errorResponder Middleware: Invalid error key specified: ${errorKey}`
		)
	}

	return {
		status: 'failure',
		httpCode: 500,
		reason: err.reason,
		friendlyReason: err.friendlyReason
	}
}

export default class ClubService {
	public static async searchClubs(query: string) {
		const clubs = await orm.models.Club.findAndCountAll({
			where: {
				tokenName: {
					[Op.iLike]: query
				}
			}
		})

		return clubs.rows
	}
}
