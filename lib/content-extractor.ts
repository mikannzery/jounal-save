import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const FETCH_USER_AGENT = "CLIP MEMO Content Fetcher/1.0";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MIN_CONTENT_LENGTH = 200;
const MAX_CONTENT_LENGTH = 18000;
const MAX_REDIRECTS = 5;
const BOILERPLATE_SELECTORS = ["aside", "dialog", "footer", "form", "nav", "noscript", "script", "style"];
const contentFetchErrorCodes = new Set([
  "BLOCKED_URL",
  "CONTENT_TOO_SHORT",
  "FETCH_FAILED",
  "INVALID_URL",
  "RESPONSE_TOO_LARGE",
  "TOO_MANY_REDIRECTS",
  "UNSUPPORTED_CONTENT_TYPE",
]);

export function getContentFetchErrorCode(error: unknown) {
  if (!(error instanceof Error)) {
    return "UNKNOWN_ERROR";
  }

  if (error.name === "AbortError") {
    return "FETCH_TIMEOUT";
  }

  return contentFetchErrorCodes.has(error.message) ? error.message : "UNKNOWN_ERROR";
}

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map((part) => Number.parseInt(part, 10));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true;
  }

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 192 && second === 0 && parts[2] === 0) ||
    (first === 192 && second === 0 && parts[2] === 2) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && parts[2] === 100) ||
    (first === 203 && second === 0 && parts[2] === 113) ||
    first >= 224
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/u)?.[1];

  if (mappedIpv4) {
    return isPrivateIpv4(mappedIpv4);
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isBlockedIp(address: string) {
  const family = isIP(address);

  if (family === 4) {
    return isPrivateIpv4(address);
  }

  if (family === 6) {
    return isPrivateIpv6(address);
  }

  return true;
}

export async function validateFetchUrl(value: string) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("INVALID_URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("INVALID_URL");
  }

  const addresses = await lookup(parsed.hostname, { all: true, verbatim: true });

  if (addresses.length === 0 || addresses.some((address) => isBlockedIp(address.address))) {
    throw new Error("BLOCKED_URL");
  }

  return parsed.toString();
}

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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let safeUrl = await validateFetchUrl(url);
    let response: Response | null = null;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      response = await fetch(safeUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": FETCH_USER_AGENT,
        },
        next: {
          revalidate: 0,
        },
        redirect: "manual",
        signal: controller.signal,
      });

      if (response.status < 300 || response.status >= 400) {
        break;
      }

      const location = response.headers.get("location");

      if (!location) {
        throw new Error("FETCH_FAILED");
      }

      safeUrl = await validateFetchUrl(new URL(location, safeUrl).toString());
      response = null;
    }

    if (!response) {
      throw new Error("TOO_MANY_REDIRECTS");
    }

    if (!response.ok) {
      throw new Error("FETCH_FAILED");
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("UNSUPPORTED_CONTENT_TYPE");
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");

    if (contentLength > MAX_HTML_BYTES) {
      throw new Error("RESPONSE_TOO_LARGE");
    }

    if (!response.body) {
      return response.text();
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      receivedBytes += value.byteLength;

      if (receivedBytes > MAX_HTML_BYTES) {
        throw new Error("RESPONSE_TOO_LARGE");
      }

      chunks.push(value);
    }

    const bytes = new Uint8Array(receivedBytes);
    let offset = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new TextDecoder().decode(bytes);
  } finally {
    clearTimeout(timeoutId);
  }
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
