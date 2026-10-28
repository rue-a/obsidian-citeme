import type { CitationResult, Paper } from "../api";

export function suggestCitationNoteBaseName(paper: Paper): string {
    return sanitizeNoteBaseName(buildCitationTitle(paper));
}

export function sanitizeNoteBaseName(value: string): string {
    const cleaned = value
        .trim()
        .replace(/[\\/:*?"<>|#^\[\]]/g, " ")
        .replace(/\s+/g, " ")
        .replace(/[.\s]+$/g, "");

    return cleaned || "Untitled paper";
}

export function buildCitationNoteMarkdown(
    result: CitationResult,
    noteTag: string
): string {
    const { paper } = result;
    const lines: string[] = ["---"];
    const normalizedTag = noteTag.trim() || "CiteMe";

    lines.push(`title: ${yamlString(paper.title)}`);
    lines.push("tags:");
    lines.push(`  - ${yamlString(normalizedTag)}`);
    lines.push("authors:");
    const authorMetadata = paper.authorMetadata ?? [];
    if (paper.authors.length === 0) {
        lines.push("  - Unknown");
    } else {
        for (let index = 0; index < paper.authors.length; index++) {
            const name = paper.authors[index];
            const orcidId = normalizeOrcidId(authorMetadata[index]?.orcid ?? null);
            const displayName = orcidId ? `${name} (${orcidId})` : name;
            lines.push(`  - ${yamlString(displayName)}`);
        }
    }
    if (paper.year !== null) {
        lines.push(`year: ${paper.year}`);
    }
    if (paper.venue) {
        lines.push(`venue: ${yamlString(paper.venue)}`);
    }
    if (paper.doi) {
        lines.push(`doi: ${yamlString(doiLink(paper.doi))}`);
    }
    lines.push(`citeme_paper_id: ${yamlString(paper.id)}`);
    lines.push("---");

    if (paper.abstract) {
        lines.push("");
        for (const line of paper.abstract.split("\n")) {
            lines.push(`> *${line}*`);
        }
    }

    return lines.join("\n") + "\n";
}

function yamlString(value: string): string {
    return JSON.stringify(value);
}

function doiLink(doi: string): string {
    const value = doi.trim();
    if (!value) {
        return "";
    }
    if (/^https?:\/\//i.test(value)) {
        return value;
    }
    return `https://doi.org/${value}`;
}

function normalizeOrcidId(orcid: string | null): string {
    const value = orcid?.trim() ?? "";
    if (!value) {
        return "";
    }
    const match = value.match(/(?:https?:\/\/)?(?:www\.)?orcid\.org\/([^/?#]+)/i);
    if (match) {
        return match[1];
    }
    return value;
}

function buildCitationTitle(paper: Paper): string {
    const authorLastName = firstAuthorLastName(paper.authors);
    const year = paper.year !== null ? ` (${paper.year})` : "";
    return `${authorLastName}, ${paper.title}${year}`;
}

function firstAuthorLastName(authors: string[]): string {
    if (authors.length === 0) {
        return "Unknown";
    }
    const first = authors[0].trim();
    if (!first) {
        return "Unknown";
    }
    const parts = first.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return "Unknown";
    }
    return parts[parts.length - 1].replace(/^[,.;:()\[\]{}]+|[,.;:()\[\]{}]+$/g, "") || "Unknown";
}
