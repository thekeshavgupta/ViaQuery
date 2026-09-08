export function getSafeExternalUrl(value: unknown): string {
    if (typeof value !== 'string' || value.trim() === '') return '';

    try {
        const url = new URL(value.trim());
        if ((url.protocol !== 'https:' && url.protocol !== 'http:') || !url.hostname) {
            return '';
        }
        return url.href;
    } catch {
        return '';
    }
}

export function escapeCsvCell(value: unknown): string {
    let text = String(value ?? '');
    if (/^[=+\-@]/.test(text)) {
        text = `'${text}`;
    }
    return `"${text.replace(/"/g, '""')}"`;
}