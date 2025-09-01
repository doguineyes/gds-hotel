import type { ProviderPort, SearchQuery, OfferQuery, CreateBookingInput } from "../../ports/ProviderPort";
import type { Hotel } from "../../domain/Hotel";
import type { RoomOffer } from "../../domain/RoomOffer";
import type { Booking } from "../../domain/Booking";


// In-memory mock data to keep the skeleton runnable without network access
const HOTELS: Hotel[] = [
    { id: "h1", name: "Sample Hotel NYC", address: "123 5th Ave, New York", latitude: 40.74, longitude: -73.99, amenities: ["wifi", "gym"] },
    { id: "h2", name: "Sample Hotel Boston", address: "1 Cambridge St, Boston", latitude: 42.36, longitude: -71.05 }
];


const OFFERS: Record<string, RoomOffer[]> = {
    h1: [
        { id: "o1", hotelId: "h1", roomType: "Deluxe King", occupancy: { adults: 2 }, ratePlanId: "rp1", price: { currency: "USD", amount: 299 } },
    ],
    h2: [
        { id: "o2", hotelId: "h2", roomType: "Standard Queen", occupancy: { adults: 2 }, ratePlanId: "rp2", price: { currency: "USD", amount: 199 } },
    ],
};


const BOOKINGS = new Map<string, Booking>();


export class SampleGDSAdapter implements ProviderPort {
    async searchHotels(q: SearchQuery): Promise<Hotel[]> {
        const byCity = q.city?.toLowerCase();
        const ids = q.hotelIds ? new Set(q.hotelIds) : undefined;
        const filtered = HOTELS.filter(h => {
            const idOk = !ids || ids.has(h.id);
            const cityOk = !byCity || (h.address?.toLowerCase().includes(byCity) ?? false) || h.name.toLowerCase().includes(byCity);
            return idOk && cityOk;
        });
        const page = Math.max(1, q.page ?? 1);
        const size = Math.max(1, Math.min(100, q.size ?? 20));
        const start = (page - 1) * size;
        return filtered.slice(start, start + size);
    }


    async getRoomOffers(hotelId: string, _q: OfferQuery): Promise<RoomOffer[]> {
        return OFFERS[hotelId] ?? [];
    }


    async createBooking(input: CreateBookingInput, opts?: { idempotencyKey?: string }): Promise<Booking> {
        const existing = opts?.idempotencyKey ? [...BOOKINGS.values()].find(b => (b as any)._idem === opts.idempotencyKey) : undefined;
        if (existing) return existing;


        const id = `b_${Math.random().toString(36).slice(2, 10)}`;
        const booking: Booking = {
            id,
            offerId: input.offerId,
            guest: input.guest,
            priceBreakdown: [{ label: "room", price: { currency: "USD", amount: 100 } }],
            status: "CONFIRMED",
            createdAt: new Date().toISOString(),
        } as Booking & { _idem?: string };
        (booking as any)._idem = opts?.idempotencyKey;
        BOOKINGS.set(id, booking);
        return booking;
    }

    async cancelBooking(id: string): Promise<Booking> {
        const b = BOOKINGS.get(id);
        if (!b) throw new Error("NOT_FOUND: booking");
        const cancelled: Booking = { ...b, status: "CANCELLED" };
        BOOKINGS.set(id, cancelled);
        return cancelled;
    }


    async getBooking(id: string): Promise<Booking> {
        const b = BOOKINGS.get(id);
        if (!b) throw new Error("NOT_FOUND: booking");
        return b;
    }
}