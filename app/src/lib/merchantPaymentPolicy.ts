/**
 * Provider-neutral merchant commission POLICY ONLY — not a payment processor.
 *
 * Backend integration MUST use merchant-originated, provider-hosted/direct payment
 * with native platform-fee settlement, where available. Dabberna never charges
 * customer cards into its own balance and never holds or redistributes merchant funds.
 *
 * Keep these immutable calculation snapshots in a SERVER database in production.
 * Browser values, redirect parameters and unverified webhooks are never proof
 * of payment or commission settlement.
 */
export const JOD_FILS_PER_DINAR=1000 as const;
export type CommissionCurrency="JOD";

/** 100 basis points = 1%; 300 = 3%. Stored as an integer, never float. */
export type CommissionAgreement={
 id:string;
 merchantId?:string;
 category?:string;
 rateBasisPoints:number;
 validFrom:string; // YYYY-MM-DD, inclusive
 validThrough?:string; // YYYY-MM-DD, inclusive
};

export type CommissionQuote={
 agreementId:string;
 merchantId:string;
 category:string;
 offerRequestReference:string;
 quotedAt:string; // YYYY-MM-DD
 currency:CommissionCurrency;
 grossFils:number;
 commissionBasisPoints:number;
 dabbernaCommissionFils:number;
 merchantEntitlementFils:number;
};

export type MerchantPaymentStatus="awaiting_payment"|"pending"|"confirmed"|"failed"|"cancelled"|"partially_refunded"|"refunded"|"disputed";
export type CommissionSettlementStatus="not_due"|"pending"|"partially_settled"|"settled"|"partially_reversed"|"reversed"|"failed";
export type RefundCancellationStatus="none"|"refund_pending"|"partially_refunded"|"refunded"|"cancelled"|"disputed";

/**
 * Server-side record shape, NOT a browser ledger. Provider-verified events and
 * settlement reports update statuses in a trusted backend; the customer return
 * URL and the shopper/merchant UI cannot modify them.
 */
export type MerchantPaymentRecord=CommissionQuote & {
 internalTransactionReference:string;
 providerId:string;
 providerMerchantAccountReference:string;
 providerTransactionReference:string|null;
 paymentStatus:MerchantPaymentStatus;
 commissionSettlementStatus:CommissionSettlementStatus;
 refundCancellationStatus:RefundCancellationStatus;
 refundedFils:number;
 commissionSettledFils:number;
 commissionReversedFils:number;
 createdAt:string;
 lastProviderEventAt:string|null;
};

/** Provider conversion is adapter-specific. JOD always uses 3 minor digits here. */
const safeNonnegativeInt=(n:unknown)=>typeof n==="number"&&Number.isSafeInteger(n)&&n>=0;
const safePositiveInt=(n:unknown)=>safeNonnegativeInt(n)&&Number(n)>0;
const dayOk=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(Date.parse(s+"T12:00:00Z")) &&
  new Date(s+"T12:00:00Z").toISOString().slice(0,10)===s;
const present=(s:unknown)=>typeof s==="string"&&s.trim().length>0;

/** Avoid floating-point currency calculations, including for 3-decimal JOD. */
export function parseJodFils(amount:string):number {
 const s=amount.trim();
 if(!/^\d+(?:\.\d{1,3})?$/.test(s))throw new Error("Enter a nonnegative JOD amount with at most three decimal places");
 const [whole,fraction=""]=s.split(".");
 const value=BigInt(whole!)*1000n+BigInt(fraction.padEnd(3,"0"));
 if(value>BigInt(Number.MAX_SAFE_INTEGER))throw new Error("Amount exceeds supported integer range");
 return Number(value);
}
export function formatJodFils(fils:number):string {
 if(!safeNonnegativeInt(fils))throw new Error("Invalid JOD minor-unit amount");
 return (BigInt(fils)/1000n).toString()+"."+(BigInt(fils)%1000n).toString().padStart(3,"0");
}
export function splitCommission(grossFils:number,rateBasisPoints:number):{
 dabbernaCommissionFils:number;merchantEntitlementFils:number;
}{
 if(!safePositiveInt(grossFils))throw new Error("Gross amount must be a positive integer of fils");
 if(!Number.isInteger(rateBasisPoints)||rateBasisPoints<0||rateBasisPoints>10000)
   throw new Error("Invalid commission rate in basis points");
 // Round half up to the nearest fils; any rounding difference goes to merchant.
 const commission=Number((BigInt(grossFils)*BigInt(rateBasisPoints)+5000n)/10000n);
 return {dabbernaCommissionFils:commission,merchantEntitlementFils:grossFils-commission};
}
function validateAgreement(a:CommissionAgreement){
 if(!present(a.id)||(!present(a.merchantId)&&!present(a.category))||
    (a.merchantId!==undefined&&!present(a.merchantId))||
    (a.category!==undefined&&!present(a.category))||
    !Number.isInteger(a.rateBasisPoints)||a.rateBasisPoints<0||a.rateBasisPoints>10000||
    !dayOk(a.validFrom)||
    (a.validThrough!==undefined&&(!dayOk(a.validThrough)||a.validThrough<a.validFrom)))
   throw new Error("Invalid merchant/category commission agreement");
}
/**
 * Specific merchant+category agreements take precedence over merchant-wide,
 * then category-wide agreements. An ambiguous or missing agreement fails closed.
 * Historical transaction quotes retain the agreed rate even after changes.
 */
export function selectCommissionAgreement(
 agreements:readonly CommissionAgreement[],
 merchantId:string,category:string,onDate:string
):CommissionAgreement {
 if(!present(merchantId)||!present(category)||!dayOk(onDate))throw new Error("Invalid quote identifiers or date");
 for(const a of agreements)validateAgreement(a);
 const candidates=agreements.filter(a=>
   (a.merchantId===undefined||a.merchantId===merchantId)&&
   (a.category===undefined||a.category===category)&&
   a.validFrom<=onDate&&(a.validThrough===undefined||a.validThrough>=onDate)
 );
 if(candidates.length===0)throw new Error("No valid commission agreement for merchant and category");
 const score=(a:CommissionAgreement)=>(a.merchantId===undefined?0:2)+(a.category===undefined?0:1);
 const best=Math.max(...candidates.map(score));
 const matching=candidates.filter(a=>score(a)===best);
 if(matching.length!==1)throw new Error("Overlapping commission agreements; resolve before payment");
 return matching[0]!;
}
export function quoteMerchantCommission(input:{
 merchantId:string;category:string;offerRequestReference:string;grossFils:number;date:string;
},agreements:readonly CommissionAgreement[]):CommissionQuote {
 if(!present(input.offerRequestReference))throw new Error("Offer/request reference is required");
 const agreement=selectCommissionAgreement(agreements,input.merchantId,input.category,input.date);
 const split=splitCommission(input.grossFils,agreement.rateBasisPoints);
 return {
  agreementId:agreement.id,
  merchantId:input.merchantId,category:input.category,
  offerRequestReference:input.offerRequestReference,quotedAt:input.date,
  currency:"JOD",grossFils:input.grossFils,
  commissionBasisPoints:agreement.rateBasisPoints,...split
 };
}
/** A transaction record must be created by the server BEFORE external checkout. */
export function initialMerchantPaymentRecord(input:{
 quote:CommissionQuote;
 internalTransactionReference:string;
 providerId:string;
 providerMerchantAccountReference:string;
 createdAt:string;
}):MerchantPaymentRecord {
 if(![input.internalTransactionReference,input.providerId,input.providerMerchantAccountReference]
      .every(present)||Number.isNaN(Date.parse(input.createdAt)))
   throw new Error("Missing trusted payment reference, provider merchant account or timestamp");
 if(input.quote.currency!=="JOD"||
    !safePositiveInt(input.quote.grossFils)||
    !Number.isInteger(input.quote.commissionBasisPoints)||
    !present(input.quote.merchantId)||!present(input.quote.offerRequestReference)||
    !present(input.quote.agreementId))
   throw new Error("Invalid server commission quote");
 const split=splitCommission(input.quote.grossFils,input.quote.commissionBasisPoints);
 if(split.dabbernaCommissionFils!==input.quote.dabbernaCommissionFils||
    split.merchantEntitlementFils!==input.quote.merchantEntitlementFils)
   throw new Error("Commission snapshot does not reconcile");
 return {
   ...input.quote,
   internalTransactionReference:input.internalTransactionReference,
   providerId:input.providerId,providerMerchantAccountReference:input.providerMerchantAccountReference,
   providerTransactionReference:null,
   paymentStatus:"awaiting_payment",commissionSettlementStatus:"not_due",
   refundCancellationStatus:"none",
   refundedFils:0,commissionSettledFils:0,commissionReversedFils:0,
   createdAt:input.createdAt,lastProviderEventAt:null
 };
}
