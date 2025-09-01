# @doguin/gds-hotel

Unofficial **Hotel GDS SOAP client** (TypeScript). Clean interface (`ProviderPort`) + generic `SoapAdapter` + a Travelport-like convenience adapter. Works in **TypeScript** and **plain Node.js (ESM/CJS)**.


> **Note**: Do not commit secrets. Follow your provider's Terms of Service / NDA. This project does not ship vendor WSDL/XSD.


## Install & Build
```bash
npm i
npm run build
```


## Quick Start (JS or TS)
```js
import { SoapClient, TravelportLikeAdapter } from '@my-scope/gds-hotel';


const client = new SoapClient({
    endpoint: process.env.GDS_ENDPOINT,
    namespace: 'gds',
    username: process.env.GDS_USER,
    password: process.env.GDS_PASS,
    resolveSoapAction: (op) => `urn:gds:${op}`
});


const provider = new TravelportLikeAdapter({
    client,
    operations: {
        searchHotels: 'SearchHotels',
        getRoomOffers: 'HotelDetails',
        createBooking: 'CreateBooking',
        cancelBooking: 'CancelBooking',
        getBooking: 'GetBooking',
    }
});


const offers = await provider.getRoomOffers('SL:08494', {
    checkin: '2025-11-01',
    checkout: '2025-11-03',
    guests: { adults: 1, children: 0 },
    extras: {
    traceId: 'wr-01',
    corporateDiscountIds: ['V8M','V8A','H4Y','8LX'],
    rooms: 1,
    languageCode: 'ZH-HANS',
    targetBranch: process.env.GDS_BRANCH,
},
});
console.log(offers);
```


## Example CLI
Create a `.env` with `GDS_ENDPOINT`, `GDS_USER`, `GDS_PASS`, `GDS_BRANCH` (if needed), then:
```bash
npm run build
npm run example:hotel-details
```


## Publishing
```bash
npm publish --access public
```


## Disclaimer
This library is **unofficial**. You are responsible for compliance with provider ToS/NDA. No credentials or proprietary WSDLs are included.


## License
MIT © 2025 Dog Chen