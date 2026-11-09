import { getPool } from './pool.js';

export async function rows(sql, values = [], connection = getPool()) {
  const [result] = await connection.execute(sql, values);
  return result;
}
