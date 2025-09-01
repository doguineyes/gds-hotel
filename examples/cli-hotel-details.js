/*
    Example CLI. Run:
    GDS_ENDPOINT=https://example.com/hotel \
    GDS_USER=yourUser \
    GDS_PASS=yourPass \
    GDS_BRANCH=BRANCH \
    npm run build && npm run example:hotel-details
*/


const { SoapClient, TravelportLikeAdapter } = require('../dist/index.cjs');


(async () => {
    const client = new SoapClient({
        endpoint: process.env.GDS_ENDPOINT,
        namespace: 'gds',
        username: process.env.GDS_USER,
        password: process.env.GDS_PASS,
        resolveSoapAction: (op) => `urn:gds:${op}`,
    });


    const provider = new TravelportLikeAdapter({
        client,
        operations: {
            searchHotels: 'SearchHotels',
            getRoomOffers: 'HotelDetails',
            createBooking: 'CreateBooking',
            cancelBooking: 'CancelBooking',
            getBooking: 'GetBooking',
        },
    });


    const offers = await provider.getRoomOffers('SL:08494', {
        checkin: new Date(Date.now() + 86400000).toISOString().slice(0,10),
        checkout: new Date(Date.now() + 2*86400000).toISOString().slice(0,10),
        guests: { adults: 1, children: 0 },
        extras: {
            traceId: 'wr-01',
            corporateDiscountIds: ['V8M','V8A','H4Y','8LX'],
            rooms: 1,
            languageCode: 'ZH-HANS',
            targetBranch: process.env.GDS_BRANCH,
        },
    });


    console.log(JSON.stringify(offers, null, 2));
})();