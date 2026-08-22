import { z } from "zod";
import { AccountData, OrderData, TicketData } from "./transform";

export const AccountRowSchema = z.object({
  account_id: z.string().min(1),
  account_name: z.string().min(1),
  plan: z.enum([
    "ENTERPRISE",
    "GROWTH",
    "STANDARD",
  ]),
  status: z.enum([
    "ACTIVE",
    "INACTIVE",
  ]),
  csm: z.string().nullable(),
  contract_file: z.string().nullable(),
  premium_support: z.boolean().nullable(),
  notes: z.string().nullable(),
});

export const OrderRowSchema = z.object({
  order_id: z.string().min(1),
  account_id: z.string().min(1),
  carrier: z.string().nullable(),
  status: z.enum([
    "BOOKED",
    "PICKED_UP",
    "DELIVERED",
    "CANCELLED",
  ]),
  booked_at: z.coerce.date().nullable(),
  pickup_window_start: z.coerce.date().nullable(),
  pickup_window_end: z.coerce.date().nullable(),
  pickup_actual_at: z.coerce.date().nullable(),
  shipment_fee_inr: z.coerce.number().int().nonnegative(),
  carrier_fault: z.boolean().nullable(),
  customer_fault: z.boolean().nullable(),
  cancellation_requested_at: z.coerce.date().nullable(),
  notes: z.string().nullable(),
});

export const TicketRowSchema = z.object({
  ticket_id: z.string().min(1),
  account_id: z.string().min(1),
  created_at: z.coerce.date(),
  status: z.enum([
    "OPEN",
    "CLOSED",
    "ON_HOLD",
  ]),
  subject: z.string().nullable(),
  description: z.string().nullable(),
  channel: z.string().nullable(),
  assigned_to: z.string().nullable(),
  last_customer_message_at: z.coerce.date().nullable(),
  historical_resolution: z.string().nullable(),
});

export type AccountRow = z.infer<typeof AccountRowSchema>;
export type OrderRow = z.infer<typeof OrderRowSchema>;
export type TicketRow = z.infer<typeof TicketRowSchema>;

export function validateReferences(accounts:AccountData[],orders:OrderData[],tickets:TicketData[]){
    const accountIds=new Set(accounts.map(account=>account.accountId));
    for(const order of orders){
        if(!accountIds.has(order.accountId)){
            throw new Error(`Order ${order.orderId} has an invalid account ID: ${order.accountId}`);
        }
    }
    for(const ticket of tickets){
        if(!accountIds.has(ticket.accountId)){
            throw new Error(`Ticket ${ticket.ticketId} has an invalid account ID: ${ticket.accountId}`);
        }
    }
    console.log("References validated successfully.");
}