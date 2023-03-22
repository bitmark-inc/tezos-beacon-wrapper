import { DAppClientOptions } from "@airgap/beacon-sdk";
import { DAppClientWrapped } from "./DappClientWrapped";
export declare class AuBeaconWrapper extends DAppClientWrapped {
    title: string;
    constructor(
    /**
    * @param title name of the project, it will be appeared on the title.
    */
    /** @type {string} */
    title: string, config: DAppClientOptions);
    showConnect(): Promise<number>;
    private frameLoadPromise;
    private auClickPromise;
    private otherClickPromise;
    private instantiateIframe;
}
//# sourceMappingURL=main.d.ts.map