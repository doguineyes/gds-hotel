import type { Money } from "./Money";


export type RoomOffer = {
    id: string;
    hotelId: string;
    roomType: string;
    occupancy: { adults: number; children?: number };
    ratePlanId: string;
    price: Money;
    cancellationPolicy?: string;
    fees?: { name: string; price: Money }[];
};