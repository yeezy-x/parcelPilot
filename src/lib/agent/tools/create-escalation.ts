import {
  EscalationStatus,
  TicketSeverity,
} from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";

export type CreateEscalationInput = {
  ticketId: string;
  accountId: string;
  severity: string;
  summary: string;
};

function mapSeverityToTicketSeverity(
  severity: string,
): TicketSeverity {
  switch (severity.trim().toUpperCase()) {
    case "P1":return TicketSeverity.HIGH;
    case "P2":return TicketSeverity.MEDIUM;
    case "P3":return TicketSeverity.LOW;
    case "HIGH":return TicketSeverity.HIGH;
    case "MEDIUM":return TicketSeverity.MEDIUM;
    case "LOW":return TicketSeverity.LOW;
    default:
      throw new Error(`Invalid escalation severity "${severity}". Expected P1, P2, P3, HIGH, MEDIUM, or LOW.`,);
  }
}

export async function createEscalation(input: CreateEscalationInput) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      accountId: input.accountId,
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