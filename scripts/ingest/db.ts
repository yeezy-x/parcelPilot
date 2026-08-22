import {prisma} from "@/lib/db/prisma"
import { AccountData, OrderData, TicketData } from "./transform";

export async function ingestDatabase(accounts:AccountData[],orders:OrderData[],tickets:TicketData[]){
    return prisma.$transaction(async(tx)=>{
        let accountsProcessed=0;
        let ordersProcessed=0;
        let ticketsProcessed=0;
        for(const account of accounts){
            await tx.account.upsert({
                where:{
                    accountId:account.accountId,
                },
                create:account,
                update:account,
            })
            accountsProcessed++;
        }
        for(const order of orders){
            await tx.order.upsert({
                where:{
                    orderId:order.orderId,
                },
                create:order,
                update:order,
            })
            ordersProcessed++;
        }
        for(const ticket of tickets){
            await tx.ticket.upsert({
                where:{
                    ticketId:ticket.ticketId,
                },
                create:ticket,
                update:ticket,
            })
            ticketsProcessed++;
        }
        return {
            accountsProcessed,
            ordersProcessed,
            ticketsProcessed,
        }
    })
}