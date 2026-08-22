import "dotenv/config";
import * as XLSX from "xlsx";
import path from "node:path";
import { normalizeBoolean, normalizeEnum } from "./nomalize";
import { ingestDatabase } from "./db";
import { AccountRowSchema, OrderRowSchema, TicketRowSchema } from "./validators";
import { transformAccount, transformOrder, transformTicket } from "./transform";
import { validateReferences } from "./validators";

const workbookPath = path.resolve(process.cwd(),"data/ParcelPilot_Assessment_Data.xlsx");
const workbook = XLSX.readFile(workbookPath);

function readSheet(sheetName: string) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        throw new Error(
        `Required worksheet "${sheetName}" was not found.`,
        );
    }
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(
        sheet,
        {
        defval: null,
        raw: false,
        },
    );
}

async function main(){
    const accountRows = readSheet("accounts");
    const orderRows = readSheet("orders");
    const ticketRows = readSheet("tickets");

    console.log(`Accounts: ${accountRows.length}`);
    console.log(`Orders: ${orderRows.length}`);
    console.log(`Tickets: ${ticketRows.length}`);

    const accounts = accountRows.map((row, index) => {
        const normalizedRow={
            ...row,
            plan:normalizeEnum(row.plan),
            status:normalizeEnum(row.status),
            premium_support:normalizeBoolean(row.premium_support),
        }
    const result = AccountRowSchema.safeParse(normalizedRow);
    if (!result.success) {
        console.error(`Invalid account row ${index + 2}`);
        console.error(result.error.flatten());
        throw new Error(`Account validation failed at Excel row ${index + 2}`);
    }
    return result.data;
    });

    const orders = orderRows.map((row, index) => {
    const normalizedRow={
        ...row,
        status:normalizeEnum(row.status),
        carrier_fault: normalizeBoolean(row.carrier_fault),
        customer_fault: normalizeBoolean(row.customer_fault),
    }
    const result = OrderRowSchema.safeParse(normalizedRow);
    if (!result.success) throw new Error(`Order validation failed at Excel row ${index + 2}`);
    return result.data;
    });

    const tickets = ticketRows.map((row, index) => {
    const normalizedRow={
        ...row,
        status:normalizeEnum(row.status),
    }
    const result = TicketRowSchema.safeParse(normalizedRow);
    if (!result.success) throw new Error(`Ticket validation failed at Excel row ${index + 2}`);
    return result.data;
    });

    console.log("XLSX validation successful.");
    const transformedAccounts=accounts.map(transformAccount);
    const transformedOrders=orders.map(transformOrder);
    const transformedTickets=tickets.map(transformTicket);

    validateReferences(transformedAccounts,transformedOrders,transformedTickets);

    const result = await ingestDatabase(transformedAccounts,transformedOrders,transformedTickets)
    console.log("\nDatabase ingestion successful.");
    console.log(result);
}

main().catch((error)=>{
  console.error("\nXLSX ingestion failed:");
  console.error(error);
  process.exit(1);
});