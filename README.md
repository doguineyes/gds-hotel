# @doguin/gds-hotel

Provider-agnostic Hotel Distribution SDK core (TypeScript) exposing a `ProviderPort` interface, a runnable mock `SampleGDSAdapter`, **and a generic `SoapAdapter`** you can wire to any SOAP-based provider (without committing secrets).


## Quick start


```bash
pnpm i
pnpm build
```

### Use from TypeScript
```ts
import { SoapClient, SoapAdapter } from "@doguin/gds-hotel";


const client = new SoapClient({
    endpoint: process.env.GDS_ENDPOINT!,
    namespace: "gds", // vendor-specific prefix (does not leak secrets)
    username: process.env.GDS_USER, // optional
    password: process.env.GDS_PASS, // optional
    resolveSoapAction: (op) => `urn:gds:${op}` // optional header if your provider requires SOAPAction
});


const provider = new SoapAdapter({
    client,
    operations: {
        searchHotels: "SearchHotels",
        getRoomOffers: "GetRoomOffers",
        createBooking: "CreateBooking",
        cancelBooking: "CancelBooking",
        getBooking: "GetBooking",
    }
});


const hotels = await provider.searchHotels({ city: "New York", checkin: "2025-10-01", checkout: "2025-10-03", guests: { adults: 2 } });
```

### Use from Node.js (CommonJS)
```js
const { SoapClient, SoapAdapter } = require("@your-scope/hotel-distribution-core");


const client = new SoapClient({ endpoint: process.env.GDS_ENDPOINT, namespace: "gds" });
const provider = new SoapAdapter({ client, operations: { searchHotels: "SearchHotels", getRoomOffers: "GetRoomOffers", createBooking: "CreateBooking", cancelBooking: "CancelBooking", getBooking: "GetBooking" } });


(async () => {
    const hotels = await provider.searchHotels({ city: "boston", checkin: "2025-10-01", checkout: "2025-10-03", guests: { adults: 2 } });
    console.log(hotels);
})();
```


## Publishing safely
- **Do not** commit credentials. Use env vars and CI secrets.
- If the provider's **WSDL and schema are not public**, avoid committing them; let users pass an endpoint at runtime.
- Keep brand/vendor names out of public code if your contract/ToS restricts them; this adapter is vendor-agnostic by design.
- Add a clear **DISCLAIMER** in the README that this library is unofficial and users must follow their provider's ToS.


## Roadmap
- v0.1.x: ports + mock adapter ✅
- **v0.2.x: generic SOAP adapter ✅**
- v0.3.x: retries/backoff, circuit breaker, and structured ProviderError
- v0.4.x: REST gateway + OpenAPI