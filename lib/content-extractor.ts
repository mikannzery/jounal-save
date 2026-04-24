import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export const FETCH_USER_AGENT = "CLIP MEMO Content Fetcher/1.0";
const MIN_CONTENT_LENGTH = 200;
const MAX_CONTENT_LENGTH = 18000;
const BOILERPLATE_SELECTORS = ["aside", "dialog", "footer", "form", "nav", "noscript", "script", "style"];

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x27;/gi, "'");
}

function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, MAX_CONTENT_LENGTH);
}

function stripBoilerplate(document: Document) {
  for (const selector of BOILERPLATE_SELECTORS) {
    for (const node of Array.from(document.querySelectorAll(selector))) {
      node.remove();
    }
  }
}

function looksLikeBoilerplate(text: string) {
  const opening = text.slice(0, 120).toLowerCase();
  return opening.startsWith("footer") || opening.startsWith("フッター");
}

function getTextContent(element: Element | null) {
  return normalizeText(element?.textContent ?? "");
}

function extractMetaDescription(document: Document) {
  const content =
    document.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
    document.querySelector('meta[name="description"]')?.getAttribute("content") ??
    "";

  return normalizeText(decodeHtmlEntities(content));
}

function extractParagraphs(document: Document) {
  return normalizeText(
    Array.from(document.querySelectorAll("p"))
      .map((node) => node.textContent?.trim() ?? "")
      .filter(Boolean)
      .join("\n\n"),
  );
}

export function extractTitle(html: string) {
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i);

  if (ogTitleMatch?.[1]) {
    return decodeHtmlEntities(ogTitleMatch[1].trim());
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (titleMatch?.[1]) {
    return decodeHtmlEntities(titleMatch[1].replace(/\s+/g, " ").trim());
  }

  return null;
}

export async function fetchPageHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": FETCH_USER_AGENT,
    },
    next: {
      revalidate: 0,
    },
  });

  if (!response.ok) {
    throw new Error("FETCH_FAILED");
  }

  return response.text();
}

export function extractContent(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  const { document } = dom.window;
  const extractedTitle = extractTitle(html) ?? "";

  stripBoilerplate(document);

  const readable = new Readability(document).parse();
  const readableBody = normalizeText(readable?.textContent ?? "");

  if (readableBody.length >= MIN_CONTENT_LENGTH && !looksLikeBoilerplate(readableBody)) {
    return {
      body: readableBody,
      method: "readability" as const,
      title: readable?.title?.trim() || extractedTitle,
    };
  }

  const articleBody = getTextContent(document.querySelector("article"));

  if (articleBody.length >= MIN_CONTENT_LENGTH) {
    return {
      body: articleBody,
      method: "fallback" as const,
      title: extractedTitle,
    };
  }

  const mainBody = getTextContent(document.querySelector("main"));

  if (mainBody.length >= MIN_CONTENT_LENGTH) {
    return {
      body: mainBody,
      method: "fallback" as const,
      title: extractedTitle,
    };
  }

  const metaDescription = extractMetaDescription(document);

  if (metaDescription.length >= MIN_CONTENT_LENGTH) {
    return {
      body: metaDescription,
      method: "fallback" as const,
      title: extractedTitle,
    };
  }

  const paragraphs = extractParagraphs(document);

  if (paragraphs.length >= MIN_CONTENT_LENGTH) {
    return {
      body: paragraphs,
      method: "fallback" as const,
      title: extractedTitle,
    };
  }

  throw new Error("CONTENT_TOO_SHORT");
}
