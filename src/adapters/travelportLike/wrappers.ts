import type { ProviderPort, OfferQuery } from "../../ports/ProviderPort";

export function travelportLike(base: ProviderPort): ProviderPort {
    return {
        ...base,
        async getRoomOffers(hotelId: string, q: OfferQuery) {
            let extras = q.extras ?? {};
            if ((!extras.hotelChain || !extras.hotelCode) && hotelId.includes(":")) {
                const [hotelChain, hotelCode] = hotelId.split(":");
                extras = { ...extras, hotelChain, hotelCode };
            }
            return base.getRoomOffers(hotelId, { ...q, extras });
        },
    };
}