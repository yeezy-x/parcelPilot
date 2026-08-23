import { EscalationStatus, TicketSeverity } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CreateEscalationInput = {
  ticketId: string;
  accountId: string;
  severity: string;
  summary: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function mapSeverityToTicketSeverity(severity: string): TicketSeverity {
  switch (severity.trim().toUpperCase()) {
    case "P1": return TicketSeverity.HIGH;
    case "P2": return TicketSeverity.MEDIUM;
    case "P3": return TicketSeverity.LOW;
    case "HIGH": return TicketSeverity.HIGH;
    case "MEDIUM": return TicketSeverity.MEDIUM;
    case "LOW": return TicketSeverity.LOW;
    default:
      throw new Error(`Invalid escalation severity "${severity}". Expected P1, P2, P3, HIGH, MEDIUM, or LOW.`);
  }
}

export async function createEscalation(input: CreateEscalationInput) {
  if (!input.accountId) {
    throw new Error("Account ID is required.");
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      accountId: input.accountId,
      OR: [
        { ticketId: input.ticketId },
        ...(isUuid(input.ticketId) ? [{ id: input.ticketId }] : []),
      ],
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found or does not belong to this account.");
  }

  const severity = mapSeverityToTicketSeverity(input.severity);
  const escalation = await prisma.escalation.create({
    data: {
      escalationId: crypto.randomUUID(),
      accountId: input.accountId,
      ticketId: ticket.ticketId,
      severity,
      summary: input.summary,
      status: EscalationStatus.CREATED,
      reason: "Escalation created by agent",
    },
  });

  return {
    success: true,
    escalation,
  };
}