// hotelRulesXml.ts  (FIXED: Body-only; declare ns1/ns2 here)
type BuildHotelRulesReq = {
    traceId: string;
    targetBranch: string;
    languageCode?: string;
    ratePlanType: string;
    base?: string;
    hotelChain: string;
    hotelCode: string;
    checkinDate: string;
    checkoutDate: string;
    numberOfAdults: number;
    numberOfRooms: number;
    corporateCodes?: string[];
    negotiatedRateCode?: boolean;
};

export function buildHotelRulesReqBody(p: BuildHotelRulesReq): string {
    const nsCom = "http://www.travelport.com/schema/common_v52_0";
    const nsHot = "http://www.travelport.com/schema/hotel_v52_0";
    const esc = (s: string) =>
        s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
    const negotiated = p.negotiatedRateCode ?? true;

    const corpIds = (p.corporateCodes ?? [])
        .map(code =>
            `<ns1:CorporateDiscountID NegotiatedRateCode="${negotiated ? "true" : "false"}">${esc(code)}</ns1:CorporateDiscountID>`
        )
        .join("");

    return `
<ns2:HotelRulesReq TraceId="${esc(p.traceId)}" TargetBranch="${esc(p.targetBranch)}"${p.languageCode ? ` LanguageCode="${esc(p.languageCode)}"` : ""} xmlns:ns1="${nsCom}" xmlns:ns2="${nsHot}">
  <ns1:BillingPointOfSaleInfo OriginApplication="UAPI"/>
  <ns2:HotelRulesLookup RatePlanType="${esc(p.ratePlanType)}"${p.base ? ` Base="${esc(p.base)}"` : ""}>
    <ns2:HotelProperty HotelChain="${esc(p.hotelChain)}" HotelCode="${esc(p.hotelCode)}"/>
    <ns2:HotelStay>
      <ns2:CheckinDate>${esc(p.checkinDate)}</ns2:CheckinDate>
      <ns2:CheckoutDate>${esc(p.checkoutDate)}</ns2:CheckoutDate>
    </ns2:HotelStay>
    <ns2:HotelRulesModifiers NumberOfAdults="${p.numberOfAdults}" NumberOfRooms="${p.numberOfRooms}">
      ${corpIds}
    </ns2:HotelRulesModifiers>
  </ns2:HotelRulesLookup>
</ns2:HotelRulesReq>`.trim();
}
