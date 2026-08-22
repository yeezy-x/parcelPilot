import path from "node:path";

export type DocumentMetadata = {
    sourceFile: string;
    docType: "POLICY" | "SOP" | "PRODUCT_DOC" | "AGREEMENT";
    authorityStatus: "CURRENT" | "DEPRECATED";
    accountId: string | null;
    effectiveDate: Date | null;
};
export const DOCUMENTS: DocumentMetadata[] = [
    {
        sourceFile: "01_Support_Policy_v3_CURRENT.pdf",
        docType: "POLICY",
        authorityStatus: "CURRENT",
        accountId: null,
        effectiveDate: new Date("2026-05-01"),
    },
    {
        sourceFile: "02_Support_Policy_v2_DEPRECATED.pdf",
        docType: "POLICY",
        authorityStatus: "DEPRECATED",
        accountId: null,
        effectiveDate: null,
    },
    {
        sourceFile: "03_Cancellation_and_Service_Credit_SOP_v4.pdf",
        docType: "SOP",
        authorityStatus: "CURRENT",
        accountId: null,
        effectiveDate: null,
    },
    {
        sourceFile: "04_Product_Operations_Guide_and_Known_Issues.pdf",
        docType: "PRODUCT_DOC",
        authorityStatus: "CURRENT",
        accountId: null,
        effectiveDate: null,
    },
    {
        sourceFile: "05_Northstar_Logistics_Enterprise_Agreement.pdf",
        docType: "AGREEMENT",
        authorityStatus: "CURRENT",
        accountId: "ACCT-001",
        effectiveDate: null,
    },
    {
        sourceFile: "06_LumenWorks_Service_Agreement.pdf",
        docType: "AGREEMENT",
        authorityStatus: "CURRENT",
        accountId: "ACCT-002",
        effectiveDate: null,
    }
];

export function getPdfPath(sourceFile: string): string {
    return path.resolve(process.cwd(), "data", sourceFile);
}
