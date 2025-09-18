// src/parseHotelDetailsXml.ts
import { XMLParser } from "fast-xml-parser";

/**
 * Capitalization policy:
 * - We KEEP Travelport / XML capitalization in the returned JSON (e.g., HotelProperty.HotelChain, HotelRateDetail.Base).
 * - We DO normalize single-or-many nodes to arrays where appropriate, but we DO NOT rename fields.
 */

type AnyObj = Record<string, any>;

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",   // keep attrs as normal keys (e.g., TraceId)
    allowBooleanAttributes: true,
    parseAttributeValue: true, // parse numbers/bools from attributes
    parseTagValue: false,      // don’t auto-coerce tag text; we’ll take strings as-is
});

/** Get the first present key among alternatives (useful for varying prefixes) */
function any<T = any>(obj: AnyObj | undefined, keys: string[]): T | undefined {
    if (!obj) return undefined as any;
    for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
    }
    return undefined;
}

/** Normalize to array (accept single node or array) */
function arrify<T>(v: T | T[] | undefined): T[] {
    if (v === undefined || v === null) return [];
    return Array.isArray(v) ? v : [v];
}

/** Extract array of <Text> strings under a node (keeping capitalization) */
function extractTextArray(node: AnyObj | undefined): string[] {
    if (!node) return [];
    const texts = arrify<any>(any(node, ["hotel:Text", "ns2:Text", "Text"]));
    return texts.map((t) => (typeof t === "string" ? t : t?.["#text"] ?? t)).filter(Boolean);
}

/** Build a capitalized object for HotelProperty (no key renaming) */
function buildHotelProperty(hotelProp: AnyObj | undefined): AnyObj | undefined {
    if (!hotelProp) return undefined;
    const addressNode = any(hotelProp, ["hotel:PropertyAddress", "ns2:PropertyAddress", "PropertyAddress"]);
    const addressLines = arrify<any>(any(addressNode, ["hotel:Address", "ns2:Address", "Address"]))
        .map((a) => (typeof a === "string" ? a : a?.["#text"] ?? a))
        .filter(Boolean);

    const phoneNodes = arrify<any>(any(hotelProp, [
        "common_v52_0:PhoneNumber", "common:PhoneNumber", "ns1:PhoneNumber", "PhoneNumber"
    ])).map((p) => ({ Type: p?.Type, Number: p?.Number }));

    const distance = any(hotelProp, [
        "common_v52_0:Distance", "common:Distance", "ns1:Distance", "Distance"
    ]);

    // Keep original attribute names as-is
    return {
        HotelChain: hotelProp.HotelChain,
        HotelCode: hotelProp.HotelCode,
        HotelLocation: hotelProp.HotelLocation,
        Name: hotelProp.Name,
        ParticipationLevel: hotelProp.ParticipationLevel,
        PropertyAddress: addressLines.length ? { Address: addressLines } : undefined,
        PhoneNumber: phoneNodes.length ? phoneNodes : undefined,
        Distance: distance
            ? { Units: distance.Units, Value: distance.Value, Direction: distance.Direction }
            : undefined,
        // If you want MarketingMessage, add a similar extraction here:
        MarketingMessage: ((): AnyObj[] | undefined => {
            const msgs = arrify<any>(any(hotelProp, ["hotel:MarketingMessage", "ns2:MarketingMessage", "MarketingMessage"]));
            if (!msgs.length) return undefined;
            return msgs.map((m) => ({ Text: extractTextArray(m) })).filter((m) => m.Text.length);
        })(),
    };
}

/** Build capitalized HotelDetailItem[] (e.g., CheckInTime/CheckOutTime) */
function buildHotelDetailItems(reqDetails: AnyObj | undefined): AnyObj[] | undefined {
    const items = arrify<any>(any(reqDetails, ["hotel:HotelDetailItem", "ns2:HotelDetailItem", "HotelDetailItem"]));
    if (!items.length) return undefined;
    return items.map((d) => ({
        Name: d?.Name,
        Text: extractTextArray(d),
    }));
}

/** Build capitalized HotelRateDetail[] (preserve field names; normalize arrays) */
function buildHotelRateDetails(reqDetails: AnyObj | undefined): AnyObj[] | undefined {
    const rateNodes = arrify<any>(any(reqDetails, ["hotel:HotelRateDetail", "ns2:HotelRateDetail", "HotelRateDetail"]));
    if (!rateNodes.length) return undefined;

    return rateNodes.map((r) => {
        // Descriptions: keep original element names (RoomRateDescription)
        const descNodes = arrify<any>(any(r, ["hotel:RoomRateDescription", "ns2:RoomRateDescription", "RoomRateDescription"]));
        const roomDescs = descNodes
            .filter((d) => d?.Name === "Room")
            .flatMap((d) => extractTextArray(d));
        const rateDescs = descNodes
            .filter((d) => d?.Name === "Rate" || d?.Name === "Description")
            .flatMap((d) => extractTextArray(d));

        // By-date rates (HotelRateByDate may be single or many)
        const byDates = arrify<any>(any(r, ["hotel:HotelRateByDate", "ns2:HotelRateByDate", "HotelRateByDate"]))
            .map((d) => ({
                EffectiveDate: d?.EffectiveDate,
                ExpireDate: d?.ExpireDate,
                Base: d?.Base,
            }));

        // CorporateDiscountID appears under common namespace
        const corpIds = arrify<any>(any(r, [
            "common_v52_0:CorporateDiscountID", "common:CorporateDiscountID", "ns1:CorporateDiscountID", "CorporateDiscountID"
        ])).map((n) => {
            const code = typeof n === "string" ? n : (n?.["#text"] ?? n);
            return {
                // keep XML attribute name:
                NegotiatedRateCode: (n?.NegotiatedRateCode === true || n?.NegotiatedRateCode === "true") ? true : undefined,
                // tag text content as value:
                Value: typeof code === "string" ? code : undefined,
            };
        });

        const commission = any(r, ["hotel:Commission", "ns2:Commission", "Commission"]);
        const cancelInfo  = any(r, ["hotel:CancelInfo",  "ns2:CancelInfo",  "CancelInfo"]);
        const guarantee   = any(r, ["hotel:GuaranteeInfo","ns2:GuaranteeInfo","GuaranteeInfo"]);
        const inclusions  = any(r, ["hotel:Inclusions",  "ns2:Inclusions",  "Inclusions"]);
        const bedTypes    = arrify<any>(any(inclusions, ["hotel:BedTypes", "ns2:BedTypes", "BedTypes"])).map((b) => b?.Code);
        const mealPlans   = any(inclusions, ["hotel:MealPlans", "ns2:MealPlans", "MealPlans"]) || {};

        // KEEP field names as XML (RatePlanType/Base/Total/…)
        const out: AnyObj = {
            RatePlanType: r?.RatePlanType,
            Base: r?.Base,
            Total: r?.Total,
            RateChangeIndicator: r?.RateChangeIndicator,
            ExtraFeesIncluded: r?.ExtraFeesIncluded,
            // Keep original containers with their original names:
            RoomRateDescription: [
                ...(roomDescs.length ? [{ Name: "Room", Text: roomDescs }] : []),
                ...(rateDescs.length ? [{ Name: "Rate", Text: rateDescs }] : []),
            ],
            HotelRateByDate: byDates.length ? byDates : undefined,
            CorporateDiscountID: corpIds.length ? corpIds : undefined,
            Commission: commission ? { Indicator: (commission?.Indicator === true || commission?.Indicator === "true") } : undefined,
            CancelInfo: cancelInfo
                ? {
                    NonRefundableStayIndicator:
                        cancelInfo?.NonRefundableStayIndicator === true || cancelInfo?.NonRefundableStayIndicator === "true",
                    CancelDeadline: cancelInfo?.CancelDeadline,
                    NumberOfNights: cancelInfo?.NumberOfNights,
                }
                : undefined,
            GuaranteeInfo: guarantee ? { GuaranteeType: guarantee?.GuaranteeType } : undefined,
            Inclusions: inclusions
                ? {
                    SmokingRoomIndicator:
                        inclusions?.SmokingRoomIndicator === true || inclusions?.SmokingRoomIndicator === "true",
                    BedTypes: bedTypes.length
                        ? bedTypes.length === 1 ? { Code: bedTypes[0] } : bedTypes.map((c) => ({ Code: c }))
                        : undefined,
                    MealPlans: {
                        Breakfast: mealPlans?.Breakfast === true || mealPlans?.Breakfast === "true",
                        Lunch:     mealPlans?.Lunch     === true || mealPlans?.Lunch     === "true",
                        Dinner:    mealPlans?.Dinner    === true || mealPlans?.Dinner    === "true",
                    },
                }
                : undefined,
        };

        // Remove undefined keys to keep output clean
        Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
        return out;
    });
}

/** Extract ResponseMessage warnings (keep tag name as ResponseMessage, Type remains capitalized) */
function buildResponseMessages(rsp: AnyObj | undefined): AnyObj[] | undefined {
    const msgs = arrify<any>(any(rsp, [
        "common_v52_0:ResponseMessage", "common:ResponseMessage", "ns1:ResponseMessage", "ResponseMessage"
    ]));
    if (!msgs.length) return undefined;
    return msgs.map((m) => ({
        Type: m?.Type,
        Text: ((): string => {
            const raw = (typeof m === "string" ? m : (m?.["#text"] ?? m?._text ?? m?.[":text"] ?? "")) as string;
            return typeof raw === "string" ? raw : JSON.stringify(raw);
        })(),
    }));
}

/**
 * Parse HotelDetails SOAP XML into a capitalized-keys JSON object.
 * Throws on SOAP Fault (with Faultstring if present).
 */
export function parseHotelDetailsXml(xml: string): AnyObj {
    const root = parser.parse(xml);

    // SOAP fault handling
    const env  = any<AnyObj>(root, ["SOAP:Envelope", "soapenv:Envelope", "SOAP-ENV:Envelope"]) || root;
    const body = any<AnyObj>(env,  ["SOAP:Body",    "soapenv:Body",    "SOAP-ENV:Body"]) || env;
    const fault = any<AnyObj>(body, ["SOAP:Fault", "soapenv:Fault", "SOAP-ENV:Fault"]);
    if (fault) {
        const faultString = fault.faultstring || fault["faultstring"] || JSON.stringify(fault);
        const err = new Error(`SOAP Fault: ${faultString}`);
        (err as any).fault = fault;
        throw err;
    }

    // HotelDetailsRsp (namespace prefix may vary)
    const rsp = any<AnyObj>(body, ["hotel:HotelDetailsRsp", "ns2:HotelDetailsRsp", "HotelDetailsRsp"]);
    if (!rsp) throw new Error("HotelDetailsRsp not found");

    const RequestedHotelDetails = any<AnyObj>(rsp, ["hotel:RequestedHotelDetails", "ns2:RequestedHotelDetails", "RequestedHotelDetails"]);
    const HotelProperty         = buildHotelProperty(any<AnyObj>(RequestedHotelDetails, ["hotel:HotelProperty", "ns2:HotelProperty", "HotelProperty"]));
    const HotelDetailItem       = buildHotelDetailItems(RequestedHotelDetails);
    const HotelRateDetail       = buildHotelRateDetails(RequestedHotelDetails);
    const ResponseMessage       = buildResponseMessages(rsp);

    // KEEP top-level attribute names as-is
    const out: AnyObj = {
        TraceId: rsp.TraceId,
        TransactionId: rsp.TransactionId,
        ResponseTime: rsp.ResponseTime,
        RequestedHotelDetails: {
            ...(HotelProperty ? { HotelProperty } : {}),
            ...(HotelDetailItem ? { HotelDetailItem } : {}),
            ...(HotelRateDetail ? { HotelRateDetail } : {}),
        },
        ...(ResponseMessage ? { ResponseMessage } : {}),
    };

    return out;
}
