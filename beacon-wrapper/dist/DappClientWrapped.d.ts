import { DAppClientOptions, NetworkType } from '@airgap/beacon-dapp';
import { DappP2PTransport } from '@airgap/beacon-dapp/dist/cjs/transports/DappP2PTransport';
import { BeaconEventHandlerFunction, BeaconEventType } from '@airgap/beacon-dapp/dist/cjs/events';
import { DappPostMessageTransport } from '@airgap/beacon-dapp/dist/cjs/transports/DappPostMessageTransport';
import { AccountInfo, AppMetadata, BeaconEvent, BeaconEventHandler, BeaconMessageType, Blockchain, BlockchainRequestV3, BlockchainResponseV3, BlockExplorer, BroadcastResponseOutput, Client, ColorMode, ExtendedP2PPairingResponse, ExtendedPeerInfo, ExtendedPostMessagePairingResponse, OperationResponseOutput, PermissionRequestV3, PermissionResponseOutput, PermissionResponseV3, RequestBroadcastInput, RequestOperationInput, RequestPermissionInput, RequestSignPayloadInput, SignPayloadResponseOutput, Transport, TransportType } from '@airgap/beacon-sdk';
import { BeaconEventHandlerWrapped } from './features-wrapped/events-wrapped';
/**
 * @publicapi
 *
 * This Class is extended from the original DappClient of beacon, with more flexible UI.
 * The DAppClient has to be used in decentralized applications. It handles all the logic related to connecting to beacon-compatible
 * wallets and sending requests.
 * This is a wrapper.
 *
 * @category DAppWrapped
 */
export declare class DAppClientWrapped extends Client {
    /**
     * The block explorer used by the SDK
     */
    readonly blockExplorer: BlockExplorer;
    preferredNetwork: NetworkType;
    protected isAutonomy: boolean;
    protected readonly events: BeaconEventHandler;
    protected readonly eventsWrapped: BeaconEventHandlerWrapped;
    protected postMessageTransport: DappPostMessageTransport | undefined;
    protected p2pTransport: DappP2PTransport | undefined;
    /**
     * A map of requests that are currently "open", meaning we have sent them to a wallet and are still awaiting a response.
     */
    private readonly openRequests;
    /**
     * The currently active account. For all requests that are associated to a specific request (operation request, signing request),
     * the active account is used to determine the network and destination wallet
     */
    private _activeAccount;
    /**
     * The currently active peer. This is used to address a peer in case the active account is not set. (Eg. for permission requests)
     */
    private _activePeer;
    private _initPromise;
    private readonly activeAccountLoaded;
    private readonly appMetadataManager;
    private readonly disclaimerText?;
    private readonly errorMessages;
    constructor(config: DAppClientOptions);
    /**
     * This function will delete other account before connect to Autonomy
     */
    protected prepareBeforeAutonomyRequestPermission(): Promise<void>;
    initInternalTransports(): Promise<void>;
    init(transport?: Transport<any>): Promise<TransportType>;
    /**
     * Returns the active account
     */
    getActiveAccount(): Promise<AccountInfo | undefined>;
    /**
     * Sets the active account
     *
     * @param account The account that will be set as the active account
     */
    setActiveAccount(account?: AccountInfo): Promise<void>;
    /**
     * Clear the active account
     */
    clearActiveAccount(): Promise<void>;
    setColorMode(colorMode: ColorMode): Promise<void>;
    getColorMode(): Promise<ColorMode>;
    /**
     * @deprecated
     *
     * Use getOwnAppMetadata instead
     */
    getAppMetadata(): Promise<AppMetadata>;
    showPrepare(): Promise<void>;
    hideUI(elements?: ('alert' | 'toast')[]): Promise<void>;
    /**
     * Will remove the account from the local storage and set a new active account if necessary.
     *
     * @param accountIdentifier ID of the account
     */
    removeAccount(accountIdentifier: string): Promise<void>;
    /**
     * Remove all accounts and set active account to undefined
     */
    removeAllAccounts(): Promise<void>;
    /**
     * Removes a peer and all the accounts that have been connected through that peer
     *
     * @param peer Peer to be removed
     */
    removePeer(peer: ExtendedPeerInfo, sendDisconnectToPeer?: boolean): Promise<void>;
    /**
     * Remove all peers and all accounts that have been connected through those peers
     */
    removeAllPeers(sendDisconnectToPeers?: boolean): Promise<void>;
    /**
     * Allows the user to subscribe to specific events that are fired in the SDK
     *
     * @param internalEvent The event to subscribe to
     * @param eventCallback The callback that will be called when the event occurs
     */
    subscribeToEvent<K extends BeaconEvent>(internalEvent: K, eventCallback: BeaconEventHandlerFunction<BeaconEventType[K]>): Promise<void>;
    /**
     * Check if we have permissions to send the specific message type to the active account.
     * If no active account is set, only permission requests are allowed.
     *
     * @param type The type of the message
     */
    checkPermissions(type: BeaconMessageType): Promise<boolean>;
    sendNotification(title: string, message: string, payload: string, protocolIdentifier: string): Promise<string>;
    private blockchains;
    addBlockchain(chain: Blockchain): void;
    removeBlockchain(chainIdentifier: string): void;
    /** Generic messages */
    permissionRequest(input: PermissionRequestV3<string>): Promise<PermissionResponseV3<string>>;
    request(input: BlockchainRequestV3<string>): Promise<BlockchainResponseV3<string>>;
    /**
     * Send a permission request to the DApp. This should be done as the first step. The wallet will respond
     * with an publicKey and permissions that were given. The account returned will be set as the "activeAccount"
     * and will be used for the following requests.
     *
     * @param input The message details we need to prepare the PermissionRequest message.
     */
    requestPermissions(input?: RequestPermissionInput, isAutonomy?: boolean): Promise<PermissionResponseOutput>;
    /**
     * This method will send a "SignPayloadRequest" to the wallet. This method is meant to be used to sign
     * arbitrary data (eg. a string). It will return the signature in the format of "edsig..."
     *
     * @param input The message details we need to prepare the SignPayloadRequest message.
     */
    requestSignPayload(input: RequestSignPayloadInput): Promise<SignPayloadResponseOutput>;
    /**
     * This method will send an "EncryptPayloadRequest" to the wallet. This method is meant to be used to encrypt or decrypt
     * arbitrary data (eg. a string). It will return the encrypted or decrypted payload
     *
     * @param input The message details we need to prepare the EncryptPayloadRequest message.
     */
    /**
     * This method sends an OperationRequest to the wallet. This method should be used for all kinds of operations,
     * eg. transaction or delegation. Not all properties have to be provided. Data like "counter" and fees will be
     * fetched and calculated by the wallet (but they can still be provided if required).
     *
     * @param input The message details we need to prepare the OperationRequest message.
     */
    requestOperation(input: RequestOperationInput): Promise<OperationResponseOutput>;
    /**
     * Sends a "BroadcastRequest" to the wallet. This method can be used to inject an already signed transaction
     * to the network.
     *
     * @param input The message details we need to prepare the BroadcastRequest message.
     */
    requestBroadcast(input: RequestBroadcastInput): Promise<BroadcastResponseOutput>;
    protected setActivePeer(peer?: ExtendedPostMessagePairingResponse | ExtendedP2PPairingResponse): Promise<void>;
    /**
     * A "setter" for when the transport needs to be changed.
     */
    protected setTransport(transport?: Transport<any>): Promise<void>;
    /**
     * This method will emit an internal error message.
     *
     * @param errorMessage The error message to send.
     */
    private sendInternalError;
    /**
     * This method will remove all accounts associated with a specific peer.
     *
     * @param peersToRemove An array of peers for which accounts should be removed
     */
    private removeAccountsForPeers;
    /**
     * This message handles errors that we receive from the wallet.
     *
     * @param request The request we sent
     * @param beaconError The error we received
     */
    private handleRequestError;
    /**
     * This message will send an event when we receive a successful response to one of the requests we sent.
     *
     * @param request The request we sent
     * @param response The response we received
     */
    private notifySuccess;
    private getWalletInfo;
    private getPeer;
    /**
     * This method handles sending of requests to the DApp. It makes sure that the DAppClient is initialized and connected
     * to the transport. After that rate limits and permissions will be checked, an ID is attached and the request is sent
     * to the DApp over the transport.
     *
     * @param requestInput The BeaconMessage to be sent to the wallet
     * @param account The account that the message will be sent to
     */
    private makeRequest;
    /**
     * This method handles sending of requests to the DApp. It makes sure that the DAppClient is initialized and connected
     * to the transport. After that rate limits and permissions will be checked, an ID is attached and the request is sent
     * to the DApp over the transport.
     *
     * @param requestInput The BeaconMessage to be sent to the wallet
     * @param account The account that the message will be sent to
     */
    private makeRequestV3;
    disconnect(): Promise<void>;
    /**
     * Adds a requests to the "openRequests" set so we know what messages have already been answered/handled.
     *
     * @param id The ID of the message
     * @param promise A promise that resolves once the response for that specific message is received
     */
    private addOpenRequest;
    private sendNotificationWithAccessToken;
}
//# sourceMappingURL=DappClientWrapped.d.ts.map