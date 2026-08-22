import { ingestDocuments } from "./ingest-docs";

async function main() {
    const result=await ingestDocuments()
    console.log("Documents ingested:",result)
}

main().catch((error:Error)=>{
    console.error("Error ingesting documents:",error)
    process.exit(1)
});