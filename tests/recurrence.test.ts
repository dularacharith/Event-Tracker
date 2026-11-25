import { describe, it, expect } from "vitest";
import { generateRecurrenceDates } from "@/lib/services/activities";

describe("generateRecurrenceDates engine", () => {
  const baseDate = new Date("2026-06-01T10:00:00.000Z"); // Monday

  it("generates daily recurrence dates correctly", () => {
    const dates = generateRecurrenceDates({
      startDate: baseDate,
      rule: "daily",
      count: 5,
    });
    expect(dates).toHaveLength(5);
    expect(dates[0].toISOString()).toBe("2026-06-01T10:00:00.000Z");
    expect(dates[1].toISOString()).toBe("2026-06-02T10:00:00.000Z");
    expect(dates[2].toISOString()).toBe("2026-06-03T10:00:00.000Z");
    expect(dates[3].toISOString()).toBe("2026-06-04T10:00:00.000Z");
    expect(dates[4].toISOString()).toBe("2026-06-05T10:00:00.000Z");
  });

  it("generates every 2 days recurrence dates correctly", () => {
    const dates = generateRecurrenceDates({
      startDate: baseDate,
      rule: "every_2_days",
      count: 4,
    });
    expect(dates).toHaveLength(4);
    expect(dates[0].toISOString()).toBe("2026-06-01T10:00:00.000Z");
    expect(dates[1].toISOString()).toBe("2026-06-03T10:00:00.000Z");
    expect(dates[2].toISOString()).toBe("2026-06-05T10:00:00.000Z");
    expect(dates[3].toISOString()).toBe("2026-06-07T10:00:00.000Z");
  });

  it("generates every 5 days recurrence dates correctly", () => {
    const dates = generateRecurrenceDates({
      startDate: baseDate,
      rule: "every_5_days",
      count: 3,
    });
    expect(dates).toHaveLength(3);
    expect(dates[0].toISOString()).toBe("2026-06-01T10:00:00.000Z");
    expect(dates[1].toISOString()).toBe("2026-06-06T10:00:00.000Z");
    expect(dates[2].toISOString()).toBe("2026-06-11T10:00:00.000Z");
  });

  it("generates weekly recurrence dates correctly", () => {
    const dates = generateRecurrenceDates({
      startDate: baseDate,
      rule: "weekly",
      count: 4,
    });
    expect(dates).toHaveLength(4);
    expect(dates[0].toISOString()).toBe("2026-06-01T10:00:00.000Z");
    expect(dates[1].toISOString()).toBe("2026-06-08T10:00:00.000Z");
    expect(dates[2].toISOString()).toBe("2026-06-15T10:00:00.000Z");
    expect(dates[3].toISOString()).toBe("2026-06-22T10:00:00.000Z");
  });

  it("generates only weekends recurrence dates correctly", () => {
    // 2026-06-01 is Monday. The next weekend dates are Saturday June 6 and Sunday June 7, etc.
    const dates = generateRecurrenceDates({
      startDate: baseDate,
      rule: "weekends",
      count: 4,
    });
    expect(dates).toHaveLength(4);
    dates.forEach((d) => {
      const day = d.getDay();
      expect(day === 0 || day === 6).toBe(true);
    });
    expect(dates[0].getDate()).toBe(6); // Sat June 6
    expect(dates[1].getDate()).toBe(7); // Sun June 7
    expect(dates[2].getDate()).toBe(13); // Sat June 13
    expect(dates[3].getDate()).toBe(14); // Sun June 14
  });

  it("generates specific day of week recurrence dates correctly", () => {
    // Target: Wednesday (June 3, June 10, June 17...)
    const dates = generateRecurrenceDates({
      startDate: baseDate,
      rule: "specific_day",
      specificDay: "wednesday",
      count: 3,
    });
    expect(dates).toHaveLength(3);
    dates.forEach((d) => {
      expect(d.getDay()).toBe(3); // 3 is Wednesday
    });
    expect(dates[0].getDate()).toBe(3);
    expect(dates[1].getDate()).toBe(10);
    expect(dates[2].getDate()).toBe(17);
  });
});
