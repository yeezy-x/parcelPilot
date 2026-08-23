import "dotenv/config";
import { prisma } from "@/lib/db/prisma";

export type LookupOrderInput = {
  orderId: string;
  accountId?: string;
};

export async function lookupOrder(input: LookupOrderInput) {
  const order = await prisma.order.findFirst({
    where: {
      orderId: input.orderId,
      ...(input.accountId && { accountId: input.accountId }),
    },
  });

  if (!order) {
    return {
      found: false,
      order: null,
    };
  }

  return {
    found: true,
    order,
  };
}