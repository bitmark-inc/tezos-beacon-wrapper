import { NetworkType, P2PPairingRequest, PostMessagePairingRequest } from "@airgap/beacon-sdk";
export declare const preparePairingAlert: (id: string, shadowRoot: ShadowRoot, pairingPayload: {
    p2pSyncCode: () => Promise<P2PPairingRequest>;
    postmessageSyncCode: () => Promise<PostMessagePairingRequest>;
    preferredNetwork: NetworkType;
}) => Promise<void>;
//# sourceMappingURL=PairingAlertWrapped.d.ts.map