import { Type } from '@sinclair/typebox';
import { pagingQueryLimits, ResourceType } from '../pagination';

export const OffsetParam = (title?: string, description?: string) =>
  Type.Integer({
    minimum: 0,
    default: 0,
    title: title ?? 'Offset',
    description: description ?? 'Result offset',
  });

export const LimitParam = (resource: ResourceType, title?: string, description?: string) =>
  Type.Integer({
    minimum: 0,
    default: pagingQueryLimits[resource].defaultLimit,
    maximum: pagingQueryLimits[resource].maxLimit,
    title: title ?? 'Limit',
    description: description ?? 'Results per page',
  });

export const UnanchoredParamSchema = Type.Boolean({
  default: false,
  description: 'Include data from unanchored (i.e. unconfirmed) microblocks',
  examples: [true],
});

export const TransactionIdParamSchema = Type.String({
  pattern: '^(0x)?[a-fA-F0-9]{64}$',
  title: 'Transaction ID',
  description: 'Transaction ID',
  examples: ['0xf6bd5f4a7b26184a3466340b2e99fd003b4962c0e382a7e4b6a13df3dd7a91c6'],
});

export const TransactionIdCommaListParamSchema = Type.String({
  pattern: '^(0x)?[a-fA-F0-9]{64}(,(0x)?[a-fA-F0-9]{64})*$',
  title: 'Comma separated list of transaction IDs',
  description: 'Comma separate list of transaction IDs',
  examples: [
    '0xf6bd5f4a7b26184a3466340b2e99fd003b4962c0e382a7e4b6a13df3dd7a91c6,0xbf06fc00be4333166b9a9be0557b9f560bee8700dfe7988bd3d3df1f1a077ed8',
  ],
});

export const BlockHeightSchema = Type.Integer({
  minimum: 0,
  title: 'Block height',
  description: 'Block height',
  examples: [777678],
});

export const AddressParamSchema = Type.String({
  pattern: '^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{28,41}',
  title: 'STX Address',
  description: 'STX Address',
  examples: ['SP318Q55DEKHRXJK696033DQN5C54D9K2EE6DHRWP'],
});

export const SmartContractIdParamSchema = Type.String({
  pattern: '^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{28,41}.[a-zA-Z]([a-zA-Z0-9]|[-_]){0,39}$',
  title: 'Smart Contract ID',
  description: 'Smart Contract ID',
  examples: ['SP000000000000000000002Q6VF78.pox-3'],
});

export const PrincipalSchema = Type.Union([AddressParamSchema, SmartContractIdParamSchema]);

export const MempoolOrderByParamSchema = Type.Enum(
  {
    age: 'age',
    size: 'size',
    fee: 'fee',
  },
  {
    title: 'Order By',
    description: 'Option to sort results by transaction age, size, or fee rate.',
  }
);

export const OrderParamSchema = Type.Enum(
  {
    asc: 'asc',
    desc: 'desc',
  },
  {
    title: 'Order',
    description: 'Results order',
  }
);