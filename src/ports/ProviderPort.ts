import type { Hotel } from "../domain/Hotel";
import type { RoomOffer } from "../domain/RoomOffer";
import type { Booking } from "../domain/Booking";


export type SearchQuery = {
    city?: string;
    hotelIds?: string[];
    checkin: string; // ISO date
    checkout: string; // ISO date
    guests: { adults: number; children?: number };
    page?: number; // 1-based
    size?: number; // page size
};


export type OfferQuery = {
    checkin: string;
    checkout: string;
    guests: { adults: number; children?: number };
    /** Optional provider-specific extras (kept generic to avoid NDA leaks) */
    extras?: {
        traceId?: string;
        corporateDiscountIds?: string[]; // e.g., ["V8M","V8A"]
        rooms?: number;
        childrenAges?: number[]; // in years
        nextRefId?: string; // pagination token
        languageCode?: string; // e.g., "ZH-HANS"
        targetBranch?: string; // vendor routing
        hotelChain?: string; // when provider needs chain+code instead of a single hotelId
        hotelCode?: string;
    };
};


export type CreateBookingInput = {
    offerId: string;
    guest: { firstName: string; lastName: string; email?: string; phone?: string };
    paymentToken?: string; // for future extension
};


export class ProviderError extends Error {
    code: string;
    raw?: unknown;
    constructor(code: string, message: string, raw?: unknown) {
        super(message);
        this.name = "ProviderError";
        this.code = code;
        this.raw = raw;
    }
}


export interface ProviderPort {
    searchHotels(q: SearchQuery): Promise<Hotel[]>;
    getRoomOffers(hotelId: string, q: OfferQuery): Promise<RoomOffer[]>;
    createBooking(input: CreateBookingInput, opts?: { idempotencyKey?: string }): Promise<Booking>;
    cancelBooking(id: string, reason?: string): Promise<Booking>;
    getBooking(id: string): Promise<Booking>;
}