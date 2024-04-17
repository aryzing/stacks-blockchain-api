import { Optional } from '@hirosystems/api-toolkit';
import { Static, Type } from '@sinclair/typebox';

export const PoolDelegationSchema = Type.Object(
  {
    stacker: Type.String({
      description: 'The principal of the pool member that issued the delegation',
    }),
    pox_addr: Optional(
      Type.String({
        description: 'The pox-addr value specified by the stacker in the delegation operation',
      })
    ),
    amount_ustx: Type.String({
      description: 'The amount of uSTX delegated by the stacker',
    }),
    burn_block_unlock_height: Type.Integer({
      description: 'The optional burnchain block unlock height that the stacker may have specified',
    }),
    block_height: Type.Integer({
      description: 'The block height at which the stacker delegation transaction was mined at',
    }),
    tx_id: Type.String({
      description: 'The tx_id of the stacker delegation operation',
    }),
  },
  { title: 'PoolDelegation' }
);
export type PoolDelegation = Static<typeof PoolDelegationSchema>;

export const PoxCycleSchema = Type.Object(
  {
    block_height: Type.Integer(),
    index_block_hash: Type.String(),
    cycle_number: Type.Integer(),
    total_weight: Type.Integer(),
    total_stacked_amount: Type.String(),
    total_signers: Type.Integer(),
  },
  { title: 'PoxCycle' }
);
export type PoxCycle = Static<typeof PoxCycleSchema>;

export const PoxSignerSchema = Type.Object(
  {
    signing_key: Type.String(),
    weight: Type.Integer(),
    stacked_amount: Type.String(),
    weight_percent: Type.Number(),
    stacked_amount_percent: Type.Number(),
  },
  { title: 'PoxSigner' }
);
export type PoxSigner = Static<typeof PoxSignerSchema>;

export const PoxStackerSchema = Type.Object(
  {
    stacker_address: Type.String(),
    stacked_amount: Type.String(),
    pox_address: Type.String(),
  },
  { title: 'PoxStacker' }
);
export type PoxStacker = Static<typeof PoxStackerSchema>;
