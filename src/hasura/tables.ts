export const tables = [
	{
		table: {
			name: 'AgreementExtensionLinks',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'AgreementExtension',
				using: {
					foreign_key_constraint_on: 'AgreementExtensionId'
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'isEnabled',
						'label',
						'url',
						'visibility',
						'metadata',
						'createdAt',
						'updatedAt',
						'AgreementExtensionId',
						'id'
					],
					filter: {
						visibility: {
							_eq: 'anyone'
						}
					}
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'isEnabled',
						'label',
						'url',
						'visibility',
						'metadata',
						'createdAt',
						'updatedAt',
						'AgreementExtensionId',
						'id'
					],
					filter: {
						_and: [
							{
								AgreementExtension: {
									Agreement: {
										AgreementTokens: {
											OwnerId: {
												_eq: 'x-hasura-wallet-id'
											}
										}
									}
								}
							},
							{
								visibility: {
									_in: ['token-holders', 'anyone']
								}
							}
						]
					}
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'isEnabled',
						'label',
						'url',
						'visibility',
						'metadata',
						'createdAt',
						'updatedAt',
						'AgreementExtensionId',
						'id'
					],
					filter: {
						visibility: {
							_eq: 'anyone'
						}
					}
				}
			}
		]
	},
	{
		table: {
			name: 'AgreementExtensionRoles',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'AgreementExtension',
				using: {
					foreign_key_constraint_on: 'AgreementExtensionId'
				}
			},
			{
				name: 'AgreementRole',
				using: {
					foreign_key_constraint_on: 'AgreementRoleId'
				}
			}
		]
	},
	{
		table: {
			name: 'AgreementExtensionStorages',
			schema: 'public'
		}
	},
	{
		table: {
			name: 'AgreementExtensionWidgets',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'AgreementExtension',
				using: {
					foreign_key_constraint_on: 'AgreementExtensionId'
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'isEnabled',
						'visibility',
						'metadata',
						'createdAt',
						'updatedAt',
						'AgreementExtensionId',
						'id'
					],
					filter: {
						visibility: {
							_eq: 'anyone'
						}
					}
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'isEnabled',
						'visibility',
						'metadata',
						'createdAt',
						'updatedAt',
						'AgreementExtensionId',
						'id'
					],
					filter: {
						_and: [
							{
								AgreementExtension: {
									Agreement: {
										AgreementTokens: {
											OwnerId: {
												_eq: 'x-hasura-wallet-id'
											}
										}
									}
								}
							},
							{
								visibility: {
									_in: ['token-holders', 'anyone']
								}
							}
						]
					}
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'isEnabled',
						'visibility',
						'metadata',
						'createdAt',
						'updatedAt',
						'AgreementExtensionId',
						'id'
					],
					filter: {
						visibility: {
							_eq: 'anyone'
						}
					}
				}
			}
		]
	},
	{
		table: {
			name: 'AgreementExtensions',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Agreement',
				using: {
					foreign_key_constraint_on: 'AgreementId'
				}
			},
			{
				name: 'AgreementRole',
				using: {
					foreign_key_constraint_on: 'AgreementRoleId'
				}
			},
			{
				name: 'Extension',
				using: {
					foreign_key_constraint_on: 'ExtensionId'
				}
			}
		],
		array_relationships: [
			{
				name: 'AgreementExtensionLinks',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementExtensionId',
						table: {
							name: 'AgreementExtensionLinks',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementExtensionRoles',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementExtensionId',
						table: {
							name: 'AgreementExtensionRoles',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementExtensionWidgets',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementExtensionId',
						table: {
							name: 'AgreementExtensionWidgets',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementRoleExtensions',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementExtensionId',
						table: {
							name: 'AgreementRoleExtensions',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'AgreementId',
						'AgreementRoleId',
						'ExtensionId',
						'createdAt',
						'id',
						'isInitialized',
						'metadata',
						'updatedAt'
					],
					filter: {}
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'AgreementId',
						'AgreementRoleId',
						'ExtensionId',
						'createdAt',
						'id',
						'isInitialized',
						'metadata',
						'updatedAt'
					],
					filter: {}
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'AgreementId',
						'AgreementRoleId',
						'ExtensionId',
						'createdAt',
						'id',
						'isInitialized',
						'metadata',
						'updatedAt'
					],
					filter: {}
				}
			}
		]
	},
	{
		table: {
			name: 'AgreementRoleExtensions',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Agreement',
				using: {
					foreign_key_constraint_on: 'AgreementId'
				}
			},
			{
				name: 'AgreementExtension',
				using: {
					foreign_key_constraint_on: 'AgreementExtensionId'
				}
			},
			{
				name: 'AgreementRole',
				using: {
					foreign_key_constraint_on: 'AgreementRoleId'
				}
			},
			{
				name: 'Extension',
				using: {
					foreign_key_constraint_on: 'ExtensionId'
				}
			}
		]
	},
	{
		table: {
			name: 'AgreementRoleTokenTransfers',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'AgreementRoleToken',
				using: {
					foreign_key_constraint_on: 'AgreementRoleTokenId'
				}
			}
		]
	},
	{
		table: {
			name: 'AgreementRoleTokens',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Agreement',
				using: {
					foreign_key_constraint_on: 'AgreementId'
				}
			},
			{
				name: 'AgreementRole',
				using: {
					foreign_key_constraint_on: 'AgreementRoleId'
				}
			},
			{
				name: 'Wallet',
				using: {
					foreign_key_constraint_on: 'OwnerId'
				}
			}
		],
		array_relationships: [
			{
				name: 'AgreementRoleTokenTransfers',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementRoleTokenId',
						table: {
							name: 'AgreementRoleTokenTransfers',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'mintedBy',
						'tokenId',
						'metadata',
						'tokenURI',
						'createdAt',
						'mintedAt',
						'updatedAt',
						'AgreementId',
						'AgreementRoleId',
						'id',
						'OwnerId'
					],
					filter: {
						Agreement: {
							AgreementTokens: {
								OwnerId: {
									_eq: 'x-hasura-wallet-id'
								}
							}
						}
					}
				}
			}
		]
	},
	{
		table: {
			name: 'AgreementRoleWallets',
			schema: 'public'
		}
	},
	{
		table: {
			name: 'AgreementRoles',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Agreement',
				using: {
					foreign_key_constraint_on: 'AgreementId'
				}
			},
			{
				name: 'AgreementExtension',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementRoleId',
						table: {
							name: 'AgreementExtensions',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'Transaction',
				using: {
					foreign_key_constraint_on: 'TransactionId'
				}
			},
			{
				name: 'Wallet',
				using: {
					foreign_key_constraint_on: 'OwnerId'
				}
			}
		],
		array_relationships: [
			{
				name: 'AgreementRoleExtensions',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementRoleId',
						table: {
							name: 'AgreementRoleExtensions',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementRoleTokens',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementRoleId',
						table: {
							name: 'AgreementRoleTokens',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'isAdminRole',
						'isTransferrable',
						'address',
						'adminContractAddress',
						'ens',
						'maxSupply',
						'name',
						'slug',
						'symbol',
						'chainId',
						'metadata',
						'mintPermissions',
						'splits',
						'contractURI',
						'createdAt',
						'ensFetchedAt',
						'ownerFetchedAt',
						'updatedAt',
						'AgreementId',
						'id',
						'OwnerId',
						'TransactionId'
					],
					filter: {}
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'isAdminRole',
						'isTransferrable',
						'address',
						'adminContractAddress',
						'ens',
						'maxSupply',
						'name',
						'slug',
						'symbol',
						'chainId',
						'metadata',
						'mintPermissions',
						'splits',
						'contractURI',
						'createdAt',
						'ensFetchedAt',
						'ownerFetchedAt',
						'updatedAt',
						'AgreementId',
						'id',
						'OwnerId',
						'TransactionId'
					],
					filter: {}
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'isAdminRole',
						'isTransferrable',
						'address',
						'adminContractAddress',
						'ens',
						'maxSupply',
						'name',
						'slug',
						'symbol',
						'chainId',
						'metadata',
						'mintPermissions',
						'splits',
						'contractURI',
						'createdAt',
						'ensFetchedAt',
						'ownerFetchedAt',
						'updatedAt',
						'AgreementId',
						'id',
						'OwnerId',
						'TransactionId'
					],
					filter: {}
				}
			}
		]
	},
	{
		table: {
			name: 'AgreementTokenTransfers',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'AgreementToken',
				using: {
					foreign_key_constraint_on: 'AgreementTokenId'
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'from',
						'to',
						'transactionHash',
						'createdAt',
						'transferredAt',
						'updatedAt',
						'AgreementTokenId',
						'id'
					],
					filter: {}
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'from',
						'to',
						'transactionHash',
						'createdAt',
						'transferredAt',
						'updatedAt',
						'AgreementTokenId',
						'id'
					],
					filter: {}
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'from',
						'to',
						'transactionHash',
						'createdAt',
						'transferredAt',
						'updatedAt',
						'AgreementTokenId',
						'id'
					],
					filter: {}
				}
			}
		]
	},
	{
		table: {
			name: 'AgreementTokens',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Agreement',
				using: {
					foreign_key_constraint_on: 'AgreementId'
				}
			},
			{
				name: 'Transaction',
				using: {
					foreign_key_constraint_on: 'TransactionId'
				}
			},
			{
				name: 'Wallet',
				using: {
					foreign_key_constraint_on: 'OwnerId'
				}
			}
		],
		array_relationships: [
			{
				name: 'AgreementTokenTransfers',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementTokenId',
						table: {
							name: 'AgreementTokenTransfers',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'AgreementId',
						'OwnerId',
						'createdAt',
						'id',
						'metadata',
						'mintedAt',
						'mintedBy',
						'tokenId',
						'tokenURI'
					],
					filter: {}
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'AgreementId',
						'OwnerId',
						'createdAt',
						'id',
						'metadata',
						'mintedAt',
						'mintedBy',
						'tokenId',
						'tokenURI'
					],
					filter: {}
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'AgreementId',
						'OwnerId',
						'createdAt',
						'id',
						'metadata',
						'mintedAt',
						'mintedBy',
						'tokenId',
						'tokenURI'
					],
					filter: {},
					allow_aggregations: true
				}
			}
		]
	},
	{
		table: {
			name: 'AgreementWallets',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Agreement',
				using: {
					foreign_key_constraint_on: 'AgreementId'
				}
			},
			{
				name: 'Wallet',
				using: {
					foreign_key_constraint_on: 'WalletId'
				}
			}
		],
		select_permissions: [
			{
				role: 'mutualClubMember',
				permission: {
					columns: ['AgreementId', 'WalletId', 'createdAt', 'id', 'role'],
					filter: {
						Agreement: {
							AgreementTokens: {
								OwnerId: {
									_eq: 'x-hasura-wallet-id'
								}
							}
						}
					}
				}
			},
			{
				role: 'user',
				permission: {
					columns: ['AgreementId', 'WalletId', 'createdAt', 'id', 'role'],
					filter: {
						Agreement: {
							AgreementTokens: {
								OwnerId: {
									_eq: 'x-hasura-wallet-id'
								}
							}
						}
					}
				}
			}
		]
	},
	{
		table: {
			name: 'Agreements',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Transaction',
				using: {
					foreign_key_constraint_on: 'TransactionId'
				}
			},
			{
				name: 'Wallet',
				using: {
					foreign_key_constraint_on: 'OwnerId'
				}
			}
		],
		array_relationships: [
			{
				name: 'AgreementExtensions',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementId',
						table: {
							name: 'AgreementExtensions',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementRoleExtensions',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementId',
						table: {
							name: 'AgreementRoleExtensions',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementRoleTokens',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementId',
						table: {
							name: 'AgreementRoleTokens',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementRoles',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementId',
						table: {
							name: 'AgreementRoles',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementTokens',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementId',
						table: {
							name: 'AgreementTokens',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementWallets',
				using: {
					foreign_key_constraint_on: {
						column: 'AgreementId',
						table: {
							name: 'AgreementWallets',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'address',
						'chainId',
						'contractURI',
						'createdAt',
						'ens',
						'id',
						'isLaunched',
						'isTransferrable',
						'maxSupply',
						'metadata',
						'mintPermissions',
						'name',
						'slug',
						'splits',
						'symbol'
					],
					filter: {}
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'OwnerId',
						'address',
						'adminContractAddress',
						'chainId',
						'contractURI',
						'createdAt',
						'ens',
						'ensFetchedAt',
						'gnosisSafeAddress',
						'id',
						'isLaunched',
						'isTransferrable',
						'maxSupply',
						'metadata',
						'mintPermissions',
						'name',
						'ownerFetchedAt',
						'slug',
						'splits',
						'symbol',
						'updatedAt'
					],
					filter: {
						AgreementTokens: {
							OwnerId: {
								_eq: 'x-hasura-wallet-id'
							}
						}
					}
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'OwnerId',
						'address',
						'adminContractAddress',
						'chainId',
						'contractURI',
						'createdAt',
						'ens',
						'gnosisSafeAddress',
						'id',
						'isLaunched',
						'isTransferrable',
						'maxSupply',
						'metadata',
						'mintPermissions',
						'name',
						'slug',
						'splits',
						'symbol'
					],
					filter: {
						AgreementTokens: {
							OwnerId: {
								_eq: 'x-hasura-wallet-id'
							}
						}
					}
				}
			}
		]
	},
	{
		table: {
			name: 'BundleContracts',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Bundle',
				using: {
					foreign_key_constraint_on: 'BundleId'
				}
			},
			{
				name: 'Contract',
				using: {
					foreign_key_constraint_on: 'ContractId'
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'order',
						'functionSelectors',
						'createdAt',
						'updatedAt',
						'BundleId',
						'ContractId',
						'id'
					],
					filter: {},
					allow_aggregations: true
				}
			}
		]
	},
	{
		table: {
			name: 'Bundles',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Creator',
				using: {
					foreign_key_constraint_on: 'CreatorId'
				}
			}
		],
		array_relationships: [
			{
				name: 'BundleContracts',
				using: {
					foreign_key_constraint_on: {
						column: 'BundleId',
						table: {
							name: 'BundleContracts',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'name',
						'abi',
						'description',
						'types',
						'createdAt',
						'updatedAt',
						'CreatorId',
						'id'
					],
					filter: {}
				}
			}
		]
	},
	{
		table: {
			name: 'ChainNonces',
			schema: 'public'
		}
	},
	{
		table: {
			name: 'ContractInstances',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Contract',
				using: {
					foreign_key_constraint_on: 'ContractId'
				}
			}
		],
		array_relationships: [
			{
				name: 'WalletContractInstances',
				using: {
					foreign_key_constraint_on: {
						column: 'ContractInstanceId',
						table: {
							name: 'WalletContractInstances',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'address',
						'chainId',
						'createdAt',
						'updatedAt',
						'ContractId',
						'id'
					],
					filter: {}
				}
			}
		]
	},
	{
		table: {
			name: 'Contracts',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Creator',
				using: {
					foreign_key_constraint_on: 'CreatorId'
				}
			}
		],
		array_relationships: [
			{
				name: 'BundleContracts',
				using: {
					foreign_key_constraint_on: {
						column: 'ContractId',
						table: {
							name: 'BundleContracts',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'ContractInstances',
				using: {
					foreign_key_constraint_on: {
						column: 'ContractId',
						table: {
							name: 'ContractInstances',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'contractType',
						'name',
						'version',
						'abi',
						'functionSelectors',
						'bytecode',
						'description',
						'createdAt',
						'updatedAt',
						'CreatorId',
						'id'
					],
					filter: {}
				}
			}
		]
	},
	{
		table: {
			name: 'Extensions',
			schema: 'public'
		},
		array_relationships: [
			{
				name: 'AgreementExtensions',
				using: {
					foreign_key_constraint_on: {
						column: 'ExtensionId',
						table: {
							name: 'AgreementExtensions',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementRoleExtensions',
				using: {
					foreign_key_constraint_on: {
						column: 'ExtensionId',
						table: {
							name: 'AgreementRoleExtensions',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'description',
						'guideUrl',
						'icon',
						'name',
						'slug',
						'storageDefinition',
						'createdAt',
						'updatedAt',
						'id'
					],
					filter: {}
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'description',
						'guideUrl',
						'icon',
						'name',
						'slug',
						'storageDefinition',
						'createdAt',
						'updatedAt',
						'id'
					],
					filter: {}
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'description',
						'guideUrl',
						'icon',
						'name',
						'slug',
						'storageDefinition',
						'createdAt',
						'updatedAt',
						'id'
					],
					filter: {}
				}
			}
		]
	},
	{
		table: {
			name: 'IdentityProviders',
			schema: 'public'
		},
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'connectionId',
						'connectionName',
						'description',
						'icon',
						'id',
						'name'
					],
					filter: {}
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'connectionId',
						'connectionName',
						'description',
						'icon',
						'id',
						'name'
					],
					filter: {}
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'connectionId',
						'connectionName',
						'description',
						'icon',
						'id',
						'name'
					],
					filter: {}
				}
			}
		]
	},
	{
		table: {
			name: 'Integrations',
			schema: 'public'
		},
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'description',
						'guideUrl',
						'icon',
						'name',
						'createdAt',
						'deletedAt',
						'updatedAt',
						'id'
					],
					filter: {},
					allow_aggregations: true
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'description',
						'guideUrl',
						'icon',
						'name',
						'createdAt',
						'deletedAt',
						'updatedAt',
						'id'
					],
					filter: {},
					allow_aggregations: true
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'description',
						'guideUrl',
						'icon',
						'name',
						'createdAt',
						'deletedAt',
						'updatedAt',
						'id'
					],
					filter: {},
					allow_aggregations: true
				}
			}
		]
	},
	{
		table: {
			name: 'RolePermissions',
			schema: 'public'
		},
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'description',
						'id',
						'name',
						'createdAt',
						'deletedAt',
						'updatedAt'
					],
					filter: {},
					allow_aggregations: true
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'description',
						'id',
						'name',
						'createdAt',
						'deletedAt',
						'updatedAt'
					],
					filter: {},
					allow_aggregations: true
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'description',
						'id',
						'name',
						'createdAt',
						'deletedAt',
						'updatedAt'
					],
					filter: {},
					allow_aggregations: true
				}
			}
		]
	},
	{
		table: {
			name: 'SequelizeMeta',
			schema: 'public'
		}
	},
	{
		table: {
			name: 'Transactions',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'Wallet',
				using: {
					foreign_key_constraint_on: 'WalletId'
				}
			}
		],
		array_relationships: [
			{
				name: 'AgreementRoles',
				using: {
					foreign_key_constraint_on: {
						column: 'TransactionId',
						table: {
							name: 'AgreementRoles',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementTokens',
				using: {
					foreign_key_constraint_on: {
						column: 'TransactionId',
						table: {
							name: 'AgreementTokens',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'Agreements',
				using: {
					foreign_key_constraint_on: {
						column: 'TransactionId',
						table: {
							name: 'Agreements',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'WalletId',
						'chainId',
						'createdAt',
						'hash',
						'id',
						'status',
						'transactionInput',
						'transactionType',
						'updatedAt'
					],
					filter: {},
					allow_aggregations: true
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'WalletId',
						'chainId',
						'createdAt',
						'hash',
						'id',
						'status',
						'transactionInput',
						'transactionType',
						'updatedAt'
					],
					filter: {},
					allow_aggregations: true
				}
			}
		]
	},
	{
		table: {
			name: 'Transfers',
			schema: 'public'
		},
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'from',
						'to',
						'transactionHash',
						'createdAt',
						'deletedAt',
						'transferredAt',
						'updatedAt',
						'id',
						'MeemId'
					],
					filter: {},
					allow_aggregations: true
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'from',
						'to',
						'transactionHash',
						'createdAt',
						'deletedAt',
						'transferredAt',
						'updatedAt',
						'id',
						'MeemId'
					],
					filter: {},
					allow_aggregations: true
				}
			}
		]
	},
	{
		table: {
			name: 'UserIdentities',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'IdentityProvider',
				using: {
					foreign_key_constraint_on: 'IdentityProviderId'
				}
			},
			{
				name: 'User',
				using: {
					foreign_key_constraint_on: 'UserId'
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'IdentityProviderId',
						'UserId',
						'id',
						'metadata',
						'visibility'
					],
					filter: {
						visibility: {
							_eq: 'anyone'
						}
					}
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'IdentityProviderId',
						'UserId',
						'id',
						'metadata',
						'visibility'
					],
					filter: {
						_or: [
							{
								visibility: {
									_eq: 'anyone'
								}
							},
							{
								_and: [
									{
										visibility: {
											_eq: 'mutualClubMembers'
										}
									},
									{
										User: {
											Wallets: {
												AgreementTokens: {
													Agreement: {
														AgreementTokens: {
															OwnerId: {
																_eq: 'x-hasura-user-id'
															}
														}
													}
												}
											}
										}
									}
								]
							}
						]
					}
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'IdentityProviderId',
						'UserId',
						'id',
						'metadata',
						'visibility'
					],
					filter: {
						UserId: {
							_eq: 'x-hasura-user-id'
						}
					}
				}
			}
		]
	},
	{
		table: {
			name: 'Users',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'DefaultWallet',
				using: {
					foreign_key_constraint_on: 'DefaultWalletId'
				}
			}
		],
		array_relationships: [
			{
				name: 'UserIdentities',
				using: {
					foreign_key_constraint_on: {
						column: 'UserId',
						table: {
							name: 'UserIdentities',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'Wallets',
				using: {
					foreign_key_constraint_on: {
						column: 'UserId',
						table: {
							name: 'Wallets',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: ['displayName', 'id', 'profilePicUrl'],
					filter: {}
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: ['DefaultWalletId', 'displayName', 'id', 'profilePicUrl'],
					filter: {
						Wallets: {
							AgreementTokens: {
								Agreement: {
									AgreementTokens: {
										OwnerId: {
											_eq: 'x-hasura-wallet-id'
										}
									}
								}
							}
						}
					}
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'displayName',
						'profilePicUrl',
						'createdAt',
						'updatedAt',
						'DefaultWalletId',
						'id'
					],
					filter: {
						id: {
							_eq: 'x-hasura-user-id'
						}
					}
				}
			}
		]
	},
	{
		table: {
			name: 'WalletContractInstances',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'ContractInstance',
				using: {
					foreign_key_constraint_on: 'ContractInstanceId'
				}
			},
			{
				name: 'Wallet',
				using: {
					foreign_key_constraint_on: 'WalletId'
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: [
						'name',
						'note',
						'createdAt',
						'updatedAt',
						'ContractInstanceId',
						'id',
						'WalletId'
					],
					filter: {},
					allow_aggregations: true
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: [
						'name',
						'note',
						'createdAt',
						'updatedAt',
						'ContractInstanceId',
						'id',
						'WalletId'
					],
					filter: {},
					allow_aggregations: true
				}
			},
			{
				role: 'user',
				permission: {
					columns: [
						'name',
						'note',
						'createdAt',
						'updatedAt',
						'ContractInstanceId',
						'id',
						'WalletId'
					],
					filter: {},
					allow_aggregations: true
				}
			}
		]
	},
	{
		table: {
			name: 'Wallets',
			schema: 'public'
		},
		object_relationships: [
			{
				name: 'User',
				using: {
					foreign_key_constraint_on: 'UserId'
				}
			}
		],
		array_relationships: [
			{
				name: 'AgreementRoleTokens',
				using: {
					foreign_key_constraint_on: {
						column: 'OwnerId',
						table: {
							name: 'AgreementRoleTokens',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementRoles',
				using: {
					foreign_key_constraint_on: {
						column: 'OwnerId',
						table: {
							name: 'AgreementRoles',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementTokens',
				using: {
					foreign_key_constraint_on: {
						column: 'OwnerId',
						table: {
							name: 'AgreementTokens',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'AgreementWallets',
				using: {
					foreign_key_constraint_on: {
						column: 'WalletId',
						table: {
							name: 'AgreementWallets',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'Agreements',
				using: {
					foreign_key_constraint_on: {
						column: 'OwnerId',
						table: {
							name: 'Agreements',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'Bundles',
				using: {
					foreign_key_constraint_on: {
						column: 'CreatorId',
						table: {
							name: 'Bundles',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'Contracts',
				using: {
					foreign_key_constraint_on: {
						column: 'CreatorId',
						table: {
							name: 'Contracts',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'Transactions',
				using: {
					foreign_key_constraint_on: {
						column: 'WalletId',
						table: {
							name: 'Transactions',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'Users',
				using: {
					foreign_key_constraint_on: {
						column: 'DefaultWalletId',
						table: {
							name: 'Users',
							schema: 'public'
						}
					}
				}
			},
			{
				name: 'WalletContractInstances',
				using: {
					foreign_key_constraint_on: {
						column: 'WalletId',
						table: {
							name: 'WalletContractInstances',
							schema: 'public'
						}
					}
				}
			}
		],
		select_permissions: [
			{
				role: 'anonymous',
				permission: {
					columns: ['address', 'ens', 'id'],
					filter: {},
					allow_aggregations: true
				}
			},
			{
				role: 'mutualClubMember',
				permission: {
					columns: ['address', 'ens', 'id'],
					filter: {},
					allow_aggregations: true
				}
			},
			{
				role: 'user',
				permission: {
					columns: ['address', 'apiKey', 'dailyTXLimit', 'ens', 'id'],
					filter: {
						id: {
							_eq: 'x-hasura-wallet-id'
						}
					},
					allow_aggregations: true
				}
			}
		]
	}
]
