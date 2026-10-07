import { describe, expect, it } from "vitest";

import { type ApiTestimonial, mapApiTestimonialToUi } from "./testimonialsService";

const testimonial = (season: ApiTestimonial["season"]): ApiTestimonial => ({
  id: 1,
  translations: { en: { course: "Analysis", content: "Clear." } },
  created_at: "",
  updated_at: "",
  semester: "2023/24",
  season,
});

describe("mapApiTestimonialToUi", () => {
  // The backend sends the season as stored, in English (see apiClient.getList).
  it("names the season the way the site does, in either language", () => {
    expect(mapApiTestimonialToUi(testimonial("Winter"), "pl").semester).toBe("sem. zimowy 2023/24");
    expect(mapApiTestimonialToUi(testimonial("Summer"), "pl").semester).toBe("sem. letni 2023/24");
    expect(mapApiTestimonialToUi(testimonial("Winter"), "en").semester).toBe("Winter 2023/24");
  });
});
