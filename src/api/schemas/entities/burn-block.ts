import { Static, Type } from '@sinclair/typebox';

export const BlockSchema = Type.Object(
  {
    burn_block_height: Type.Integer({
      description: 'Height of the anchor chain block',
    }),
    burn_block_hash: Type.String({
      description: 'Hash of the anchor chain block',
    }),
    burn_block_time: Type.Number({
      description: 'Unix timestamp (in seconds) indicating when this block was mined.',
    }),
    burn_block_time_iso: Type.String({
      description: 'An ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ) indicating when this block was mined.',
    }),
    stacks_blocks: Type.Array(Type.String(), {
      description: 'Hashes of the Stacks blocks included in the burn block',
    }),
  },
  { title: 'BurnBlock', description: 'A burn block' }
);
export type BurnBlock = Static<typeof BlockSchema>;
