import { Nullable, Optional } from '@hirosystems/api-toolkit';
import { Static, Type } from '@sinclair/typebox';
import { TransactionSchema } from './transactions';
import { TransactionEventAssetTypeSchema } from './transaction-events';

export const AddressNoncesSchema = Type.Object(
  {
    last_mempool_tx_nonce: Nullable(
      Type.Integer({
        description:
          'The latest nonce found within mempool transactions sent by this address. Will be null if there are no current mempool transactions for this address.',
      })
    ),
    last_executed_tx_nonce: Nullable(
      Type.Integer({
        description:
          'The latest nonce found within transactions sent by this address, including unanchored microblock transactions. Will be null if there are no current transactions for this address.',
      })
    ),
    possible_next_nonce: Type.Integer({
      description:
        "The likely nonce required for creating the next transaction, based on the last nonces seen by the API. This can be incorrect if the API's mempool or transactions aren't fully synchronized, even by a small amount, or if a previous transaction is still propagating through the Stacks blockchain network when this endpoint is called.",
    }),
    detected_missing_nonces: Type.Array(Type.Integer(), {
      description:
        'Nonces that appear to be missing and likely causing a mempool transaction to be stuck.',
    }),
    detected_mempool_nonces: Type.Array(Type.Integer(), {
      description: 'Nonces currently in mempool for this address.',
    }),
  },
  {
    title: 'AddressNonces',
    description:
      'The latest nonce values used by an account by inspecting the mempool, microblock transactions, and anchored transactions',
  }
);
export type AddressNonces = Static<typeof AddressNoncesSchema>;

export const AddressUnlockScheduleSchema = Type.Object(
  {
    amount: Type.String({
      description: 'Micro-STX amount locked at this block height.',
    }),
    block_height: Type.Integer(),
  },
  { title: 'AddressUnlockSchedule', description: 'Unlock schedule amount and block height' }
);
export type AddressUnlockSchedule = Static<typeof AddressUnlockScheduleSchema>;

export const AddressTokenOfferingLockedSchema = Type.Object(
  {
    total_locked: Type.String({
      description: 'Micro-STX amount still locked at current block height.',
    }),
    total_unlocked: Type.String({
      description: 'Micro-STX amount unlocked at current block height.',
    }),
    unlock_schedule: Type.Array(AddressUnlockScheduleSchema),
  },
  { title: 'AddressTokenOfferingLocked', description: 'Token Offering Locked' }
);
export type AddressTokenOfferingLocked = Static<typeof AddressTokenOfferingLockedSchema>;

export const AddressTransactionSchema = Type.Object(
  {
    tx: TransactionSchema,
    stx_sent: Type.String({
      description:
        'Total sent from the given address, including the tx fee, in micro-STX as an integer string.',
    }),
    stx_received: Type.String({
      description: 'Total received by the given address in micro-STX as an integer string.',
    }),
    events: Type.Object({
      stx: Type.Object({
        transfer: Type.Integer(),
        mint: Type.Integer(),
        burn: Type.Integer(),
      }),
      ft: Type.Object({
        transfer: Type.Integer(),
        mint: Type.Integer(),
        burn: Type.Integer(),
      }),
      nft: Type.Object({
        transfer: Type.Integer(),
        mint: Type.Integer(),
        burn: Type.Integer(),
      }),
    }),
  },
  {
    title: 'AddressTransaction',
    description: 'Address transaction with STX, FT and NFT transfer summaries',
  }
);
export type AddressTransaction = Static<typeof AddressTransactionSchema>;

export const AddressTransactionWithTransfersSchema = Type.Object(
  {
    tx: TransactionSchema,
    stx_sent: Type.String({
      description:
        'Total sent from the given address, including the tx fee, in micro-STX as an integer string.',
    }),
    stx_received: Type.String({
      description: 'Total received by the given address in micro-STX as an integer string.',
    }),
    stx_transfers: Type.Array(
      Type.Object({
        amount: Type.String({
          description: 'Amount transferred in micro-STX as an integer string.',
        }),
        sender: Optional(
          Type.String({
            description: 'Principal that sent STX. This is unspecified if the STX were minted.',
          })
        ),
        recipient: Optional(
          Type.String({
            description: 'Principal that received STX. This is unspecified if the STX were burned.',
          })
        ),
      })
    ),
    ft_transfers: Optional(
      Type.Array(
        Type.Object({
          amount: Type.String({
            description:
              'Amount transferred as an integer string. This balance does not factor in possible SIP-010 decimals.',
          }),
          asset_identifier: Type.String({
            description: 'Fungible Token asset identifier.',
          }),
          sender: Optional(
            Type.String({
              description: 'Principal that sent the asset.',
            })
          ),
          recipient: Optional(
            Type.String({
              description: 'Principal that received the asset.',
            })
          ),
        })
      )
    ),
    nft_transfers: Optional(
      Type.Array(
        Type.Object({
          value: Type.Object(
            {
              hex: Type.String(),
              repr: Type.String(),
            },
            { description: 'Non Fungible Token asset value.' }
          ),
          asset_identifier: Type.String({
            description: 'Non Fungible Token asset identifier.',
          }),
          sender: Optional(
            Type.String({
              description: 'Principal that sent the asset.',
            })
          ),
          recipient: Optional(
            Type.String({
              description: 'Principal that received the asset.',
            })
          ),
        })
      )
    ),
  },
  {
    title: 'AddressTransactionWithTransfers',
    description: 'Transaction with STX transfers for a given address',
  }
);
export type AddressTransactionWithTransfers = Static<typeof AddressTransactionWithTransfersSchema>;

export const AddressTransactionEventSchema = Type.Union(
  [
    Type.Object({
      type: Type.Literal('stx'),
      event_index: Type.Integer(),
      data: Type.Object({
        type: Type.Enum(TransactionEventAssetTypeSchema),
        amount: Type.String({
          description: 'Amount transferred in micro-STX as an integer string.',
        }),
        sender: Optional(
          Type.String({
            description: 'Principal that sent STX. This is unspecified if the STX were minted.',
          })
        ),
        recipient: Optional(
          Type.String({
            description: 'Principal that received STX. This is unspecified if the STX were burned.',
          })
        ),
      }),
    }),
    Type.Object({
      type: Type.Literal('ft'),
      event_index: Type.Integer(),
      data: Type.Object({
        type: Type.Enum(TransactionEventAssetTypeSchema),
        amount: Type.String({
          description:
            'Amount transferred as an integer string. This balance does not factor in possible SIP-010 decimals.',
        }),
        asset_identifier: Type.String({
          description: 'Fungible Token asset identifier.',
        }),
        sender: Optional(
          Type.String({
            description: 'Principal that sent the asset.',
          })
        ),
        recipient: Optional(
          Type.String({
            description: 'Principal that received the asset.',
          })
        ),
      }),
    }),
    Type.Object({
      type: Type.Literal('nft'),
      event_index: Type.Integer(),
      data: Type.Object({
        type: Type.Enum(TransactionEventAssetTypeSchema),
        asset_identifier: Type.String({
          description: 'Non Fungible Token asset identifier.',
        }),
        value: Type.Object({
          hex: Type.String(),
          repr: Type.String(),
        }),
        sender: Optional(
          Type.String({
            description: 'Principal that sent the asset.',
          })
        ),
        recipient: Optional(
          Type.String({
            description: 'Principal that received the asset.',
          })
        ),
      }),
    }),
  ],
  { title: 'AddressTransactionEvent', description: 'Address Transaction Event' }
);
export type AddressTransactionEvent = Static<typeof AddressTransactionEventSchema>;
