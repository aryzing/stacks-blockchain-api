import type { operations } from "./generated/schema";

export type Transaction = operations['get_transaction_list']['responses']['200']['content']['application/json']['results'][number];
export type MempoolTransaction = operations['get_mempool_transaction_list']['responses']['200']['content']['application/json']['results'][number];
export type Block = operations['get_block_by_height']['responses']['200']['content']['application/json'];
export type Microblock = operations['get_microblock_by_hash']['responses']['200']['content']['application/json'];
export type AddressTransactionWithTransfers = operations['get_account_transactions_with_transfers']['responses']['200']['content']['application/json']['results'][number];
export type AddressStxBalanceResponse = operations['get_account_stx_balance']['responses']['200']['content']['application/json'];
export type RpcAddressTxNotificationParams = AddressTransactionWithTransfers & {
  address: string;
  tx_id: string;
  tx_status: Transaction['tx_status'];
  tx_type: Transaction['tx_type'];
};
export type RpcAddressBalanceNotificationParams = AddressStxBalanceResponse & {
  address: string;
};
export type NftEvent = {
  sender?: string;
  recipient?: string;
  asset_identifier: string;
  asset_event_type: string;
  value: {
    hex: string;
    repr: string;
  };
  tx_id: string;
  tx_index: number;
  block_height: number;
  event_index: number;
};
export type RpcTxUpdateSubscriptionParams = {
  event: "tx_update";
  tx_id: string;
};
export type RpcBlockSubscriptionParams = {
  event: "block";
};
export type RpcMicroblockSubscriptionParams = {
  event: "microblock";
};
export type RpcMempoolSubscriptionParams = {
  event: "mempool";
};
export type RpcAddressTxSubscriptionParams = {
  event: "address_tx_update";
  address: string;
};
export type RpcAddressBalanceSubscriptionParams = {
  event: "address_balance_update";
  address: string;
};
export type RpcNftEventSubscriptionParams = {
  event: "nft_event";
};
export type RpcNftAssetEventSubscriptionParams = {
  event: "nft_asset_event";
  asset_identifier: string;
  value: string;
};
export type RpcNftCollectionEventSubscriptionParams = {
  event: "nft_collection_event";
  asset_identifier: string;
};
export type RpcSubscriptionType =
  | "tx_update"
  | "address_tx_update"
  | "address_balance_update"
  | "block"
  | "microblock"
  | "mempool"
  | "nft_event"
  | "nft_asset_event"
  | "nft_collection_event";
export type AddressTransactionTopic = `address-transaction:${string}`;
export type AddressStxBalanceTopic = `address-stx-balance:${string}`;
export type TransactionTopic = `transaction:${string}`;
export type NftAssetEventTopic = `nft-asset-event:${string}+${string}`;
export type NftCollectionEventTopic = `nft-collection-event:${string}`;
export type Topic =
  | 'block'
  | 'microblock'
  | 'mempool'
  | 'nft-event'
  | AddressTransactionTopic
  | AddressStxBalanceTopic
  | TransactionTopic
  | NftAssetEventTopic
  | NftCollectionEventTopic;
export interface ClientToServerMessages {
  subscribe: (topic: Topic | Topic[], callback: (error: string | null) => void) => void;
  unsubscribe: (...topic: Topic[]) => void;
}

export interface ServerToClientMessages {
  block: (block: Block) => void;
  microblock: (microblock: Microblock) => void;
  mempool: (transaction: MempoolTransaction) => void;
  'nft-event': (event: NftEvent) => void;
  [key: TransactionTopic]: (transaction: Transaction | MempoolTransaction) => void;
  [key: NftAssetEventTopic]: (assetIdentifier: string, value: string, event: NftEvent) => void;
  [key: NftCollectionEventTopic]: (assetIdentifier: string, event: NftEvent) => void;
  [key: AddressTransactionTopic]: (address: string, stxBalance: AddressTransactionWithTransfers) => void;
  [key: AddressStxBalanceTopic]: (address: string, stxBalance: AddressStxBalanceResponse) => void;
}