import type { Money } from "./Money";


export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";


export type Guest = {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
};


export type PriceComponent = { label: string; price: Money };


export type Booking = {
    id: string;
    offerId: string;
    guest: Guest;
    priceBreakdown: PriceComponent[];
    status: BookingStatus;
    createdAt: string; // ISO
};