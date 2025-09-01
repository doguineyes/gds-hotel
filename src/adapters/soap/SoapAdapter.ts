import type { ProviderPort, SearchQuery, OfferQuery, CreateBookingInput } from "../../ports/ProviderPort";
import type { Hotel } from "../../domain/Hotel";
import type { RoomOffer } from "../../domain/RoomOffer";
import type { Booking } from "../../domain/Booking";
import { SoapClient } from "./SoapClient";
import { parseSearchHotels, parseGetOffers, parseBooking } from "./mappers";


export type SoapAdapterConfig = {
    client: SoapClient;
    operations: {
        searchHotels: string;
        getRoomOffers: string;
        createBooking: string;
        cancelBooking: string;
        getBooking: string;
    };
};

export class SoapAdapter implements ProviderPort {
    constructor(private cfg: SoapAdapterConfig) {}


    async searchHotels(q: SearchQuery): Promise<Hotel[]> {
        const body =
            `<City>${escape(q.city ?? "")}</City>`+
            `<Checkin>${escape(q.checkin)}</Checkin>`+
            `<Checkout>${escape(q.checkout)}</Checkout>`+
            `<Guests><Adults>${q.guests.adults}</Adults>${q.guests.children ? `<Children>${q.guests.children}</Children>`: ""}</Guests>`+
            (q.hotelIds?.length ? `<HotelIds>${q.hotelIds.map(id => `<Id>${escape(id)}</Id>`).join("")}</HotelIds>` : "")+
            `<Paging><Page>${q.page ?? 1}</Page><Size>${q.size ?? 20}</Size></Paging>`;


        const xml = await this.cfg.client.call(this.cfg.operations.searchHotels, body);
        return parseSearchHotels(xml);
    }


    async getRoomOffers(hotelId: string, q: OfferQuery): Promise<RoomOffer[]> {
        const body =
            (q.extras?.hotelChain && q.extras?.hotelCode
                ? `<HotelProperty><HotelChain>${escape(q.extras.hotelChain)}</HotelChain><HotelCode>${escape(q.extras.hotelCode)}</HotelCode></HotelProperty>`
                : `<HotelId>${escape(hotelId)}</HotelId>`) +
            `<Checkin>${escape(q.checkin)}</Checkin>`+
            `<Checkout>${escape(q.checkout)}</Checkout>`+
            `<Guests><Adults>${q.guests.adults}</Adults>${q.guests.children ? `<Children>${q.guests.children}</Children>`: ""}</Guests>`+
            (q.extras?.rooms ? `<NumberOfRooms>${q.extras.rooms}</NumberOfRooms>` : "")+
            (q.extras?.corporateDiscountIds?.length ? `<CorporateDiscountID>${q.extras.corporateDiscountIds.map(code => `<Id>${escape(code)}</Id>`).join("")}</CorporateDiscountID>` : "")+
            (q.extras?.childrenAges?.length ? `<ChildrenAges>${q.extras.childrenAges.map(a => `<Age>${a}</Age>`).join("")}</ChildrenAges>` : "")+
            (q.extras?.nextRefId ? `<NextResultReference>${escape(q.extras.nextRefId)}</NextResultReference>` : "")+
            (q.extras?.languageCode ? `<LanguageCode>${escape(q.extras.languageCode)}</LanguageCode>` : "")+
            (q.extras?.targetBranch ? `<TargetBranch>${escape(q.extras.targetBranch)}</TargetBranch>` : "")+
            (q.extras?.traceId ? `<TraceId>${escape(q.extras.traceId)}</TraceId>` : "");


        const xml = await this.cfg.client.call(this.cfg.operations.getRoomOffers, body);
        return parseGetOffers(xml);
    }


    async createBooking(input: CreateBookingInput, opts?: { idempotencyKey?: string }): Promise<Booking> {
        const body =
            `<OfferId>${escape(input.offerId)}</OfferId>`+
            `<Guest><FirstName>${escape(input.guest.firstName)}</FirstName><LastName>${escape(input.guest.lastName)}</LastName>${input.guest.email ? `<Email>${escape(input.guest.email)}</Email>`: ""}${input.guest.phone ? `<Phone>${escape(input.guest.phone)}</Phone>`: ""}</Guest>`+
            (opts?.idempotencyKey ? `<IdempotencyKey>${escape(opts.idempotencyKey)}</IdempotencyKey>` : "");


        const xml = await this.cfg.client.call(this.cfg.operations.createBooking, body);
        return parseBooking(xml);
    }


    async cancelBooking(id: string): Promise<Booking> {
        const body = `<BookingId>${escape(id)}</BookingId>`;
        const xml = await this.cfg.client.call(this.cfg.operations.cancelBooking, body);
        return parseBooking(xml);
    }


    async getBooking(id: string): Promise<Booking> {
        const body = `<BookingId>${escape(id)}</BookingId>`;
        const xml = await this.cfg.client.call(this.cfg.operations.getBooking, body);
        return parseBooking(xml);
    }
}


function escape(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }