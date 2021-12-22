# [1.3.0](https://github.com/meemproject/meem-api-aws/compare/v1.2.4...v1.3.0) (2021-12-22)


### Bug Fixes

* bignumber overflow ([ce8b6fe](https://github.com/meemproject/meem-api-aws/commit/ce8b6fe))
* use big numbers for token id ([dde282f](https://github.com/meemproject/meem-api-aws/commit/dde282f))


### Features

* add "hasApplied" to MeemPass w/ endpoint to update ([3a99b68](https://github.com/meemproject/meem-api-aws/commit/3a99b68))
* add postgres DB support ([f833448](https://github.com/meemproject/meem-api-aws/commit/f833448))
* contract abis / types for Meem id and auctions; stubbed out tweet/hashtag model relationship ([23e09db](https://github.com/meemproject/meem-api-aws/commit/23e09db))
* create child meems; M0 project creation ([4e9885e](https://github.com/meemproject/meem-api-aws/commit/4e9885e))
* default twitter / wallet ([cc9d5a4](https://github.com/meemproject/meem-api-aws/commit/cc9d5a4))
* emit to specific address and add JWT to meem updated event ([07e62f0](https://github.com/meemproject/meem-api-aws/commit/07e62f0))
* get me endpoint ([e233b34](https://github.com/meemproject/meem-api-aws/commit/e233b34))
* listen to Meem contract events ([48b499f](https://github.com/meemproject/meem-api-aws/commit/48b499f))
* MeemId / MVP of meempass ([dc4a4b8](https://github.com/meemproject/meem-api-aws/commit/dc4a4b8))
* remove from meem id ([0dfe28a](https://github.com/meemproject/meem-api-aws/commit/0dfe28a))
* return Meem data attribute ([1051685](https://github.com/meemproject/meem-api-aws/commit/1051685))

## [1.2.4](https://github.com/meemproject/meem-api-aws/compare/v1.2.3...v1.2.4) (2021-12-02)

## [1.2.3](https://github.com/meemproject/meem-api-aws/compare/v1.2.2...v1.2.3) (2021-12-02)

## [1.2.2](https://github.com/meemproject/meem-api-aws/compare/v1.2.1...v1.2.2) (2021-12-02)

## [1.2.1](https://github.com/meemproject/meem-api-aws/compare/v1.2.0...v1.2.1) (2021-12-02)


### Bug Fixes

* default to max gas fee instead of throwing error ([d2d6aea](https://github.com/meemproject/meem-api-aws/commit/d2d6aea))

# [1.2.0](https://github.com/meemproject/meem-api-aws/compare/v1.1.2...v1.2.0) (2021-12-01)


### Features

* combine whitelist / access ([94a2afe](https://github.com/meemproject/meem-api-aws/commit/94a2afe))

## [1.1.2](https://github.com/meemproject/meem-api-aws/compare/v1.1.1...v1.1.2) (2021-11-30)

## [1.1.1](https://github.com/meemproject/meem-api-aws/compare/v1.1.0...v1.1.1) (2021-11-30)


### Bug Fixes

* catch getWrappedTokens error ([3b5555b](https://github.com/meemproject/meem-api-aws/commit/3b5555b))

# [1.1.0](https://github.com/meemproject/meem-api-aws/compare/v1.0.0...v1.1.0) (2021-11-30)


### Bug Fixes

* cors ([d7c8d7c](https://github.com/meemproject/meem-api-aws/commit/d7c8d7c))
* everything passing lint ([0c43523](https://github.com/meemproject/meem-api-aws/commit/0c43523))
* properly parse contract error messages ([37dba20](https://github.com/meemproject/meem-api-aws/commit/37dba20))
* set quality on create-image output ([910ca11](https://github.com/meemproject/meem-api-aws/commit/910ca11))


### Features

* add mintedAt from contract ([dad454f](https://github.com/meemproject/meem-api-aws/commit/dad454f))
* better gas estimation, multi-chain support ([19e5459](https://github.com/meemproject/meem-api-aws/commit/19e5459))
* cleanup socket subscription on emit failure ([237fcee](https://github.com/meemproject/meem-api-aws/commit/237fcee))
* fetch already-wrapped tokens ([ae3b530](https://github.com/meemproject/meem-api-aws/commit/ae3b530))
* flag to ignore whitelist ([dc5bb38](https://github.com/meemproject/meem-api-aws/commit/dc5bb38))
* handle contract error codes; refactor minting ([f7f9929](https://github.com/meemproject/meem-api-aws/commit/f7f9929))
* save base64 images to s3 for minting ([3118d5d](https://github.com/meemproject/meem-api-aws/commit/3118d5d))
* sockets and dynamodb ([eff33fb](https://github.com/meemproject/meem-api-aws/commit/eff33fb))
* support multiple chains and test whitelisting ([df61a2a](https://github.com/meemproject/meem-api-aws/commit/df61a2a))

# 1.0.0 (2021-11-04)

# 1.0.0 (2020-10-09)


### Features

* orm, models, sockets ([51720e3](https://github.com/kengoldfarb/starter-api/commit/51720e3))
