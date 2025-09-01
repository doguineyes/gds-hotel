export type SearchQuery = {
    city?: string;
    hotelIds?: string[];
    checkin: string; // ISO date
    checkout: string; // ISO date
    guests: { adults: number; children?: number };
    page?: number; // 1-based
    size?: number; // page size
};