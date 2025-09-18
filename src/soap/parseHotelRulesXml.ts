// parseHotelRulesXml.ts

import { XMLParser } from "fast-xml-parser";

// Shape mirrors fields present PHP version :contentReference[oaicite:4]{index=4}
export type HotelRulesParsed = {
    HotelRulesRsp: {
        TraceId?: string;
        TransactionId?: string;
        ResponseTime?: number;
        HotelRateDetail?: {
            RatePlanType?: string;
            Base?: string;
            Tax?: string;
            Total?: string;
            Surcharge?: string;
            RoomRateDescription?: Array<{ Name?: string; Text?: string[] }>;
            HotelRateByDate?: Array<{
                EffectiveDate: string;
                ExpireDate: string;
                Base: string;
            }>;
            Commission?: { Indicator?: string; Percent?: string };
            CancelInfo?: {
                NonRefundableStayIndicator?: string;
                CancelDeadline?: string;
                NumberOfNights?: string;
            };
            GuaranteeInfo?: { CredentialsRequired?: string; GuaranteeType?: string };
            Inclusions?: {
                SmokingRoomIndicator?: string;
                BedTypes?: { Code?: string; Quantity?: string };
                MealPlans?: {
                    Breakfast?: string; Lunch?: string; Dinner?: string;
                    MealPlan?: { Code?: string } | Array<{ Code?: string }>;
                };
            };
        };
        HotelRuleItem?: Array<{ Name?: string; Text?: string[] }>;
        HotelType?: { SourceLink?: string };
    };
};

// convert a <hotel:RoomRateDescription Name="..."><hotel:Text>...</hotel:Text></...>
// (Text can be array or string)
function normalizeTextBlock(block: any): { Name?: string; Text?: string[] } {
    if (!block) return {};
    const Name = attr(block, "@_Name");
    const t = block?.["hotel:Text"] ?? block?.Text;
    const Text = Array.isArray(t) ? t.map(String) : t ? [String(t)] : [];
    return { Name, Text };
}

function attr(obj: any, key: string) {
    return obj?.[key] ?? obj?.[key.replace("@_", "")];
}

export function parseHotelRulesXml(xml: string): HotelRulesParsed {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        allowBooleanAttributes: true,
        trimValues: true,
    });
    const j = parser.parse(xml);

    // Walk to SOAP Body → hotel:HotelRulesRsp
    const env = j?.["SOAP:Envelope"] ?? j?.["soap:Envelope"] ?? j?.Envelope ?? j;
    const body = env?.["SOAP:Body"] ?? env?.["soap:Body"] ?? env?.Body ?? env;
    const rsp = body?.["hotel:HotelRulesRsp"] ?? body?.HotelRulesRsp;
    if (!rsp) {
        return { HotelRulesRsp: {} };
    }

    // Core attrs
    const TraceId = attr(rsp, "@_TraceId");
    const TransactionId = attr(rsp, "@_TransactionId");
    const ResponseTime = Number(attr(rsp, "@_ResponseTime") ?? 0) || undefined;

    // Rate detail
    const rd = rsp?.["hotel:HotelRateDetail"] ?? rsp?.HotelRateDetail;
    let HotelRateDetail: HotelRulesParsed["HotelRulesRsp"]["HotelRateDetail"];
    if (rd) {
        const RoomRateDescription = []
            .concat(rd?.["hotel:RoomRateDescription"] ?? rd?.RoomRateDescription ?? [])
            .map(normalizeTextBlock);

        const HotelRateByDate = []
            .concat(rd?.["hotel:HotelRateByDate"] ?? rd?.HotelRateByDate ?? [])
            .map((d: any) => ({
                EffectiveDate: attr(d, "@_EffectiveDate"),
                ExpireDate: attr(d, "@_ExpireDate"),
                Base: attr(d, "@_Base"),
            }));

        const Commission = rd?.["hotel:Commission"] ?? rd?.Commission
            ? {
                Indicator: attr(rd?.["hotel:Commission"] ?? rd?.Commission, "@_Indicator"),
                Percent: attr(rd?.["hotel:Commission"] ?? rd?.Commission, "@_Percent"),
            }
            : undefined;

        const CancelInfo = rd?.["hotel:CancelInfo"] ?? rd?.CancelInfo
            ? {
                NonRefundableStayIndicator: attr(rd?.["hotel:CancelInfo"] ?? rd?.CancelInfo, "@_NonRefundableStayIndicator"),
                CancelDeadline: attr(rd?.["hotel:CancelInfo"] ?? rd?.CancelInfo, "@_CancelDeadline"),
                NumberOfNights: attr(rd?.["hotel:CancelInfo"] ?? rd?.CancelInfo, "@_NumberOfNights"),
            }
            : undefined;

        const GuaranteeInfo = rd?.["hotel:GuaranteeInfo"] ?? rd?.GuaranteeInfo
            ? {
                CredentialsRequired: attr(rd?.["hotel:GuaranteeInfo"] ?? rd?.GuaranteeInfo, "@_CredentialsRequired"),
                GuaranteeType: attr(rd?.["hotel:GuaranteeInfo"] ?? rd?.GuaranteeInfo, "@_GuaranteeType"),
            }
            : undefined;

        const incl = rd?.["hotel:Inclusions"] ?? rd?.Inclusions;
        const Inclusions = incl
            ? {
                SmokingRoomIndicator: attr(incl, "@_SmokingRoomIndicator"),
                BedTypes: incl?.["hotel:BedTypes"] ?? incl?.BedTypes
                    ? {
                        Code: attr(incl?.["hotel:BedTypes"] ?? incl?.BedTypes, "@_Code"),
                        Quantity: attr(incl?.["hotel:BedTypes"] ?? incl?.BedTypes, "@_Quantity"),
                    }
                    : undefined,
                MealPlans: incl?.["hotel:MealPlans"] ?? incl?.MealPlans
                    ? {
                        Breakfast: attr(incl?.["hotel:MealPlans"] ?? incl?.MealPlans, "@_Breakfast"),
                        Lunch: attr(incl?.["hotel:MealPlans"] ?? incl?.MealPlans, "@_Lunch"),
                        Dinner: attr(incl?.["hotel:MealPlans"] ?? incl?.MealPlans, "@_Dinner"),
                        MealPlan: incl?.["hotel:MealPlans"]?.["hotel:MealPlan"] ??
                            incl?.["hotel:MealPlans"]?.MealPlan ??
                            incl?.MealPlans?.MealPlan,
                    }
                    : undefined,
            }
            : undefined;

        HotelRateDetail = {
            RatePlanType: attr(rd, "@_RatePlanType"),
            Base: attr(rd, "@_Base"),
            Tax: attr(rd, "@_Tax"),
            Total: attr(rd, "@_Total"),
            Surcharge: attr(rd, "@_Surcharge"),
            RoomRateDescription,
            HotelRateByDate,
            Commission,
            CancelInfo,
            GuaranteeInfo,
            Inclusions,
        };
    }

    // Items (Cancellation / Guarantee / Promotional / PropertyText / etc.)
    const items = []
        .concat(rsp?.["hotel:HotelRuleItem"] ?? rsp?.HotelRuleItem ?? [])
        .map(normalizeTextBlock);

    const HotelType =
        rsp?.["hotel:HotelType"] ?? rsp?.HotelType
            ? { SourceLink: attr(rsp?.["hotel:HotelType"] ?? rsp?.HotelType, "@_SourceLink") }
            : undefined;

    return {
        HotelRulesRsp: {
            TraceId,
            TransactionId,
            ResponseTime,
            HotelRateDetail,
            HotelRuleItem: items,
            HotelType,
        },
    };
}
