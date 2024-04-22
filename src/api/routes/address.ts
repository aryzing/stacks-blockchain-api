import { asyncHandler } from '../async-handler';
import * as Bluebird from 'bluebird';
import { BlockIdentifier } from '../../datastore/common';
import { getPagingQueryLimit, parsePagingQueryInput, ResourceType } from '../pagination';
import {
  isUnanchoredRequest,
  getBlockParams,
  parseUntilBlockQuery,
  validatePrincipal,
} from '../query-helpers';
import {
  formatMapToObject,
  getSendManyContract,
  isValidPrincipal,
  normalizeHashString,
} from '../../helpers';
import {
  getTxFromDataStore,
  parseDbEvent,
  parseDbMempoolTx,
  parseDbTx,
} from '../controllers/db-controller';
import { InvalidRequestError, InvalidRequestErrorType } from '../../errors';
import { decodeClarityValueToRepr } from 'stacks-encoding-native-js';
import { validate } from '../validate';
import { ETagType, setETagCacheHeaders } from '../controllers/express-cache-controller';
import { logger } from '../../logger';
import { has0xPrefix, isProdEnv, Optional, PgSqlClient } from '@hirosystems/api-toolkit';
import { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';
import { Server } from 'http';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { handleChainTipCache } from '../controllers/cache';
import {
  BlockHeightSchema,
  LimitParam,
  OffsetParam,
  PrincipalSchema,
  TransactionIdParamSchema,
  UnanchoredParamSchema,
} from '../schemas/params';
import {
  AddressBalanceResponse,
  AddressBalanceResponseSchema,
  AddressStxBalanceResponse,
  AddressStxBalanceResponseSchema,
  AddressTransactionsListResponseSchema,
} from '../schemas/responses/address';
import { PgStore } from 'src/datastore/pg-store';
import { AddressTransactionWithTransfersSchema } from '../schemas/entities/addresses';
import { ErrorResponseSchema } from '../schemas/responses/responses';

async function getBlockHeight(
  db: PgStore,
  sql: PgSqlClient,
  untilBlock?: number,
  unanchored?: boolean
): Promise<number> {
  return (untilBlock ?? (await db.getChainTip(sql)).block_height) + (unanchored ? 1 : 0);
}

const ChainTipRoutes: FastifyPluginCallback<Record<never, never>, Server, TypeBoxTypeProvider> = (
  fastify,
  _,
  done
) => {
  fastify.addHook('preHandler', handleChainTipCache);

  fastify.get(
    '/:stx_address/stx',
    {
      schema: {
        operationId: 'get_account_stx_balance',
        summary: 'Get account STX balance',
        description: `Retrieves STX token balance for a given Address or Contract Identifier.`,
        tags: ['Accounts'],
        params: Type.Object({
          stx_address: PrincipalSchema,
        }),
        querystring: Type.Object({
          unanchored: Optional(UnanchoredParamSchema),
          until_block: Optional(BlockHeightSchema),
        }),
        response: {
          200: AddressStxBalanceResponseSchema,
        },
      },
    },
    async (req, res) => {
      const stxAddress = req.params.stx_address;
      const result = await fastify.db.sqlTransaction(async sql => {
        const blockHeight = await getBlockHeight(
          fastify.db,
          sql,
          req.query.until_block,
          req.query.unanchored
        );
        const stxBalanceResult = await fastify.db.getStxBalanceAtBlock(stxAddress, blockHeight);
        const tokenOfferingLocked = await fastify.db.getTokenOfferingLocked(
          stxAddress,
          blockHeight
        );
        const result: AddressStxBalanceResponse = {
          balance: stxBalanceResult.balance.toString(),
          total_sent: stxBalanceResult.totalSent.toString(),
          total_received: stxBalanceResult.totalReceived.toString(),
          total_fees_sent: stxBalanceResult.totalFeesSent.toString(),
          total_miner_rewards_received: stxBalanceResult.totalMinerRewardsReceived.toString(),
          lock_tx_id: stxBalanceResult.lockTxId,
          locked: stxBalanceResult.locked.toString(),
          lock_height: stxBalanceResult.lockHeight,
          burnchain_lock_height: stxBalanceResult.burnchainLockHeight,
          burnchain_unlock_height: stxBalanceResult.burnchainUnlockHeight,
        };
        if (tokenOfferingLocked.found) {
          result.token_offering_locked = tokenOfferingLocked.result;
        }
        return result;
      });
      await res.send(result);
    }
  );

  fastify.get(
    '/:stx_address/balances',
    {
      schema: {
        operationId: 'get_account_balance',
        summary: 'Get account balances',
        description: `Retrieves total account balance information for a given Address or Contract Identifier. This includes the balances of  STX Tokens, Fungible Tokens and Non-Fungible Tokens for the account.`,
        tags: ['Accounts'],
        params: Type.Object({
          stx_address: PrincipalSchema,
        }),
        querystring: Type.Object({
          unanchored: Optional(UnanchoredParamSchema),
          until_block: Optional(BlockHeightSchema),
        }),
        response: {
          200: AddressBalanceResponseSchema,
        },
      },
    },
    async (req, res) => {
      const stxAddress = req.params.stx_address;
      const result = await fastify.db.sqlTransaction(async sql => {
        const blockHeight = await getBlockHeight(
          fastify.db,
          sql,
          req.query.until_block,
          req.query.unanchored
        );

        // Get balance info for STX token
        const stxBalanceResult = await fastify.db.getStxBalanceAtBlock(stxAddress, blockHeight);
        const tokenOfferingLocked = await fastify.db.getTokenOfferingLocked(
          stxAddress,
          blockHeight
        );

        // Get balances for fungible tokens
        const ftBalancesResult = await fastify.db.getFungibleTokenBalances({
          stxAddress,
          untilBlock: blockHeight,
        });
        const ftBalances = formatMapToObject(ftBalancesResult, val => {
          return {
            balance: val.balance.toString(),
            total_sent: val.totalSent.toString(),
            total_received: val.totalReceived.toString(),
          };
        });

        // Get counts for non-fungible tokens
        const nftBalancesResult = await fastify.db.getNonFungibleTokenCounts({
          stxAddress,
          untilBlock: blockHeight,
        });
        const nftBalances = formatMapToObject(nftBalancesResult, val => {
          return {
            count: val.count.toString(),
            total_sent: val.totalSent.toString(),
            total_received: val.totalReceived.toString(),
          };
        });

        const result: AddressBalanceResponse = {
          stx: {
            balance: stxBalanceResult.balance.toString(),
            total_sent: stxBalanceResult.totalSent.toString(),
            total_received: stxBalanceResult.totalReceived.toString(),
            total_fees_sent: stxBalanceResult.totalFeesSent.toString(),
            total_miner_rewards_received: stxBalanceResult.totalMinerRewardsReceived.toString(),
            lock_tx_id: stxBalanceResult.lockTxId,
            locked: stxBalanceResult.locked.toString(),
            lock_height: stxBalanceResult.lockHeight,
            burnchain_lock_height: stxBalanceResult.burnchainLockHeight,
            burnchain_unlock_height: stxBalanceResult.burnchainUnlockHeight,
          },
          fungible_tokens: ftBalances,
          non_fungible_tokens: nftBalances,
        };

        if (tokenOfferingLocked.found) {
          result.token_offering_locked = tokenOfferingLocked.result;
        }
        return result;
      });
      await res.send(result);
    }
  );

  // fastify.get(
  //   '/:principal/transactions',
  //   {
  //     schema: {
  //       deprecated: true,
  //       operationId: 'get_account_transactions',
  //       summary: 'Get account transactions',
  //       description: `Retrieves a list of all Transactions for a given Address or Contract Identifier. More information on Transaction types can be found [here](https://docs.stacks.co/understand-stacks/transactions#types).

  //       If you need to actively monitor new transactions for an address or contract id, we highly recommend subscribing to [WebSockets or Socket.io](https://github.com/hirosystems/stacks-blockchain-api/tree/master/client) for real-time updates.`,
  //       tags: ['Accounts'],
  //       params: Type.Object({
  //         principal: PrincipalSchema,
  //       }),
  //       querystring: Type.Object({
  //         offset: OffsetParam(),
  //         limit: LimitParam(ResourceType.Tx),
  //         unanchored: Optional(UnanchoredParamSchema),
  //         until_block: Optional(BlockHeightSchema),
  //         height: Optional(BlockHeightSchema),
  //       }),
  //       response: {
  //         200: AddressTransactionsListResponseSchema,
  //       },
  //     },
  //   },
  //   async (req, res) => {
  //     const principal = req.params.principal;
  //     const limit = req.query.limit ?? getPagingQueryLimit(ResourceType.Tx, req.query.limit);
  //     const offset = req.query.offset ?? 0;

  //     const response = await fastify.db.sqlTransaction(async sql => {
  //       let atSingleBlock = false;
  //       let blockHeight = 0;
  //       if (req.query.height) {
  //         if (req.query.until_block) {
  //           throw new InvalidRequestError(
  //             `can't handle until_block and block_height in the same request`,
  //             InvalidRequestErrorType.invalid_param
  //           );
  //         }
  //         atSingleBlock = true;
  //         blockHeight = req.query.height;
  //       } else {
  //         blockHeight = await getBlockHeight(
  //           fastify.db,
  //           sql,
  //           req.query.until_block,
  //           req.query.unanchored
  //         );
  //       }

  //       const { results: txResults, total } = await fastify.db.getAddressTxs({
  //         stxAddress: principal,
  //         limit,
  //         offset,
  //         blockHeight,
  //         atSingleBlock,
  //       });
  //       const results = txResults.map(dbTx => parseDbTx(dbTx));
  //       const response = { limit, offset, total, results };
  //       return response;
  //     });
  //     await res.send(response);
  //   }
  // );

  // fastify.get(
  //   '/:principal/:tx_id/with_transfers',
  //   {
  //     schema: {
  //       deprecated: true,
  //       operationId: 'get_single_transaction_with_transfers',
  //       summary: 'Get account transaction information for specific transaction',
  //       description: `Retrieves transaction details for a given Transaction Id \`tx_id\`, for a given account or contract Identifier.`,
  //       tags: ['Accounts'],
  //       params: Type.Object({
  //         principal: PrincipalSchema,
  //         tx_id: TransactionIdParamSchema,
  //       }),
  //       response: {
  //         200: AddressTransactionWithTransfersSchema,
  //         404: ErrorResponseSchema,
  //       },
  //     },
  //   },
  //   async (req, res) => {
  //     const stxAddress = req.params.principal;
  //     const tx_id = normalizeHashString(req.params.tx_id) as string;
  //     const result = await fastify.db.sqlTransaction(async sql => {
  //       const results = await fastify.db.getInformationTxsWithStxTransfers({ stxAddress, tx_id });
  //       if (results && results.tx) {
  //         const txQuery = await getTxFromDataStore(fastify.db, {
  //           txId: results.tx.tx_id,
  //           dbTx: results.tx,
  //           includeUnanchored: false,
  //         });
  //         if (!txQuery.found) {
  //           throw new Error('unexpected tx not found -- fix tx enumeration query');
  //         }
  //         const result = {
  //           tx: txQuery.result,
  //           stx_sent: results.stx_sent.toString(),
  //           stx_received: results.stx_received.toString(),
  //           stx_transfers: results.stx_transfers.map(transfer => ({
  //             amount: transfer.amount.toString(),
  //             sender: transfer.sender,
  //             recipient: transfer.recipient,
  //           })),
  //         };
  //         return result;
  //       }
  //     });
  //     if (result) {
  //       await res.send(result);
  //     } else {
  //       await res.status(404).send({ error: 'No matching transaction found' });
  //     }
  //   }
  // );

  /**
   * @deprecated See `/v2/addresses/:address/transactions`
   */
  // router.get(
  //   '/:stx_address/transactions_with_transfers',
  //   cacheHandler,
  //   asyncHandler(async (req, res, next) => {
  //     const stxAddress = req.params['stx_address'];
  //     validatePrincipal(stxAddress);
  //     const untilBlock = parseUntilBlockQuery(req, res, next);

  //     const response = await db.sqlTransaction(async sql => {
  //       const blockParams = getBlockParams(req, res, next);
  //       let atSingleBlock = false;
  //       let blockHeight = 0;
  //       if (blockParams.blockHeight) {
  //         if (untilBlock) {
  //           throw new InvalidRequestError(
  //             `can't handle until_block and block_height in the same request`,
  //             InvalidRequestErrorType.invalid_param
  //           );
  //         }
  //         atSingleBlock = true;
  //         blockHeight = blockParams.blockHeight;
  //       } else {
  //         blockHeight = await getBlockHeight(untilBlock, req, res, next, db);
  //       }

  //       const limit = getPagingQueryLimit(ResourceType.Tx, req.query.limit);
  //       const offset = parsePagingQueryInput(req.query.offset ?? 0);
  //       const { results: txResults, total } = await db.getAddressTxsWithAssetTransfers({
  //         stxAddress: stxAddress,
  //         limit,
  //         offset,
  //         blockHeight,
  //         atSingleBlock,
  //       });

  //       const results = await Bluebird.mapSeries(txResults, async entry => {
  //         const txQuery = await getTxFromDataStore(db, {
  //           txId: entry.tx.tx_id,
  //           dbTx: entry.tx,
  //           includeUnanchored: blockParams.includeUnanchored ?? false,
  //         });
  //         if (!txQuery.found) {
  //           throw new Error('unexpected tx not found -- fix tx enumeration query');
  //         }
  //         const result = {
  //           tx: txQuery.result,
  //           stx_sent: entry.stx_sent.toString(),
  //           stx_received: entry.stx_received.toString(),
  //           stx_transfers: entry.stx_transfers.map(transfer => ({
  //             amount: transfer.amount.toString(),
  //             sender: transfer.sender,
  //             recipient: transfer.recipient,
  //           })),
  //           ft_transfers: entry.ft_transfers.map(transfer => ({
  //             asset_identifier: transfer.asset_identifier,
  //             amount: transfer.amount.toString(),
  //             sender: transfer.sender,
  //             recipient: transfer.recipient,
  //           })),
  //           nft_transfers: entry.nft_transfers.map(transfer => {
  //             const parsedClarityValue = decodeClarityValueToRepr(transfer.value);
  //             const nftTransfer = {
  //               asset_identifier: transfer.asset_identifier,
  //               value: {
  //                 hex: transfer.value,
  //                 repr: parsedClarityValue,
  //               },
  //               sender: transfer.sender,
  //               recipient: transfer.recipient,
  //             };
  //             return nftTransfer;
  //           }),
  //         };
  //         return result;
  //       });

  //       const response = {
  //         limit,
  //         offset,
  //         total,
  //         results,
  //       };
  //       return response;
  //     });
  //     setETagCacheHeaders(res);
  //     res.json(response);
  //   })
  // );

  router.get(
    '/:stx_address/assets',
    cacheHandler,
    asyncHandler(async (req, res, next) => {
      // get recent asset event associated with address
      const stxAddress = req.params['stx_address'];
      validatePrincipal(stxAddress);
      const untilBlock = parseUntilBlockQuery(req, res, next);

      const limit = getPagingQueryLimit(ResourceType.Event, req.query.limit);
      const offset = parsePagingQueryInput(req.query.offset ?? 0);

      const response = await db.sqlTransaction(async sql => {
        const blockHeight = await getBlockHeight(untilBlock, req, res, next, db);
        const { results: assetEvents, total } = await db.getAddressAssetEvents({
          stxAddress,
          limit,
          offset,
          blockHeight,
        });
        const results = assetEvents.map(event => parseDbEvent(event));
        const response: AddressAssetEvents = { limit, offset, total, results };
        return response;
      });
      setETagCacheHeaders(res);
      res.json(response);
    })
  );

  router.get(
    '/:stx_address/stx_inbound',
    cacheHandler,
    asyncHandler(async (req, res, next) => {
      // get recent inbound STX transfers with memos
      const stxAddress = req.params['stx_address'];
      try {
        const sendManyContractId = getSendManyContract(chainId);
        if (!sendManyContractId || !isValidPrincipal(sendManyContractId)) {
          logger.error('Send many contract ID not properly configured');
          res.status(500).json({ error: 'Send many contract ID not properly configured' });
          return;
        }
        validatePrincipal(stxAddress);

        const response = await db.sqlTransaction(async sql => {
          let atSingleBlock = false;
          const untilBlock = parseUntilBlockQuery(req, res, next);
          const blockParams = getBlockParams(req, res, next);
          let blockHeight = 0;
          if (blockParams.blockHeight) {
            if (untilBlock) {
              throw new InvalidRequestError(
                `can't handle until_block and block_height in the same request`,
                InvalidRequestErrorType.invalid_param
              );
            }
            atSingleBlock = true;
            blockHeight = blockParams.blockHeight;
          } else {
            blockHeight = await getBlockHeight(untilBlock, req, res, next, db);
          }

          const limit = getPagingQueryLimit(ResourceType.Tx, req.query.limit);
          const offset = parsePagingQueryInput(req.query.offset ?? 0);
          const { results, total } = await db.getInboundTransfers({
            stxAddress,
            limit,
            offset,
            sendManyContractId,
            blockHeight,
            atSingleBlock,
          });
          const transfers: InboundStxTransfer[] = results.map(r => ({
            sender: r.sender,
            amount: r.amount.toString(),
            memo: r.memo,
            block_height: r.block_height,
            tx_id: r.tx_id,
            transfer_type: r.transfer_type as InboundStxTransfer['transfer_type'],
            tx_index: r.tx_index,
          }));
          const response: AddressStxInboundListResponse = {
            results: transfers,
            total: total,
            limit,
            offset,
          };
          return response;
        });
        setETagCacheHeaders(res);
        res.json(response);
      } catch (error) {
        logger.error(error, `Unable to get inbound transfers for ${stxAddress}`);
        throw error;
      }
    })
  );

  done();
};

const MempoolRoutes: FastifyPluginCallback<Record<never, never>, Server, TypeBoxTypeProvider> = (
  fastify,
  _,
  done
) => {
  router.get(
    '/:address/mempool',
    mempoolCacheHandler,
    asyncHandler(async (req, res, next) => {
      const limit = getPagingQueryLimit(ResourceType.Tx, req.query.limit);
      const offset = parsePagingQueryInput(req.query.offset ?? 0);
      const address = req.params['address'];
      if (!isValidPrincipal(address)) {
        throw new InvalidRequestError(
          `Invalid query parameter for "${address}", not a valid principal`,
          InvalidRequestErrorType.invalid_param
        );
      }
      const includeUnanchored = isUnanchoredRequest(req, res, next);
      const { results: txResults, total } = await db.getMempoolTxList({
        offset,
        limit,
        address,
        includeUnanchored,
      });
      const results = txResults.map(tx => parseDbMempoolTx(tx));
      const response = { limit, offset, total, results };
      if (!isProdEnv) {
        const schemaPath =
          '@stacks/stacks-blockchain-api-types/api/transaction/get-mempool-transactions.schema.json';
        await validate(schemaPath, response);
      }
      setETagCacheHeaders(res, ETagType.mempool);
      res.json(response);
    })
  );

  router.get(
    '/:stx_address/nonces',
    mempoolCacheHandler,
    asyncHandler(async (req, res) => {
      // get recent asset event associated with address
      const stxAddress = req.params['stx_address'];
      validatePrincipal(stxAddress);
      let blockIdentifier: BlockIdentifier | undefined;
      const blockHeightQuery = req.query['block_height'];
      const blockHashQuery = req.query['block_hash'];
      if (blockHeightQuery && blockHashQuery) {
        res.status(400).json({ error: `Multiple block query parameters specified` });
        return;
      }
      if (blockHeightQuery) {
        const blockHeight = Number(blockHeightQuery);
        if (!Number.isInteger(blockHeight) || blockHeight < 1) {
          res.status(400).json({
            error: `Query parameter 'block_height' is not a valid integer: ${blockHeightQuery}`,
          });
          return;
        }
        blockIdentifier = { height: blockHeight };
      } else if (blockHashQuery) {
        if (typeof blockHashQuery !== 'string' || !has0xPrefix(blockHashQuery)) {
          res.status(400).json({
            error: `Query parameter 'block_hash' is not a valid block hash hex string: ${blockHashQuery}`,
          });
          return;
        }
        blockIdentifier = { hash: blockHashQuery };
      }
      if (blockIdentifier) {
        const nonceQuery = await db.getAddressNonceAtBlock({ stxAddress, blockIdentifier });
        if (!nonceQuery.found) {
          res.status(404).json({
            error: `No block found for ${JSON.stringify(blockIdentifier)}`,
          });
          return;
        }
        const results: AddressNonces = {
          last_executed_tx_nonce: nonceQuery.result.lastExecutedTxNonce as number,
          possible_next_nonce: nonceQuery.result.possibleNextNonce,
          // Note: OpenAPI type generator doesn't support `nullable: true` so force cast it here
          last_mempool_tx_nonce: null as unknown as number,
          detected_missing_nonces: [],
          detected_mempool_nonces: [],
        };
        setETagCacheHeaders(res);
        res.json(results);
      } else {
        const nonces = await db.getAddressNonces({ stxAddress });
        const results: AddressNonces = {
          last_executed_tx_nonce: nonces.lastExecutedTxNonce as number,
          last_mempool_tx_nonce: nonces.lastMempoolTxNonce as number,
          possible_next_nonce: nonces.possibleNextNonce,
          detected_missing_nonces: nonces.detectedMissingNonces,
          detected_mempool_nonces: nonces.detectedMempoolNonces,
        };
        setETagCacheHeaders(res);
        res.json(results);
      }
    })
  );

  done();
};

export const V1AddressRoutes: FastifyPluginAsync<
  Record<never, never>,
  Server,
  TypeBoxTypeProvider
> = async fastify => {
  await fastify.register(ChainTipRoutes);
  await fastify.register(MempoolRoutes);
};
