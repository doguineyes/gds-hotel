export type SoapClientConfig = {
    endpoint: string;
    username: string;
    password: string;
    soapAction?: string;           // e.g. `"http://localhost:8080/kestrel/HotelService"` (keep the quotes to mirror PHP)
    timeoutMs?: number;
    defaultHeaders?: Record<string, string>;
};

const DEFAULT_TIMEOUT = 15000;

export class SoapClient {
    private cfg: SoapClientConfig;
    constructor(cfg: SoapClientConfig) { this.cfg = cfg; }

    private buildEnvelope(bodyXml: string, headerXml: string[] = []): string {
        // NOTE: Namespaces must match PHP logs exactly.
        return `<?xml version="1.0" encoding="UTF-8"?>` +
            `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ` +
            `xmlns:ns1="http://www.travelport.com/schema/common_v52_0" ` +
            `xmlns:ns2="http://www.travelport.com/schema/hotel_v52_0">` +
            `<SOAP-ENV:Header>${headerXml.join("")}</SOAP-ENV:Header>` +
            `<SOAP-ENV:Body>${bodyXml}</SOAP-ENV:Body>` +
            `</SOAP-ENV:Envelope>`;
    }

    async call(bodyXml: string, headerXml: string[] = []): Promise<{ status: number; headers: Record<string, string>; body: string }> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs ?? DEFAULT_TIMEOUT);

        const auth = Buffer.from(`${this.cfg.username}:${this.cfg.password}`).toString('base64');
        const headers: Record<string, string> = {
            "Content-Type": "text/xml; charset=utf-8",
            "Authorization": `Basic ${auth}`,
            ...(this.cfg.defaultHeaders ?? {}),
        };
        if (this.cfg.soapAction) {
            // PHP included quotes around SOAPAction. Keep them to match the wire format:
            headers["SOAPAction"] = this.cfg.soapAction;
        }

        const envelope = this.buildEnvelope(bodyXml, headerXml);
        const res = await fetch(this.cfg.endpoint, {
            method: "POST",
            headers,
            body: envelope,
            signal: controller.signal,
        });
        clearTimeout(timer);

        const text = await res.text();
        // Normalize headers into a simple object
        const hdrs: Record<string, string> = {};
        res.headers.forEach((v, k) => { hdrs[k] = v; });

        if (!res.ok) {
            throw new Error(`SOAP HTTP ${res.status}\n${text}`);
        }
        return { status: res.status, headers: hdrs, body: text };
    }
}