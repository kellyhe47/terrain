import { openSqlJs } from './sqljsDriver';
import { migrate } from './schema';
import { Repo } from './repo';
/** In-memory database for tests. */
export async function testRepo(): Promise<Repo> { const db = await openSqlJs(); migrate(db); return new Repo(db); }
