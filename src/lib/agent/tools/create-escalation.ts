import { EscalationStatus, TicketSeverity } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CreateEscalationInput = {
  ticketId: string;
  accountId: string;
  severity: string;
  summary: string;
};

export async function createEscalation(
  input: CreateEscalationInput,
) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      accountId: input.accountId,
    },
  });

  if (!ticket) {
    throw new Error(
      "Ticket not found or does not belong to this account.",
    );
  }

  const escalation = await prisma.escalation.create({
    data: {
      escalationId: crypto.randomUUID(),
      accountId: input.accountId,
      ticketId: ticket.id,
      severity: input.severity as TicketSeverity,
      summary: input.summary,
      status: "CREATED" as EscalationStatus,
      reason: "Escalation created by agent",
    },
  });

  return {
    success: true,
    escalation,
  };
}