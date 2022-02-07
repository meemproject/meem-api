/* eslint-disable */
import path from 'path'
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types'
import { ethers as Ethers } from 'ethers'
import fs from 'fs-extra'
import { task } from 'hardhat/config'
import { HardhatArguments } from 'hardhat/types'
import {
	FacetCutAction,
	getSelectors,
	IDeployHistoryFacet
} from './lib/diamond'

interface IDeployHistory {
	[proxyAddress: string]: {
		[facetName: string]: IDeployHistoryFacet & {
			previousDeploys: IDeployHistoryFacet[]
		}
	}
}

export async function deployMeemIdDiamond(options: {
	ethers: HardhatEthersHelpers
	hardhatArguments?: HardhatArguments
}) {
	const { ethers } = options
	const deployedContracts: Record<string, string> = {}
	const network = await ethers.provider.getNetwork()
	const { chainId } = network
	const diamondHistoryPath = path.join(process.cwd(), '.diamond')
	const diamondHistoryFile = path.join(
		process.cwd(),
		'.diamond',
		`${chainId}.json`
	)
	let history: IDeployHistory = {}
	try {
		history = await fs.readJSON(diamondHistoryFile)
	} catch (e) {
		console.log(e)
	}

	const accounts = await ethers.getSigners()
	const contractOwner = accounts[0]
	console.log('Deploying contracts with the account:', contractOwner.address)

	console.log('Account balance:', (await contractOwner.getBalance()).toString())

	// deploy Diamond
	const Diamond = await ethers.getContractFactory('MeemIdDiamond')

	const diamond = await Diamond.deploy()

	await diamond.deployed()
	deployedContracts.DiamondProxy = diamond.address

	history[diamond.address] = {}

	// deploy facets
	console.log('')
	console.log('Deploying facets')

	const facets: Record<string, Ethers.Contract | null> = {
		AccessControlFacet: null,
		MeemIdFacet: null,
		InitDiamond: null
	}

	const cuts = []
	const facetNames = Object.keys(facets)
	for (const facetName of facetNames) {
		const Facet = await ethers.getContractFactory(facetName, {
			...facets[facetName]
		})
		const facet = await Facet.deploy()
		await facet.deployed()
		facets[facetName] = facet
		console.log(`${facetName} deployed: ${facet.address}`)
		deployedContracts[facetName] = facet.address
		const functionSelectors = getSelectors(facet)
		cuts.push({
			facetAddress: facet.address,
			action: FacetCutAction.Add,
			functionSelectors
		})

		const previousDeploys = history[diamond.address][facetName]
			? [
					...history[diamond.address][facetName].previousDeploys,
					{
						address: history[diamond.address][facetName].address,
						functionSelectors:
							history[diamond.address][facetName].functionSelectors
					}
			  ]
			: []

		history[diamond.address][facetName] = {
			address: facet.address,
			functionSelectors,
			previousDeploys
		}
	}

	// upgrade diamond with facets
	console.log('')
	console.log('Diamond Cut:', cuts)
	const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)

	// call to init function
	const functionCall = facets.InitDiamond?.interface.encodeFunctionData(
		'init',
		[]
	)

	const tx = await diamondCut.diamondCut(cuts, diamond.address, functionCall)
	console.log('Diamond cut tx: ', tx.hash)
	const receipt = await tx.wait()
	if (!receipt.status) {
		throw Error(`Diamond upgrade failed: ${tx.hash}`)
	}

	await fs.ensureDir(diamondHistoryPath)
	await fs.writeJSON(diamondHistoryFile, history, {
		flag: 'w'
	})

	console.log({
		deployedContracts
	})

	return deployedContracts
}

task('deployMeemIdDiamond', 'Deploys MeemId').setAction(
	async (args, { ethers, hardhatArguments }) => {
		const result = await deployMeemIdDiamond({ ethers, hardhatArguments })
		return result
	}
)