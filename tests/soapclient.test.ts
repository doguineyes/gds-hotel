import { describe, it, expect } from 'vitest';
import { SoapClient } from '../src/adapters/soap/SoapClient';


// fake fetch to capture requests
function fakeFetch(expectedUrl: string, cb: (body: string, headers: any) => void) {
    return async (url: string, init: any) => {
        expect(url).toBe(expectedUrl);
        const body = String(init.body || '');
        cb(body, init.headers || {});
        return {
            ok: true,
            status: 200,
            async text() {
                return `<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><HotelDetailsResponse/></soap:Body></soap:Envelope>`;
            }
        } as any;
    };
}


describe('SoapClient', () => {
    it('builds an envelope and posts it with SOAPAction', async () => {
        let seenBody = '';
        let seenHeaders: any = {};


        const client = new SoapClient({
            endpoint: 'https://example.com/hotel',
            namespace: 'gds',
            username: 'u',
            password: 'p',
            resolveSoapAction: (op) => `urn:gds:${op}`,
            // fetchImpl: fakeFetch('https://example.com/hotel', (b,h) => { seenBody = b; seenHeaders = h; }),
        });


        const xml = await client.call('HotelDetails', '<gds:Ping>true</gds:Ping>');
        expect(xml).toContain('<HotelDetailsResponse');
        expect(seenHeaders.SOAPAction).toBe('urn:gds:HotelDetails');
        expect(seenBody).toContain('<soap:Envelope');
        expect(seenBody).toContain('<soap:Body');
        expect(seenBody).toContain('<gds:HotelDetails>');
        expect(seenBody).toContain('<gds:Auth>');
        expect(seenBody).toContain('<gds:Ping>true</gds:Ping>');
    });
});