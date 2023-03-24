import { BeaconEventType } from '@airgap/beacon-dapp/dist/cjs/events';
import { AlertButton, BeaconEvent, BeaconEventHandler } from '@airgap/beacon-sdk';
export declare class BeaconEventHandlerWrapped extends BeaconEventHandler {
    private readonly callbackMapWrapped;
    emit<K extends BeaconEvent>(event: K, data?: BeaconEventType[K], eventCallback?: AlertButton[]): Promise<void>;
}
//# sourceMappingURL=events-wrapped.d.ts.map