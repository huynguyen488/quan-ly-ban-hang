// app/debts/statement/page.tsx
import { db } from "../../../src/db";
import { orders, receipts, customers } from "../../../src/db/schema";
import StatementView from "./StatementView";
import { createReceipt, deleteReceipt, verifyAdminAuth } from "../actions";

export const revalidate = 0;

export default async function StatementPage(props: any) {
  const searchParams = await props.searchParams; 
  const customerIdRaw = searchParams?.id;
  const customerNameRaw = searchParams?.name || "Khách lẻ";

  const allOrders = await db.select().from(orders);
  const allReceipts = await db.select().from(receipts);
  const allCustomers = await db.select().from(customers);

  let finalCustomerName = customerNameRaw;

  if (customerIdRaw && customerIdRaw !== "none" && customerIdRaw !== "undefined") {
    const foundCustomer = allCustomers.find(c => String(c.id) === String(customerIdRaw));
    if (foundCustomer && foundCustomer.name) {
      finalCustomerName = foundCustomer.name;
    }
  }

  const normalize = (s: string | null) => (s || "").trim().toLowerCase();
  const targetName = normalize(finalCustomerName);

  const cusOrders = allOrders.filter(o => normalize(o.customer_name) === targetName);
  const cusReceipts = allReceipts.filter(r => normalize(r.customer_name) === targetName);

  return (
    <StatementView 
      customerName={finalCustomerName} 
      cusOrders={cusOrders} 
      cusReceipts={cusReceipts}
      onCreateReceipt={createReceipt}
      onDeleteReceipt={deleteReceipt}
      onVerifyAdmin={verifyAdminAuth}
    />
  );
}