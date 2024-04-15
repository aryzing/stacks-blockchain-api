import { PgConnectionArgs, PgConnectionOptions } from '@hirosystems/api-toolkit';
import { ENV } from '../env';

/**
 * The postgres server being used for a particular connection, transaction or query.
 * The API will automatically choose between `default` (or read replica) and `primary`.
 * See `.env` for more information.
 */
export enum PgServer {
  default,
  primary,
}

export function getConnectionArgs(server: PgServer = PgServer.default): PgConnectionArgs {
  const isPrimary = server === PgServer.primary;
  const uri = isPrimary
    ? ENV.PG_PRIMARY_CONNECTION_URI ?? ENV.PG_CONNECTION_URI
    : ENV.PG_CONNECTION_URI;
  return (
    uri ?? {
      database: isPrimary ? ENV.PG_PRIMARY_DATABASE ?? ENV.PG_DATABASE : ENV.PG_DATABASE,
      user: isPrimary ? ENV.PG_PRIMARY_USER ?? ENV.PG_USER : ENV.PG_USER,
      password: isPrimary ? ENV.PG_PRIMARY_PASSWORD ?? ENV.PG_PASSWORD : ENV.PG_PASSWORD,
      host: isPrimary ? ENV.PG_PRIMARY_HOST ?? ENV.PG_HOST : ENV.PG_HOST,
      port: isPrimary ? ENV.PG_PRIMARY_PORT ?? ENV.PG_PORT : ENV.PG_PORT,
      ssl: isPrimary ? ENV.PG_PRIMARY_SSL ?? ENV.PG_SSL : ENV.PG_SSL,
      schema: isPrimary ? ENV.PG_PRIMARY_SCHEMA ?? ENV.PG_SCHEMA : ENV.PG_SCHEMA,
      application_name: ENV.PG_APPLICATION_NAME,
    }
  );
}

export function getConnectionConfig(server: PgServer = PgServer.default): PgConnectionOptions {
  const isPrimary = server === PgServer.primary;
  return {
    idleTimeout: isPrimary
      ? ENV.PG_PRIMARY_IDLE_TIMEOUT ?? ENV.PG_IDLE_TIMEOUT
      : ENV.PG_IDLE_TIMEOUT,
    maxLifetime: isPrimary
      ? ENV.PG_PRIMARY_MAX_LIFETIME ?? ENV.PG_MAX_LIFETIME
      : ENV.PG_MAX_LIFETIME,
    poolMax: isPrimary
      ? ENV.PG_PRIMARY_CONNECTION_POOL_MAX ?? ENV.PG_CONNECTION_POOL_MAX
      : ENV.PG_CONNECTION_POOL_MAX,
    statementTimeout: isPrimary
      ? ENV.PG_PRIMARY_STATEMENT_TIMEOUT ?? ENV.PG_STATEMENT_TIMEOUT
      : ENV.PG_STATEMENT_TIMEOUT,
  };
}
