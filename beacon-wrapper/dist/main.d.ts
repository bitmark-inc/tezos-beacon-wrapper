import { DAppClientOptions, RequestPermissionInput } from "@airgap/beacon-sdk";
import { DAppClientWrapped } from "./features-wrapped/DappClientWrapped";
/**
 * @publicapi
 *
 * @class DappClient-wrapper and a custom UI for BeaconSDK.
 *
 * This Class is extended from the original DappClient of beacon, with more flexible UI.
 * The DAppClient has to be used in decentralized applications. It handles all the logic related to connecting to beacon-compatible
 * wallets and sending requests.
 *
 * @param {string} title name of the project, it will be appeared on the title of the custom pop-up.
 * @param {DAppClientOptions} config follow the original config of DappClient.
 *
 * @category DAppWrapped
 */
export declare class AuBeaconWrapper extends DAppClientWrapped {
    title: string;
    constructor(title: string, config: DAppClientOptions);
    /**
     *
     * Call a pop-up to connect. Return a number preferred to an option.
     * @param {RequestPermissionInput} input Input for instantiate DappClient
     * @returns {LoginType} Autonomy: 0, Other wallets: 1.
     */
    showConnect(input?: RequestPermissionInput): Promise<number>;
    private frameLoadPromise;
    private auClickPromise;
    private otherClickPromise;
    private instantiateIframe;
}
//# sourceMappingURL=main.d.ts.map