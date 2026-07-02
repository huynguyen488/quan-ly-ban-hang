import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';

// 1. BẢNG TÀI KHOẢN (Users)
export const users = sqliteTable('users', {
  username: text('username').primaryKey(),
  password: text('password').notNull(),
  role: text('role').notNull(),
  fullname: text('fullname'),
});

// 2. BẢNG KHÁCH HÀNG (Customers)
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  note: text('note'),
  created_at: text("created_at"),
});

// 3. BẢNG SẢN PHẨM (Products)
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  barcode: text('barcode'),
  name: text('name').notNull(),
  category: text('category'),
  price_import: integer('price_import').default(0),
  price_sell: integer('price_sell').default(0),
  stock: integer('stock').default(0),
  min_stock: integer('min_stock').default(10),
  supplier: text('supplier'),
  unit: text('unit').default('Cái'),
});

// 4. BẢNG ĐƠN HÀNG (Orders) - Mày dùng mã DH... làm ID nên xài text
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(), 
  customer_name: text('customer_name'),
  customer_phone: text('customer_phone'),
  customer_address: text('customer_address'),
  date: text('date'),
  total_price: integer('total_price').default(0),
  payment_method: text('payment_method'),
  status: text('status'),
  note: text('note'),
  updated_at: text('updated_at'),
});

// 5. BẢNG CHI TIẾT ĐƠN (Order_Items)
export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  order_id: text('order_id').references(() => orders.id),
  product_name: text('product_name'),
  quantity: integer('quantity').default(1),
  price: integer('price').default(0),
  price_import: integer('price_import').default(0),
  discount: integer('discount').default(0),
  serials: text('serials'),
  unit: text('unit').default('Cái'),
  updated_at: text('updated_at'),
});

// 6. BẢNG DANH MỤC (Categories)
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  parent_id: integer('parent_id'),
  description: text('description'), // 🔥 Thêm chính xác cột description dạng text vào đây
});

// 7. BẢNG THÔNG TIN SHOP (Shop_Info)
export const shopInfo = sqliteTable('shop_info', {
  id: integer('id').primaryKey(),
  name: text('name'),
  tax_code: text('tax_code'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  representative: text('representative'),
  position: text('position'),
  slogan: text('slogan'),
  logo: text('logo'),
  bank_name: text('bank_name'),
  bank_account: text('bank_account'),
  bank_user: text('bank_user'),
  qr_image: text('qr_image'),
});

// 8. BẢNG LỊCH SỬ KHO (Stock_History)
export const stockHistory = sqliteTable('stock_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  product_name: text('product_name'),
  change_amount: integer('change_amount'),
  new_balance: integer('new_balance'),
  type: text('type'),
  note: text('note'),
  date: text('date'),
});

// 9. BẢNG PHIẾU THU (Receipts) - Dùng để cấn trừ nợ tự động
export const receipts = sqliteTable('receipts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customer_name: text('customer_name'),
  amount: integer('amount').default(0),
  date: text('date'),
  note: text('note'),
});

// 10. BẢNG CHI PHÍ VẬN HÀNH (Expenses)
export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title'),
  amount: integer('amount').default(0),
  date: text('date'),
  note: text('note'),
  spender: text('spender').default('Chưa rõ'),
});

// 11. BẢNG LỊCH SỬ THAO TÁC (Activity_Logs)
export const activityLogs = sqliteTable('activity_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username'),
  action: text('action'),
  detail: text('detail'),
  date: text('date'),
});

// 12. BẢNG MA TRẬN GIÁ SỈ (Customer_Prices)
export const customerPrices = sqliteTable('customer_prices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customer_name: text('customer_name'),
  product_name: text('product_name'),
  price: integer('price').default(0),
}, (t) => ({
  unq: unique().on(t.customer_name, t.product_name) // Tạo UNIQUE constraint y hệt sqflite
}));