import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function convertToWal() {
  const db = await open({
    filename: './banhang_final_v22.db',
    driver: sqlite3.Database
  });

  await db.run('PRAGMA journal_mode = WAL;');
  console.log('>>> Chuyển đổi định dạng Database sang WAL thành công.');
  
  const mode = await db.get('PRAGMA journal_mode;');
  console.log('>>> Trạng thái Journal hiện tại:', mode);
  
  await db.close();
}

convertToWal().catch(console.error);