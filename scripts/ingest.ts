import { prisma } from "@/lib/db/prisma"



async function main(){
    await importWorkbook()
    await importDocuments()
}

main().catch((error)=>{
    console.error(error)
    process.exit(1)
}).finally(()=>
    prisma.$disconnect()
)