import type { ProviderPort, SearchQuery, OfferQuery, CreateBookingInput } from "../../ports/ProviderPort";
import type { Hotel } from "../../domain/Hotel";
import type { RoomOffer } from "../../domain/RoomOffer";
import type { Booking } from "../../domain/Booking";
import { parseSearchHotels, parseGetOffers, parseBooking } from "./mappers";
import { SoapClient } from "./SoapClient";


export type SoapProviderDeps = {
    client: SoapClient;
    operations: {
        searchHotels: string;
        getRoomOffers: string;
        createBooking: string;
        cancelBooking: string;
        getBooking: string;
    };
};

export function createSoapProvider(deps: SoapProviderDeps): ProviderPort {
    const searchHotels: ProviderPort["searchHotels"] = async (q: SearchQuery): Promise<Hotel[]> => {
        const body =
            `<City>${esc(q.city ?? "")}</City>`+
            `<Checkin>${esc(q.checkin)}</Checkin>`+
            `<Checkout>${esc(q.checkout)}</Checkout>`+
            `<Guests><Adults>${q.guests.adults}</Adults>${q.guests.children ? `<Children>${q.guests.children}</Children>`: ""}</Guests>`+
            (q.hotelIds?.length ? `<HotelIds>${q.hotelIds.map(id => `<Id>${esc(id)}</Id>`).join("")}</HotelIds>` : "")+
            `<Paging><Page>${q.page ?? 1}</Page><Size>${q.size ?? 20}</Size></Paging>`;
        const xml = await deps.client.call(deps.operations.searchHotels, body);
        return parseSearchHotels(xml);
    };


    const getRoomOffers: ProviderPort["getRoomOffers"] = async (hotelId: string, q: OfferQuery): Promise<RoomOffer[]> => {
        const x = q.extras ?? {};
        const hotelXml = (x.hotelChain && x.hotelCode)
            ? `<HotelProperty><HotelChain>${esc(x.hotelChain)}</HotelChain><HotelCode>${esc(x.hotelCode)}</HotelCode></HotelProperty>`
            : `<HotelId>${esc(hotelId)}</HotelId>`;
        const body =
            hotelXml +
            `<Checkin>${esc(q.checkin)}</Checkin>`+
            `<Checkout>${esc(q.checkout)}</Checkout>`+
            `<Guests><Adults>${q.guests.adults}</Adults>${q.guests.children ? `<Children>${q.guests.children}</Children>`: ""}</Guests>`+
            (x.rooms ? `<NumberOfRooms>${x.rooms}</NumberOfRooms>` : "")+
            (x.corporateDiscountIds?.length ? `<CorporateDiscountID>${x.corporateDiscountIds.map((c: string) => `<Id>${esc(c)}</Id>`).join("")}</CorporateDiscountID>` : "")+
            (x.childrenAges?.length ? `<ChildrenAges>${x.childrenAges.map((a: number) => `<Age>${a}</Age>`).join("")}</ChildrenAges>` : "")+
            (x.nextRefId ? `<NextResultReference>${esc(x.nextRefId)}</NextResultReference>` : "")+
            (x.languageCode ? `<LanguageCode>${esc(x.languageCode)}</LanguageCode>` : "")+
            (x.targetBranch ? `<TargetBranch>${esc(x.targetBranch)}</TargetBranch>` : "")+
            (x.traceId ? `<TraceId>${esc(x.traceId)}</TraceId>` : "");
        const xml = await deps.client.call(deps.operations.getRoomOffers, body);
        return parseGetOffers(xml);
    };


    const createBooking: ProviderPort["createBooking"] = async (input: CreateBookingInput, opts?: { idempotencyKey?: string }): Promise<Booking> => {
        const body =
            `<OfferId>${esc(input.offerId)}</OfferId>`+
            `<Guest><FirstName>${esc(input.guest.firstName)}</FirstName><LastName>${esc(input.guest.lastName)}</LastName>${input.guest.email ? `<Email>${esc(input.guest.email)}</Email>`: ""}${input.guest.phone ? `<Phone>${esc(input.guest.phone)}</Phone>`: ""}</Guest>`+
            (opts?.idempotencyKey ? `<IdempotencyKey>${esc(opts.idempotencyKey)}</IdempotencyKey>` : "");
        const xml = await deps.client.call(deps.operations.createBooking, body);
        return parseBooking(xml);
    };


    const cancelBooking: ProviderPort["cancelBooking"] = async (id: string): Promise<Booking> => {
        const body = `<BookingId>${esc(id)}</BookingId>`;
        const xml = await deps.client.call(deps.operations.cancelBooking, body);
        return parseBooking(xml);
    };


    const getBooking: ProviderPort["getBooking"] = async (id: string): Promise<Booking> => {
        const body = `<BookingId>${esc(id)}</BookingId>`;
        const xml = await deps.client.call(deps.operations.getBooking, body);
        return parseBooking(xml);
    };

    return { searchHotels, getRoomOffers, createBooking, cancelBooking, getBooking };
}


function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;"); }