import { migrate, pool } from './db';
import { logger } from './logger';

migrate()
  .then(async () => {
    logger.info('Database migrations completed');
    await pool.end();
  })
  .catch(async error => {
    logger.error('Database migration failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    await pool.end();
    process.exit(1);
  });
