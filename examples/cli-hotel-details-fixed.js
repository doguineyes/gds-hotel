import { SoapClientFixed, buildHotelDetailsReqXml } from "../dist/index.cjs";

const client = new SoapClientFixed({
    endpoint: process.env.GDS_ENDPOINT,
    username: process.env.GDS_USERNAME,
    password: process.env.GDS_PASSWORD,
    soapAction: `"http://localhost:8080/kestrel/HotelService"`,
});

const body = buildHotelDetailsReqXml({
    traceId: "wr-01",
    targetBranch: process.env.GDS_BRANCH,
    languageCode: "ZH-HANS",
    hotelChain: "RZ",
    hotelCode: "53058",
    numberOfAdults: 2,
    numberOfRooms: 1,
    rateRuleDetail: "Complete",
    processAllNegoRatesInd: false,
    checkinDate: "2025-10-20",
    checkoutDate: "2025-10-27",
    corporateCodes: ["SRV","S73","L72","API"],
});

const res = await client.call(body);
console.log(res.body);
