import { ChainID } from '@stacks/transactions';
import { startApiServer, ApiServer } from '../api/init';
import { PgSqlClient } from '../datastore/connection';
import { TestBlockBuilder, testMempoolTx } from '../test-utils/test-builders';
import { PgWriteStore } from '../datastore/pg-write-store';
import { cycleMigrations, runMigrations } from '../datastore/migrations';

describe('mempool tests', () => {
  let db: PgWriteStore;
  let client: PgSqlClient;
  let api: ApiServer;

  beforeEach(async () => {
    process.env.PG_DATABASE = 'postgres';
    await cycleMigrations();
    db = await PgWriteStore.connect({
      usageName: 'tests',
      withNotifier: false,
      skipMigrations: true,
    });
    client = db.sql;
    api = await startApiServer({ datastore: db, chainId: ChainID.Testnet, httpLogLevel: 'silly' });
  });

  test('garbage collection', async () => {
    process.env.STACKS_MEMPOOL_TX_GARBAGE_COLLECTION_THRESHOLD = '2';

    // Insert 5 blocks with 1 mempool tx each.
    for (let block_height = 1; block_height <= 5; block_height++) {
      const block = new TestBlockBuilder({
        block_height: block_height,
        index_block_hash: `0x0${block_height}`,
        parent_index_block_hash: `0x0${block_height - 1}`,
      })
        .addTx({ tx_id: `0x111${block_height}` })
        .build();
      await db.update(block);
      const mempoolTx = testMempoolTx({ tx_id: `0x0${block_height}` });
      await db.updateMempoolTxs({ mempoolTxs: [mempoolTx] });
    }

    // Make sure we only have mempool txs for block_height >= 3
    const mempoolTxResult = await db.getMempoolTxList({
      limit: 10,
      offset: 0,
      includeUnanchored: false,
    });
    const mempoolTxs = mempoolTxResult.results;
    expect(mempoolTxs.length).toEqual(3);
    const txIds = mempoolTxs.map(e => e.tx_id).sort();
    expect(txIds).toEqual(['0x03', '0x04', '0x05']);
  });

  afterEach(async () => {
    await api.terminate();
    await db?.close();
    await runMigrations(undefined, 'down');
  });
});