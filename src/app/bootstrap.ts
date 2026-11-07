import {
  openDatabase,
  migrations,
  runMigrations,
  setDb,
  getDb,
} from '@/core/db';
import {
  clearRegistry,
  registerFeatures,
  runFeatureInits,
} from '@/core/registry';
import { features } from './features';

export { getDb, setDb };

/**
 * Executes the Study Dojo bootstrap sequence:
 * 1. Opens SQLite database ("studydojo.db") with WAL mode and foreign keys.
 * 2. Runs pending migrations.
 * 3. Registers all features with the feature registry.
 * 4. Runs feature init hooks.
 */
export async function bootstrap(): Promise<void> {
  const db = await openDatabase('studydojo.db');
  await runMigrations(db, migrations);

  clearRegistry();
  registerFeatures(features);
  await runFeatureInits();

  setDb(db);
}


