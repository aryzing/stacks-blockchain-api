import { Optional, PaginatedResponse } from '@hirosystems/api-toolkit';
import { Static, Type } from '@sinclair/typebox';
import { TransactionEventSchema } from '../entities/transaction-events';
import { FtBalanceSchema, NftBalanceSchema, StxBalanceSchema } from '../entities/balances';
import {
  AddressTokenOfferingLockedSchema,
  AddressTransactionEventSchema,
  AddressTransactionWithTransfersSchema,
} from '../entities/addresses';
import { InboundStxTransferSchema } from '../entities/transfers';
import { MempoolTransactionSchema } from '../entities/mempool-transactions';
import { TransactionSchema } from '../entities/transactions';

export const AddressAssetsListResponseSchema = PaginatedResponse(
  TransactionEventSchema,
  'AddressAssetsListResponse'
);
export type AddressAssetsListResponse = Static<typeof AddressAssetsListResponseSchema>;

export const AddressBalanceResponseSchema = Type.Object(
  {
    stx: StxBalanceSchema,
    fungible_tokens: Type.Record(Type.String(), FtBalanceSchema),
    non_fungible_tokens: Type.Record(Type.String(), NftBalanceSchema),
    token_offering_locked: Optional(AddressTokenOfferingLockedSchema),
  },
  { title: 'AddressBalanceResponse', description: 'GET request that returns address balances' }
);
export type AddressBalanceResponse = Static<typeof AddressBalanceResponseSchema>;

export const AddressStxBalanceResponseSchema = Type.Intersect(
  [
    StxBalanceSchema,
    Type.Object({ token_offering_locked: Optional(AddressTokenOfferingLockedSchema) }),
  ],
  { title: 'AddressStxBalanceResponse', description: 'GET request that returns address balances' }
);
export type AddressStxBalanceResponse = Static<typeof AddressStxBalanceResponseSchema>;

export const AddressStxInboundListResponseSchema = PaginatedResponse(
  InboundStxTransferSchema,
  'AddressStxInboundListResponse'
);
export type AddressStxInboundListResponse = Static<typeof AddressStxInboundListResponseSchema>;

export const AddressTransactionEventListResponseSchema = PaginatedResponse(
  AddressTransactionEventSchema,
  'AddressTransactionEventListResponse'
);
export type AddressTransactionEventListResponse = Static<
  typeof AddressTransactionEventListResponseSchema
>;

export const AddressTransactionsWithTransfersListResponseSchema = PaginatedResponse(
  AddressTransactionWithTransfersSchema,
  'AddressTransactionsWithTransfersListResponse'
);
export type AddressTransactionsWithTransfersListResponse = Static<
  typeof AddressTransactionsWithTransfersListResponseSchema
>;

export const AddressTransactionsListResponseSchema = PaginatedResponse(
  Type.Union([MempoolTransactionSchema, TransactionSchema]),
  'AddressTransactionsListResponse'
);
export type AddressTransactionsListResponse = Static<typeof AddressTransactionsListResponseSchema>;
