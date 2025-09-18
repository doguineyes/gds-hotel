# gds-hotel

TypeScript helpers for Travelport UAPI **HotelService** SOAP API.  
Supports `HotelDetailsReq/HotelDetailsRsp` and `HotelRulesReq/HotelRulesRsp`.

## Features

- Build Body-only SOAP request XML for details and rules
- Wrap with a minimal `SoapClient` that handles auth + SOAPAction
- Parse responses into UpperCamel JSON objects (matches Travelport schema names)
- Tested with Node.js 20/22

## Install

```bash
npm install gds-hotel
```

## Usage

```ts
import {
  SoapClient,
  buildHotelDetailsReqBody,
  parseHotelDetailsXml,
  buildHotelRulesReqBody,
  parseHotelRulesXml
} from "gds-hotel";

const client = new SoapClient({
  endpoint: process.env.GDS_ENDPOINT!,
  username: process.env.GDS_USERNAME!,
  password: process.env.GDS_PASSWORD!,
  soapAction: `"http://localhost:8080/kestrel/HotelService"`,
});

// Hotel Details
const detailsXml = buildHotelDetailsReqBody({
  traceId: "wr-01",
  targetBranch: process.env.GDS_BRANCH!,
  languageCode: "ZH-HANS",
  hotelChain: "RE",
  hotelCode: "36863",
  numberOfAdults: 1,
  numberOfRooms: 1,
  rateRuleDetail: "Complete",
  processAllNegoRatesInd: false,
  checkinDate: "2025-09-20",
  checkoutDate: "2025-09-21",
  corporateCodes: ["V8M", "V8A", "H4Y", "8LX"]
});

const detailsRes = await client.call(detailsXml);
const detailsObj = parseHotelDetailsXml(detailsRes.body);

// Hotel Rules
const rulesXml = buildHotelRulesReqBody({
  traceId: "wr-01",
  targetBranch: process.env.GDS_BRANCH!,
  languageCode: "ZH-HANS",
  ratePlanType: "K00SH0K",
  base: "CNY5688.00",
  hotelChain: "RZ",
  hotelCode: "53058",
  checkinDate: "2026-10-06",
  checkoutDate: "2026-10-07",
  numberOfAdults: 1,
  numberOfRooms: 1,
  corporateCodes: ["S73"],
  negotiatedRateCode: true
});

const rulesRes = await client.call(rulesXml);
const rulesObj = parseHotelRulesXml(rulesRes.body);
```

See [`examples/cli-hotel-details.js`](examples/cli-hotel-details.js) and [`examples/cli-hotel-rules.js`](examples/cli-hotel-rules.js) for complete runnable code.

## Environment Variables

- `GDS_ENDPOINT` – Travelport HotelService endpoint
- `GDS_USERNAME` – UAPI username
- `GDS_PASSWORD` – UAPI password
- `GDS_BRANCH` – TargetBranch (e.g. `P3824210`)
- `HOTEL_CHAIN`, `HOTEL_CODE`, `CHECKIN_DATE`, `CHECKOUT_DATE`, `RATE_PLAN_TYPE` (for examples)

## Notes

- Always pass **Body-only** XML to `SoapClient.call()`. It will wrap it in a SOAP envelope.
- If you pass a full `<SOAP-ENV:Envelope>`, you’ll get `400 Request data not found`.

## License

MIT
