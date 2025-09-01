import { XMLParser } from "fast-xml-parser";
import type { Hotel } from "../../domain/Hotel";
import type { RoomOffer } from "../../domain/RoomOffer";
import type { Booking } from "../../domain/Booking";


const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });


export function parseSearchHotels(xml: string): Hotel[] {
    const json = parser.parse(xml);
    const hotels = get(json, ["soap:Envelope", "soap:Body", "SearchHotelsResponse", "Hotels", "Hotel"]);
    const list = Array.isArray(hotels) ? hotels : hotels ? [hotels] : [];
    return list.map((h: any) => ({
        id: String(h.Id ?? h.id ?? h["@_id"] ?? ""),
        name: String(h.Name ?? h.name ?? ""),
        address: h.Address ?? undefined,
        latitude: numOrUndefined(h.Latitude),
        longitude: numOrUndefined(h.Longitude),
        amenities: arrayOrEmpty(h.Amenities?.Amenity).map((a: any) => String(a))
    }));
}


export function parseGetOffers(xml: string): RoomOffer[] {
    const json = parser.parse(xml);
    const offers = get(json, ["soap:Envelope", "soap:Body", "GetRoomOffersResponse", "Offers", "Offer"]);
    const list = Array.isArray(offers) ? offers : offers ? [offers] : [];
    return list.map((o: any) => ({
        id: String(o.Id ?? o.id ?? ""),
        hotelId: String(o.HotelId ?? o.hotelId ?? ""),
        roomType: String(o.RoomType ?? "Room"),
        occupancy: { adults: numOrDefault(o.Adults, 2), children: numOrUndefined(o.Children) },
        ratePlanId: String(o.RatePlanId ?? ""),
        price: { currency: String(o.Price?.Currency ?? "USD"), amount: Number(o.Price?.Amount ?? 0) },
        cancellationPolicy: o.CancellationPolicy ?? undefined,
        fees: arrayOrEmpty(o.Fees?.Fee).map((f: any) => ({ name: String(f.Name ?? "fee"), price: { currency: String(f.Price?.Currency ?? "USD"), amount: Number(f.Price?.Amount ?? 0) } }))
    }));
}


export function parseBooking(xml: string): Booking {
    const json = parser.parse(xml);
    const b = get(json, ["soap:Envelope", "soap:Body", "CreateBookingResponse", "Booking"]) ||
        get(json, ["soap:Envelope", "soap:Body", "GetBookingResponse", "Booking"]) ||
        get(json, ["soap:Envelope", "soap:Body", "CancelBookingResponse", "Booking"]);
    return {
        id: String(b.Id ?? b.id ?? ""),
        offerId: String(b.OfferId ?? b.offerId ?? ""),
        guest: {
            firstName: String(b.Guest?.FirstName ?? ""),
            lastName: String(b.Guest?.LastName ?? "")
        },
        priceBreakdown: arrayOrEmpty(b.PriceBreakdown?.Item).map((it: any) => ({ label: String(it.Label ?? "item"), price: { currency: String(it.Price?.Currency ?? "USD"), amount: Number(it.Price?.Amount ?? 0) } })),
        status: String(b.Status ?? "CONFIRMED") as any,
        createdAt: String(b.CreatedAt ?? new Date().toISOString())
    };
}


function get(obj: any, path: string[]): any { return path.reduce((o, k) => (o ? o[k] : undefined), obj); }
function arrayOrEmpty(x: any): any[] { return Array.isArray(x) ? x : x ? [x] : []; }
function numOrUndefined(x: any): number | undefined { return x == null ? undefined : Number(x); }
function numOrDefault(x: any, d: number): number { return x == null ? d : Number(x); }