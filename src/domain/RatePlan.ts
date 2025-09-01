export type RatePlan = {
    id: string;
    name: string;
    mealPlan?: "RO" | "BB" | "HB" | "FB" | "AI"; // RoomOnly, Bed&Breakfast, etc.
    refundable: boolean;
    conditions?: string[];
};