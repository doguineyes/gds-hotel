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