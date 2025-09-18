// cli.ts
import { SoapClient, buildHotelDetailsReqBody, parseHotelDetailsXml } from "../dist/index.js";

(async () => {
    const client = new SoapClient({
        endpoint: process.env.GDS_ENDPOINT!,          // same endpoint you used for PHP
        username: process.env.GDS_USERNAME!,
        password: process.env.GDS_PASSWORD!,
        soapAction: `"http://localhost:8080/kestrel/HotelService"`, // from WSDL/logs
    });

    const xml = buildHotelDetailsReqBody({
        traceId: "wr-01",
        targetBranch: process.env.GDS_BRANCH!,
        languageCode: "ZH-HANS",
        hotelChain: process.env.HOTEL_CHAIN || "RE",
        hotelCode: process.env.HOTEL_CODE || "36863",
        numberOfAdults: 1,
        numberOfRooms: 1,
        rateRuleDetail: "Complete",
        processAllNegoRatesInd: false,
        checkinDate: process.env.CHECKIN_DATE || "2026-09-20",
        checkoutDate: process.env.CHECKOUT_DATE || "2026-09-21",
        corporateCodes: ["V8M","V8A","H4Y","8LX"],
    });

    const res = await client.call(xml);
    console.log(res.body);
    const obj = parseHotelDetailsXml(res.body);
    console.log(JSON.stringify(obj));
})();