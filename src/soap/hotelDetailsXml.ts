export type HotelDetailsParams = {
    traceId: string;
    targetBranch: string;
    languageCode?: string;                 // e.g. "ZH-HANS"
    returnMediaLinks?: boolean;            // default false
    returnGuestReviews?: boolean;          // default false
    hotelChain: string;                    // e.g. "RE"
    hotelCode: string;                     // e.g. "36863"
    numberOfAdults: number;                // e.g. 1 or 2
    numberOfRooms?: number;                // default 1
    rateRuleDetail?: "None" | "Complete";  // default "Complete"
    processAllNegoRatesInd?: boolean;      // default false
    checkinDate: string;                   // "YYYY-MM-DD"
    checkoutDate: string;                  // "YYYY-MM-DD"
    corporateCodes?: string[];             // e.g. ["V8M","V8A","H4Y","8LX","YR1","YR9"]
};

// hotelDetailsXml.ts (fixed): return ONLY the <ns2:HotelDetailsReq ...> element
const nsCom = "http://www.travelport.com/schema/common_v52_0";
const nsHot = "http://www.travelport.com/schema/hotel_v52_0";

export function buildHotelDetailsReqBody(p: HotelDetailsParams): string {
    const esc = (s: unknown) => String(s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

    const returnMedia = p.returnMediaLinks ?? false;
    const returnReviews = p.returnGuestReviews ?? false;
    const rooms = p.numberOfRooms ?? 1;
    const rateRule = p.rateRuleDetail ?? "Complete";
    const processAllNego = p.processAllNegoRatesInd ?? false;

    const corpXml = (p.corporateCodes ?? [])
        .map(c => `<ns1:CorporateDiscountID NegotiatedRateCode="true">${esc(c)}</ns1:CorporateDiscountID>`)
        .join("");

    // IMPORTANT: declare ns1/ns2 HERE since the envelope (in SoapClient) won’t declare them
    return `
<ns2:HotelDetailsReq TraceId="${esc(p.traceId)}" TargetBranch="${esc(p.targetBranch)}"${p.languageCode ? ` LanguageCode="${esc(p.languageCode)}"` : ""} ReturnMediaLinks="${returnMedia}" ReturnGuestReviews="${returnReviews}" xmlns:ns1="${nsCom}" xmlns:ns2="${nsHot}">
  <ns1:BillingPointOfSaleInfo OriginApplication="UAPI"/>
  <ns2:HotelProperty HotelChain="${esc(p.hotelChain)}" HotelCode="${esc(p.hotelCode)}"/>
  <ns2:HotelDetailsModifiers NumberOfAdults="${esc(p.numberOfAdults)}" RateRuleDetail="${esc(rateRule)}" NumberOfRooms="${esc(rooms)}" ProcessAllNegoRatesInd="${processAllNego}">
    ${corpXml}
    <ns2:HotelStay>
      <ns2:CheckinDate>${esc(p.checkinDate)}</ns2:CheckinDate>
      <ns2:CheckoutDate>${esc(p.checkoutDate)}</ns2:CheckoutDate>
    </ns2:HotelStay>
  </ns2:HotelDetailsModifiers>
</ns2:HotelDetailsReq>`.trim();
}
