export type SoapClientConfig = {
    endpoint: string;
    namespace: string; // e.g., "ns" used in <ns:Envelope>
    username?: string;
    password?: string;
    defaultHeaders?: Record<string, string>;
    timeoutMs?: number;
    resolveSoapAction?: (operation: string) => string | undefined;
};

const DEFAULT_TIMEOUT = 15000;


export class SoapClient {
    private cfg: SoapClientConfig;
    constructor(cfg: SoapClientConfig) { this.cfg = cfg; }


    private buildEnvelope(operation: string, bodyXml: string): string {
        const ns = this.cfg.namespace;
        const auth = this.authHeaderXml();
        return `<?xml version="1.0" encoding="utf-8"?>
`
            + `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:${ns}="urn:${ns}">`
            + `<soap:Header>${auth ?? ""}</soap:Header>`
            + `<soap:Body><${ns}:${operation}>${bodyXml}</${ns}:${operation}></soap:Body>`
            + `</soap:Envelope>`;
    }


    private authHeaderXml(): string | null {
        if (!this.cfg.username || !this.cfg.password) return null;
        const ns = this.cfg.namespace;
        return `<${ns}:Auth><${ns}:Username>${escapeXml(this.cfg.username)}</${ns}:Username><${ns}:Password>${escapeXml(this.cfg.password)}</${ns}:Password></${ns}:Auth>`;
    }


    async call(operation: string, bodyXml: string): Promise<string> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs ?? DEFAULT_TIMEOUT);
        const soapAction = this.cfg.resolveSoapAction?.(operation);
        const res = await fetch(this.cfg.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                ...(soapAction ? { SOAPAction: soapAction } : {}),
                ...(this.cfg.defaultHeaders ?? {})
            },
            body: this.buildEnvelope(operation, bodyXml),
            signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
            const text = await safeText(res);
            throw new Error(`SOAP HTTP ${res.status}: ${text.slice(0, 200)}...`);
        }
        return res.text();
    }
}


function escapeXml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}


async function safeText(res: Response): Promise<string> { try { return await res.text(); } catch { return ""; } }