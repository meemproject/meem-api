import { getCuts, IFacetVersion } from '@meemproject/meem-contracts'
// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
import { ethers } from 'ethers'
import { encodeSingle, TransactionType } from 'ethers-multisend'
import type { CallContractTransactionInput } from 'ethers-multisend'
import meemABI from '../abis/Meem.json'
import { MeemAPI } from '../types/meem.generated'

export interface IDeployTransactionInput {
	args: any[]
	bytecode: string
}

export interface IDiamondCutTransactionInput {
	fromVersion: IFacetVersion[]
	toVersion: IFacetVersion[]
	contractTxId?: string
	contractAddress?: string
	functionCall: string
}

export interface ICallContractInput
	extends Partial<CallContractTransactionInput> {
	id: string
	contractAddress?: string
	contractTxId?: string
	functionSignature: string
	inputValues: Record<string, any>
}

export interface ICreateTablelandTableInput
	extends IDeployTransactionInput,
		IDiamondCutTransactionInput {
	tableName: string
	agreementExtensionId: string
	columns: {
		[columnName: string]: MeemAPI.StorageDataType
	}
}

export interface IEvent {
	eventName: MeemAPI.QueueEvent
	id: string
	chainId: number
	transactionInput:
		| ICallContractInput
		| IDeployTransactionInput
		| IDiamondCutTransactionInput
		| ICreateTablelandTableInput
	customABI?: Record<string, any>[]
}

export default class QueueService {
	public static async handleEvent(options: { event: IEvent }) {
		const { event } = options
		const { eventName, id, chainId, transactionInput, customABI } = event
		try {
			log.debug('Queue.handleEvent', { event })

			const transaction = await orm.models.Transaction.create({
				id,
				transactionInput,
				transactionType: eventName,
				customABI,
				chainId
			})
			try {
				const { recommendedGwei } = await services.web3.getGasEstimate({
					chainId
				})

				switch (eventName) {
					case MeemAPI.QueueEvent.CreateTablelandTable: {
						if (!customABI) {
							log.crit('Missing ABI for DeployContract task')
							throw new Error('MISSING_PARAMETERS')
						}

						const { wallet } = await services.ethers.getProvider({ chainId })

						const {
							args,
							bytecode,
							fromVersion,
							toVersion,
							functionCall,
							tableName,
							columns,
							agreementExtensionId
						} = transactionInput as ICreateTablelandTableInput

						const t = await orm.sequelize.transaction()

						const agreementExtension =
							await orm.models.AgreementExtension.findOne({
								where: {
									id: agreementExtensionId
								},
								transaction: t
							})

						try {
							if (!agreementExtension) {
								log.crit(
									`Agreement extension not found for id: ${agreementExtensionId}`
								)
								throw new Error('AGREEMENT_EXTENSION_NOT_FOUND')
							}

							// Deploy proxy
							const proxyContractFactory = new ethers.ContractFactory(
								customABI,
								{
									object: bytecode
								},
								wallet
							)

							const { nonce: deployNonce } =
								await services.ethers.aquireLockAndNonce(chainId)

							const deployTx = await proxyContractFactory.deploy(...args, {
								nonce: deployNonce,
								gasPrice: services.web3.gweiToWei(recommendedGwei),
								gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
							})

							await services.ethers.releaseLockAndNonce({
								chainId,
								nonce: deployNonce
							})

							// Init proxy
							const { nonce: cutNonce } =
								await services.ethers.aquireLockAndNonce(chainId)

							const cuts = getCuts({
								proxyContractAddress: deployTx.address,
								fromVersion,
								toVersion
							})

							const facetCuts = cuts.map(c => ({
								target: c.facetAddress,
								action: c.action,
								selectors: c.functionSelectors
							}))

							const cutTx = await deployTx.diamondCut(
								facetCuts,
								deployTx.address,
								functionCall,
								{
									nonce: cutNonce,
									gasPrice: services.web3.gweiToWei(recommendedGwei),
									gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
								}
							)

							log.debug(`Diamond cut w/ tx: ${cutTx.hash}`)

							await cutTx.wait()

							await services.ethers.releaseLockAndNonce({
								chainId,
								nonce: cutNonce
							})

							const result = await services.storage.createTable({
								chainId,
								schema: columns,
								controllerAddress: deployTx.address
							})

							transaction.status = MeemAPI.TransactionStatus.Success
							transaction.hash = result.txnHash

							const transactions = agreementExtension.metadata?.transactions
							if (Array.isArray(agreementExtension.metadata?.transactions)) {
								const idx = transactions?.findIndex(
									tx => tx.TransactionId === transaction.id
								)
								if (transactions && typeof idx !== 'undefined' && idx > -1) {
									transactions[idx] = {
										...transactions[idx],
										status: MeemAPI.TransactionStatus.Success
									}
								}
							}

							agreementExtension.metadata = {
								...agreementExtension.metadata,
								transactions,
								storage: {
									...agreementExtension.metadata?.storage,
									tableland: {
										...agreementExtension.metadata?.storage?.tableland,
										[tableName]: {
											tableId: result.tableId?.toHexString(),
											tablelandTableName: result.name
										}
									}
								}
							} as MeemAPI.IAgreementExtensionMetadata
							agreementExtension.changed('metadata', true)

							await transaction.save({ transaction: t })
							await agreementExtension.save({ transaction: t })

							await t.commit()
						} catch (e) {
							log.crit(e)
							if (agreementExtension) {
								const transactions = agreementExtension.metadata?.transactions
								if (Array.isArray(agreementExtension.metadata?.transactions)) {
									const idx = transactions?.findIndex(
										tx => tx.TransactionId === transaction.id
									)
									if (transactions && typeof idx !== 'undefined' && idx > -1) {
										transactions[idx] = {
											...transactions[idx],
											status: MeemAPI.TransactionStatus.Failure
										}
									}
								}

								agreementExtension.metadata = {
									...agreementExtension.metadata,
									transactions
								} as MeemAPI.IAgreementExtensionMetadata
								agreementExtension.changed('metadata', true)
							}

							transaction.status = MeemAPI.TransactionStatus.Failure
							await transaction.save()
						}

						break
					}

					case MeemAPI.QueueEvent.CallContract: {
						const { nonce } = await services.ethers.aquireLockAndNonce(chainId)
						const { contractTxId, functionSignature, inputValues } =
							transactionInput as ICallContractInput
						let { contractAddress } = transactionInput as ICallContractInput

						const { provider, wallet } = await services.ethers.getProvider({
							chainId
						})

						if (!contractAddress && contractTxId) {
							const contractTransaction = await orm.models.Transaction.findOne({
								where: {
									id: contractTxId
								}
							})

							if (!contractTransaction) {
								log.crit('Contract transaction not found')
								throw new Error('TRANSACTION_NOT_FOUND')
							}

							const result = await provider.core.getTransactionReceipt(
								contractTransaction.hash
							)
							contractAddress = result?.contractAddress
						}

						if (!contractAddress) {
							throw new Error('CONTRACT_ADDRESS_NOT_FOUND')
						}

						// Encode and send the transaction
						log.debug({
							id,
							value: '0',
							type: TransactionType.callContract,
							to: contractAddress,
							functionSignature,
							inputValues
						})
						const encoded = encodeSingle({
							id,
							abi: customABI
								? JSON.stringify(customABI)
								: JSON.stringify(meemABI),
							value: '0',
							type: TransactionType.callContract,
							to: contractAddress,
							functionSignature,
							inputValues
						})

						const signedTx = await wallet.signTransaction({
							...encoded,
							gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT),
							gasPrice: services.web3.gweiToWei(recommendedGwei),
							nonce,
							chainId
						})

						const tx = await provider.transact.sendTransaction(signedTx)
						transaction.hash = tx.hash

						log.debug(`Running ${functionSignature} w/ hash: ${tx.hash}`)

						await transaction.save()

						try {
							// Update the transaction status in the db
							await tx.wait()
							transaction.status = MeemAPI.TransactionStatus.Success
							await transaction.save()
						} catch (e) {
							log.warn(e)
							transaction.status = MeemAPI.TransactionStatus.Failure
							await transaction.save()
						}
						break
					}

					case MeemAPI.QueueEvent.DeployContract: {
						if (!customABI) {
							log.crit('Missing ABI for DeployContract task')
							throw new Error('MISSING_PARAMETERS')
						}

						const { provider, wallet } = await services.ethers.getProvider({
							chainId
						})

						const { args, bytecode } =
							transactionInput as IDeployTransactionInput

						const proxyContractFactory = new ethers.ContractFactory(
							customABI,
							{
								object: bytecode
							},
							wallet
						)

						const { nonce } = await services.ethers.aquireLockAndNonce(chainId)

						const unsignedTx = proxyContractFactory.getDeployTransaction(
							...args,
							{
								gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT),
								gasPrice: services.web3.gweiToWei(recommendedGwei),
								nonce
							}
						)

						unsignedTx.chainId = chainId

						const signedTx = await wallet.signTransaction(unsignedTx)

						const tx = await provider.transact.sendTransaction(signedTx)

						transaction.hash = tx.hash
						await transaction.save()

						log.debug(`Deploying contract w/ hash: ${tx.hash}`)

						try {
							// Update the transaction status in the db
							await tx.wait()
							transaction.status = MeemAPI.TransactionStatus.Success
							await transaction.save()
						} catch (e) {
							log.warn(e)
							transaction.status = MeemAPI.TransactionStatus.Failure
							await transaction.save()
						}

						break
					}

					case MeemAPI.QueueEvent.DiamondCut: {
						if (!customABI) {
							log.crit('Missing ABI for DeployContract task')
							throw new Error('MISSING_PARAMETERS')
						}

						const { provider, wallet } = await services.ethers.getProvider({
							chainId
						})

						const { contractTxId, fromVersion, toVersion, functionCall } =
							transactionInput as IDiamondCutTransactionInput
						let { contractAddress } =
							transactionInput as IDiamondCutTransactionInput

						if (!contractAddress) {
							const contractTransaction = await orm.models.Transaction.findOne({
								where: {
									id: contractTxId
								}
							})

							if (!contractTransaction) {
								log.crit('Contract transaction not found')
								throw new Error('TRANSACTION_NOT_FOUND')
							}

							const result = await provider.core.getTransactionReceipt(
								contractTransaction.hash
							)
							contractAddress = result?.contractAddress
						}

						if (!contractAddress) {
							throw new Error('CONTRACT_ADDRESS_NOT_FOUND')
						}

						const proxyContract = new ethers.Contract(
							contractAddress,
							customABI,
							wallet
						)

						const { nonce } = await services.ethers.aquireLockAndNonce(chainId)

						const cuts = getCuts({
							proxyContractAddress: proxyContract.address,
							fromVersion,
							toVersion
						})

						const facetCuts = cuts.map(c => ({
							target: c.facetAddress,
							action: c.action,
							selectors: c.functionSelectors
						}))

						const tx = await proxyContract.diamondCut(
							facetCuts,
							contractAddress,
							functionCall,
							{
								nonce,
								gasPrice: services.web3.gweiToWei(recommendedGwei),
								gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
							}
						)

						transaction.hash = tx.hash
						await transaction.save()

						log.debug(`DiamondCut contract w/ hash: ${tx.hash}`)

						try {
							// Update the transaction status in the db
							await tx.wait()
							transaction.status = MeemAPI.TransactionStatus.Success
							await transaction.save()
						} catch (e) {
							log.warn(e)
							transaction.status = MeemAPI.TransactionStatus.Failure
							await transaction.save()
						}

						break
					}

					default:
						log.warn(`No event handlers for ${event.eventName}`)
						break
				}
				log.debug('Finished processing event')
				await services.ethers.releaseLock(chainId)
			} catch (e) {
				log.crit(e)
				await services.ethers.releaseLock(chainId)
				transaction.status = MeemAPI.TransactionStatus.Failure
				await transaction.save()
			}
		} catch (e) {
			log.crit(e)
			await services.ethers.releaseLock(chainId)
		}
	}

	public static sendMessage(message: AWS.SQS.SendMessageBatchRequestEntry) {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			const sqs = new AWS.SQS({
				region: 'us-east-1',
				apiVersion: '2012-11-05',
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
			})

			sqs.sendMessageBatch(
				{
					QueueUrl: config.SQS_QUEUE_URL,
					Entries: [message]
				},
				(err, response) => {
					if (err) {
						log.warn(err)
						reject(err)
						return
					}
					resolve(response)
				}
			)
		})
	}
}
