import { AccountRow, OrderRow, TicketRow } from "./validators";

  
  
export function transformAccount(row: AccountRow) {
    return {
      accountId: row.account_id,
      name: row.account_name,
      plan: row.plan,
      status: row.status,
      csm: row.csm,
      contractFile: row.contract_file,
      premiumSupport: row.premium_support,
      notes: row.notes,
    };
}
  
export function transformOrder(row: OrderRow) {
    return {
      orderId: row.order_id,
      accountId: row.account_id,
      carrier: row.carrier,
      status: row.status,
      bookedAt: row.booked_at,
      pickupWindowStart: row.pickup_window_start,
      pickupWindowEnd: row.pickup_window_end,
      pickupActualAt: row.pickup_actual_at,
      shipmentFeeInr: row.shipment_fee_inr,
      carrierFault: row.carrier_fault,
      customerFault: row.customer_fault,
      cancellationRequestedAt: row.cancellation_requested_at,
      notes: row.notes,
    };
}
  
export function transformTicket(row: TicketRow) {
    return {
      ticketId: row.ticket_id,
      accountId: row.account_id,
      createdAt: row.created_at,
      status: row.status,
      severity: null,
      subject: row.subject,
      description: row.description,
      channel: row.channel,
      assignedTo: row.assigned_to,
      lastCustomerMessageAt: row.last_customer_message_at,
      historicalResolution: row.historical_resolution,
  
      contextOnly:
        row.historical_resolution !== null &&
        row.historical_resolution.trim().length > 0,
    };
}

export type AccountData = ReturnType<typeof transformAccount>;
export type OrderData = ReturnType<typeof transformOrder>;
export type TicketData = ReturnType<typeof transformTicket>;

