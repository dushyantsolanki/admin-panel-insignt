import { TOCItem } from "@/components/custom/table-of-contents-preview";

/**
 * Extracts headings from an HTML string and returns an array of TOCItem objects.
 * This is used for generating the Table of Contents preview in the admin panel.
 */
export function extractHeadingsFromHTML(html: string): TOCItem[] {
  // Return empty array if html is empty or not a string
  if (!html || typeof html !== "string") return [];

  // In a real browser environment, we can use DOMParser
  // Since this utility might be called in various contexts, we'll check for it
  if (typeof window === "undefined") return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headingElements = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const items: TOCItem[] = [];

    headingElements.forEach((el, index) => {
      const text = el.textContent?.trim() || "";
      if (text) {
        const level = parseInt(el.tagName.replace("H", ""));
        // Use existing ID if present, otherwise generate a slug
        const id = el.id || text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "") // Remove non-word characters (except spaces and hyphens)
          .replace(/\s+/g, "-")      // Replace spaces with hyphens
          .replace(/-+/g, "-");     // Remove duplicate hyphens

        items.push({ id, title: text, level });
      }
    });

    return items;
  } catch (error) {
    console.error("Error parsing HTML for TOC:", error);
    return [];
  }
}
