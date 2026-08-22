import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { DOCUMENTS } from "./documents";

export async function uploadDocumentsToDb(){
    let processed=0;
    for(const doc of DOCUMENTS){
        await prisma.document.upsert({
            where:{
                sourceFile:doc.sourceFile
            },
            create:{
                sourceFile:doc.sourceFile,
                docType:doc.docType,
                authorityStatus:doc.authorityStatus,
                processingStatus:"PENDING",
                accountId:doc.accountId,
                effectiveDate:doc.effectiveDate
            },
            update:{
                docType:doc.docType,
                authorityStatus:doc.authorityStatus,
                accountId:doc.accountId,
                effectiveDate:doc.effectiveDate
            }
        })
        processed++;
    }
    return {
        documentsProcessed:processed
    }
}

async function main() {
    const result=await uploadDocumentsToDb()
    console.log("Documents uploaded to db:",result)
}

main().catch((error:Error)=>{
    console.error("Error uploading documents to db:",error)
    process.exit(1)
});