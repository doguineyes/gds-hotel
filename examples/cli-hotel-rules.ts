// cli-hotel-rules.ts
import { SoapClient, buildHotelRulesReqBody, parseHotelRulesXml } from "../dist/index.js";

(async () => {
    const client = new SoapClient({
        endpoint: process.env.GDS_ENDPOINT!,
        username: process.env.GDS_USERNAME!,
        password: process.env.GDS_PASSWORD!,
        soapAction: `"http://localhost:8080/kestrel/HotelService"`, // same as details  :contentReference[oaicite:5]{index=5}
    });

    const xml = buildHotelRulesReqBody({
        traceId: "wr-01",
        targetBranch: process.env.GDS_BRANCH!,
        languageCode: "ZH-HANS",
        ratePlanType: "K00SH0K",         // from your log example  :contentReference[oaicite:6]{index=6}
        base: "CNY5688.00",              // optional; present in first log request  :contentReference[oaicite:7]{index=7}
        hotelChain: "RZ",
        hotelCode: "53058",
        checkinDate: "2025-10-06",
        checkoutDate: "2025-10-12",
        numberOfAdults: 2,
        numberOfRooms: 1,
        corporateCodes: ["S73"],         // matches CorporateDiscountID in log  :contentReference[oaicite:8]{index=8}
        negotiatedRateCode: true,
    });

    const res = await client.call(xml);     // your SoapClient already logs req/res in TS
    const parsed = parseHotelRulesXml(res.body);
    console.log(JSON.stringify(parsed, null, 2));
})();
