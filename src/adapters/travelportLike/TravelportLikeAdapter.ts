import { SoapAdapter } from "../soap/SoapAdapter";
import type { OfferQuery } from "../../ports/ProviderPort";


/**
 * Convenience adapter for providers that require HotelChain + HotelCode and other Travelport-like fields.
 * It reuses SoapAdapter's call pattern but ensures the OfferQuery.extras are populated correctly.
 */
export class TravelportLikeAdapter extends SoapAdapter {
    /** hotelId expected as `${hotelChain}:${hotelCode}` if extras not provided */
    override async getRoomOffers(hotelId: string, q: OfferQuery) {
        let extras = q.extras || {};
        if ((!extras.hotelChain || !extras.hotelCode) && hotelId.includes(":")) {
            const [hotelChain, hotelCode] = hotelId.split(":");
            extras = { ...extras, hotelChain, hotelCode };
        }
        return super.getRoomOffers(hotelId, { ...q, extras });
    }
}