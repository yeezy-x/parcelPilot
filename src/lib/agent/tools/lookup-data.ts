import "dotenv/config";
import { prisma } from "@/lib/db/prisma";

export type LookupOrderInput = {
  orderId: string;
  accountId?: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function lookupOrder(input: LookupOrderInput) {
  if (!input.accountId) {
    return { found: false, order: null };
  }
  const order = await prisma.order.findFirst({
    where: {
      accountId: input.accountId,
      OR: [
        { orderId: input.orderId },
        ...(isUuid(input.orderId) ? [{ id: input.orderId }] : []),
      ],
    },
  });

  if (!order) {
    return { found: false, order: null };
  }

  return { found: true, order };
}