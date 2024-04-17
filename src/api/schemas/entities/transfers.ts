import { Static, Type } from '@sinclair/typebox';

enum InboundStxTransferType {
  bulkSend = 'bulk-send',
  stxTransfer = 'stx-transfer',
  stxTransferMemo = 'stx-transfer-memo',
}

export const InboundStxTransferSchema = Type.Object(
  {
    sender: Type.String({
      description: 'Principal that sent this transfer',
    }),
    amount: Type.String({
      description: 'Transfer amount in micro-STX as integer string',
    }),
    memo: Type.String({
      description: 'Hex encoded memo bytes associated with the transfer',
    }),
    block_height: Type.Integer({
      description: 'Block height at which this transfer occurred',
    }),
    tx_id: Type.String({
      description: 'The transaction ID in which this transfer occurred',
    }),
    transfer_type: Type.Enum(InboundStxTransferType, {
      description:
        'Indicates if the transfer is from a stx-transfer transaction or a contract-call transaction',
    }),
    tx_index: Type.Integer({
      description: 'Index of the transaction within a block',
    }),
  },
  { title: 'InboundStxTransfer' }
);
export type InboundStxTransfer = Static<typeof InboundStxTransferSchema>;
