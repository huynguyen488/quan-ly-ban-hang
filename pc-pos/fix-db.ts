import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function forceAddColumn() {
  try {
    console.log("Đang tiến hành cấy ghép cột description vào Database...");
    
    // Ép chạy lệnh SQL thô (Raw SQL) để thêm cột
    await db.run(sql`ALTER TABLE categories ADD COLUMN description TEXT;`);
    
    console.log("✅ THÀNH CÔNG: Đã thêm cột 'description' vào bảng categories!");
    process.exit(0);
  } catch (error: any) {
    console.log("⚠️ Lỗi (Có thể cột đã được thêm từ trước):", error.message);
    process.exit(1);
  }
}

forceAddColumn();