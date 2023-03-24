"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAppClientWrapped = void 0;
const bs58check = __importStar(require("bs58check"));
const axios_1 = __importDefault(require("axios"));
const beacon_dapp_1 = require("@airgap/beacon-dapp");
const beacon_core_1 = require("@airgap/beacon-core");
const beacon_message_events_1 = require("@airgap/beacon-dapp/dist/cjs/beacon-message-events");
const DappP2PTransport_1 = require("@airgap/beacon-dapp/dist/cjs/transports/DappP2PTransport");
const DappPostMessageTransport_1 = require("@airgap/beacon-dapp/dist/cjs/transports/DappPostMessageTransport");
const beacon_sdk_1 = require("@airgap/beacon-sdk");
const events_wrapped_1 = require("./events-wrapped");
const logger = new beacon_sdk_1.Logger('DAppClient');
/**
 * @internalapi
 *
 * This Class is extended from the original DappClient of beacon, with more flexible UI.
 * The DAppClient has to be used in decentralized applications. It handles all the logic related to connecting to beacon-compatible
 * wallets and sending requests.
 * This is a wrapper.
 *
 * @category DAppWrapped
 */
class DAppClientWrapped extends beacon_sdk_1.Client {
    constructor(config) {
        var _a, _b, _c, _d, _e, _f;
        super(Object.assign({ storage: config && config.storage ? config.storage : new beacon_sdk_1.LocalStorage() }, config));
        this.isAutonomy = false;
        this.events = new beacon_sdk_1.BeaconEventHandler();
        this.eventsWrapped = new events_wrapped_1.BeaconEventHandlerWrapped();
        /**
         * A map of requests that are currently "open", meaning we have sent them to a wallet and are still awaiting a response.
         */
        this.openRequests = new Map();
        /**
         * The currently active account. For all requests that are associated to a specific request (operation request, signing request),
         * the active account is used to determine the network and destination wallet
         */
        this._activeAccount = new beacon_sdk_1.ExposedPromise();
        /**
         * The currently active peer. This is used to address a peer in case the active account is not set. (Eg. for permission requests)
         */
        this._activePeer = new beacon_sdk_1.ExposedPromise();
        this.blockchains = new Map();
        this.events = new beacon_sdk_1.BeaconEventHandler(config.eventHandlers, (_a = config.disableDefaultEvents) !== null && _a !== void 0 ? _a : false);
        this.eventsWrapped = new events_wrapped_1.BeaconEventHandlerWrapped(config.eventHandlers, (_b = config.disableDefaultEvents) !== null && _b !== void 0 ? _b : false);
        this.blockExplorer = (_c = config.blockExplorer) !== null && _c !== void 0 ? _c : new beacon_sdk_1.TzktBlockExplorer();
        this.preferredNetwork = (_d = config.preferredNetwork) !== null && _d !== void 0 ? _d : beacon_dapp_1.NetworkType.MAINNET;
        (0, beacon_sdk_1.setColorMode)((_e = config.colorMode) !== null && _e !== void 0 ? _e : beacon_sdk_1.ColorMode.LIGHT);
        this.disclaimerText = config.disclaimerText;
        this.errorMessages = (_f = config.errorMessages) !== null && _f !== void 0 ? _f : {};
        this.appMetadataManager = new beacon_sdk_1.AppMetadataManager(this.storage);
        this.activeAccountLoaded = this.storage
            .get(beacon_dapp_1.StorageKey.ACTIVE_ACCOUNT)
            .then((activeAccountIdentifier) => __awaiter(this, void 0, void 0, function* () {
            if (activeAccountIdentifier) {
                yield this.setActiveAccount(yield this.accountManager.getAccount(activeAccountIdentifier));
            }
            else {
                yield this.setActiveAccount(undefined);
            }
        }))
            .catch((storageError) => __awaiter(this, void 0, void 0, function* () {
            yield this.setActiveAccount(undefined);
            console.error(storageError);
        }));
        this.handleResponse = (message, connectionInfo) => __awaiter(this, void 0, void 0, function* () {
            var _g, _h;
            const openRequest = this.openRequests.get(message.id);
            logger.log('handleResponse', 'Received message', message, connectionInfo);
            if (message.version === '3') {
                const typedMessage = message;
                if (openRequest && typedMessage.message.type === beacon_sdk_1.BeaconMessageType.Acknowledge) {
                    logger.log(`acknowledge message received for ${message.id}`);
                    console.timeLog(message.id, 'acknowledge');
                    this.events
                        .emit(beacon_sdk_1.BeaconEvent.ACKNOWLEDGE_RECEIVED, {
                        message: typedMessage.message,
                        extraInfo: {},
                        walletInfo: yield this.getWalletInfo()
                    })
                        .catch(console.error);
                }
                else if (openRequest) {
                    const appMetadata = typedMessage.message /* Why is this unkown cast needed? */.blockchainData.appMetadata;
                    if (typedMessage.message.type === beacon_sdk_1.BeaconMessageType.PermissionResponse && appMetadata) {
                        yield this.appMetadataManager.addAppMetadata(appMetadata);
                    }
                    console.timeLog(typedMessage.id, 'response');
                    console.timeEnd(typedMessage.id);
                    if (typedMessage.message.type === beacon_sdk_1.BeaconMessageType.Error) {
                        openRequest.reject(typedMessage.message);
                    }
                    else {
                        openRequest.resolve({ message, connectionInfo });
                    }
                    this.openRequests.delete(typedMessage.id);
                }
                else {
                    if (typedMessage.message.type === beacon_sdk_1.BeaconMessageType.Disconnect) {
                        const relevantTransport = connectionInfo.origin === beacon_sdk_1.Origin.P2P
                            ? this.p2pTransport
                            : (_g = this.postMessageTransport) !== null && _g !== void 0 ? _g : (yield this.transport);
                        if (relevantTransport) {
                            // TODO: Handle removing it from the right transport (if it was received from the non-active transport)
                            const peers = yield relevantTransport.getPeers();
                            const peer = peers.find((peerEl) => peerEl.senderId === message.senderId);
                            if (peer) {
                                yield relevantTransport.removePeer(peer);
                                yield this.removeAccountsForPeers([peer]);
                                yield this.events.emit(beacon_sdk_1.BeaconEvent.CHANNEL_CLOSED);
                            }
                            else {
                                logger.error('handleDisconnect', 'cannot find peer for sender ID', message.senderId);
                            }
                        }
                    }
                    else {
                        logger.error('handleResponse', 'no request found for id ', message.id, message);
                    }
                }
            }
            else {
                const typedMessage = message;
                if (openRequest && typedMessage.type === beacon_sdk_1.BeaconMessageType.Acknowledge) {
                    logger.log(`acknowledge message received for ${message.id}`);
                    console.timeLog(message.id, 'acknowledge');
                    this.events
                        .emit(beacon_sdk_1.BeaconEvent.ACKNOWLEDGE_RECEIVED, {
                        message: typedMessage,
                        extraInfo: {},
                        walletInfo: yield this.getWalletInfo()
                    })
                        .catch(console.error);
                }
                else if (openRequest) {
                    if (typedMessage.type === beacon_sdk_1.BeaconMessageType.PermissionResponse &&
                        typedMessage.appMetadata) {
                        yield this.appMetadataManager.addAppMetadata(typedMessage.appMetadata);
                    }
                    console.timeLog(typedMessage.id, 'response');
                    console.timeEnd(typedMessage.id);
                    if (typedMessage.type === beacon_sdk_1.BeaconMessageType.Error || message.errorType) {
                        // TODO: Remove "any" once we remove support for v1 wallets
                        openRequest.reject(typedMessage);
                    }
                    else {
                        openRequest.resolve({ message, connectionInfo });
                    }
                    this.openRequests.delete(typedMessage.id);
                }
                else {
                    if (typedMessage.type === beacon_sdk_1.BeaconMessageType.Disconnect ||
                        message.typedMessage.type === beacon_sdk_1.BeaconMessageType.Disconnect // TODO: TYPE
                    ) {
                        const relevantTransport = connectionInfo.origin === beacon_sdk_1.Origin.P2P
                            ? this.p2pTransport
                            : (_h = this.postMessageTransport) !== null && _h !== void 0 ? _h : (yield this.transport);
                        if (relevantTransport) {
                            // TODO: Handle removing it from the right transport (if it was received from the non-active transport)
                            const peers = yield relevantTransport.getPeers();
                            const peer = peers.find((peerEl) => peerEl.senderId === message.senderId);
                            if (peer) {
                                yield relevantTransport.removePeer(peer);
                                yield this.removeAccountsForPeers([peer]);
                                yield this.events.emit(beacon_sdk_1.BeaconEvent.CHANNEL_CLOSED);
                            }
                            else {
                                logger.error('handleDisconnect', 'cannot find peer for sender ID', message.senderId);
                            }
                        }
                    }
                    else {
                        logger.error('handleResponse', 'no request found for id ', message.id, message);
                    }
                }
            }
        });
    }
    /**
     * This function will delete other account before connect to Autonomy
     */
    prepareBeforeAutonomyRequestPermission() {
        return __awaiter(this, void 0, void 0, function* () {
            const autonomyName = "Autonomy";
            const activeAccount = yield this.getActiveAccount();
            if (activeAccount) {
                const peerOfActiveAccount = yield this.getPeer(activeAccount);
                if (!peerOfActiveAccount.name.includes(autonomyName)) {
                    yield this.clearActiveAccount();
                }
            }
        });
    }
    initInternalTransports() {
        return __awaiter(this, void 0, void 0, function* () {
            const keyPair = yield this.keyPair;
            if (this.postMessageTransport || this.p2pTransport) {
                return;
            }
            this.postMessageTransport = new DappPostMessageTransport_1.DappPostMessageTransport(this.name, keyPair, this.storage);
            yield this.addListener(this.postMessageTransport);
            this.p2pTransport = new DappP2PTransport_1.DappP2PTransport(this.name, keyPair, this.storage, this.matrixNodes, this.iconUrl, this.appUrl);
            yield this.addListener(this.p2pTransport);
        });
    }
    init(transport) {
        const _super = Object.create(null, {
            init: { get: () => super.init }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (this._initPromise) {
                return this._initPromise;
            }
            try {
                yield this.activeAccountLoaded;
            }
            catch (_a) {
                //
            }
            this._initPromise = new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                if (transport) {
                    yield this.addListener(transport);
                    resolve(yield _super.init.call(this, transport));
                }
                else if (this._transport.isSettled()) {
                    yield (yield this.transport).connect();
                    resolve(yield _super.init.call(this, yield this.transport));
                }
                else {
                    const activeAccount = yield this.getActiveAccount();
                    const stopListening = () => {
                        if (this.postMessageTransport) {
                            this.postMessageTransport.stopListeningForNewPeers().catch(console.error);
                        }
                        if (this.p2pTransport) {
                            this.p2pTransport.stopListeningForNewPeers().catch(console.error);
                        }
                    };
                    yield this.initInternalTransports();
                    if (!this.postMessageTransport || !this.p2pTransport) {
                        return;
                    }
                    this.postMessageTransport.connect().then().catch(console.error);
                    if (activeAccount && activeAccount.origin) {
                        const origin = activeAccount.origin.type;
                        // Select the transport that matches the active account
                        if (origin === beacon_sdk_1.Origin.EXTENSION) {
                            resolve(yield _super.init.call(this, this.postMessageTransport));
                        }
                        else if (origin === beacon_sdk_1.Origin.P2P) {
                            resolve(yield _super.init.call(this, this.p2pTransport));
                        }
                    }
                    else {
                        const p2pTransport = this.p2pTransport;
                        const postMessageTransport = this.postMessageTransport;
                        postMessageTransport
                            .listenForNewPeer((peer) => {
                            logger.log('init', 'postmessage transport peer connected', peer);
                            this.events
                                .emit(beacon_sdk_1.BeaconEvent.PAIR_SUCCESS, peer)
                                .catch((emitError) => console.warn(emitError));
                            this.setActivePeer(peer).catch(console.error);
                            this.setTransport(this.postMessageTransport).catch(console.error);
                            stopListening();
                            resolve(beacon_sdk_1.TransportType.POST_MESSAGE);
                        })
                            .catch(console.error);
                        p2pTransport
                            .listenForNewPeer((peer) => {
                            logger.log('init', 'p2p transport peer connected', peer);
                            this.events
                                .emit(beacon_sdk_1.BeaconEvent.PAIR_SUCCESS, peer)
                                .catch((emitError) => console.warn(emitError));
                            this.setActivePeer(peer).catch(console.error);
                            this.setTransport(this.p2pTransport).catch(console.error);
                            stopListening();
                            resolve(beacon_sdk_1.TransportType.P2P);
                        })
                            .catch(console.error);
                        beacon_dapp_1.PostMessageTransport.getAvailableExtensions()
                            .then(() => __awaiter(this, void 0, void 0, function* () {
                            const tempEvents = this.isAutonomy ? this.eventsWrapped : this.events;
                            tempEvents
                                .emit(beacon_sdk_1.BeaconEvent.PAIR_INIT, {
                                p2pPeerInfo: () => {
                                    p2pTransport.connect().then().catch(console.error);
                                    return p2pTransport.getPairingRequestInfo();
                                },
                                postmessagePeerInfo: () => postMessageTransport.getPairingRequestInfo(),
                                preferredNetwork: this.preferredNetwork,
                                abortedHandler: () => {
                                    console.log('ABORTED');
                                    this._initPromise = undefined;
                                },
                                disclaimerText: this.disclaimerText
                            })
                                .catch((emitError) => console.warn(emitError));
                        }))
                            .catch((error) => {
                            this._initPromise = undefined;
                            console.error(error);
                        });
                    }
                }
            }));
            return this._initPromise;
        });
    }
    /**
     * Returns the active account
     */
    getActiveAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._activeAccount.promise;
        });
    }
    /**
     * Sets the active account
     *
     * @param account The account that will be set as the active account
     */
    setActiveAccount(account) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._activeAccount.isSettled()) {
                // If the promise has already been resolved we need to create a new one.
                this._activeAccount = beacon_sdk_1.ExposedPromise.resolve(account);
            }
            else {
                this._activeAccount.resolve(account);
            }
            if (account) {
                const origin = account.origin.type;
                yield this.initInternalTransports();
                // Select the transport that matches the active account
                if (origin === beacon_sdk_1.Origin.EXTENSION) {
                    yield this.setTransport(this.postMessageTransport);
                }
                else if (origin === beacon_sdk_1.Origin.P2P) {
                    yield this.setTransport(this.p2pTransport);
                }
                const peer = yield this.getPeer(account);
                yield this.setActivePeer(peer);
            }
            else {
                yield this.setActivePeer(undefined);
                yield this.setTransport(undefined);
            }
            yield this.storage.set(beacon_dapp_1.StorageKey.ACTIVE_ACCOUNT, account ? account.accountIdentifier : undefined);
            yield this.events.emit(beacon_sdk_1.BeaconEvent.ACTIVE_ACCOUNT_SET, account);
            return;
        });
    }
    /**
     * Clear the active account
     */
    clearActiveAccount() {
        return this.setActiveAccount();
    }
    setColorMode(colorMode) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, beacon_sdk_1.setColorMode)(colorMode);
        });
    }
    getColorMode() {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, beacon_sdk_1.getColorMode)();
        });
    }
    /**
     * @deprecated
     *
     * Use getOwnAppMetadata instead
     */
    getAppMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getOwnAppMetadata();
        });
    }
    showPrepare() {
        return __awaiter(this, void 0, void 0, function* () {
            const walletInfo = yield (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield this.getWalletInfo();
                }
                catch (_a) {
                    return undefined;
                }
            }))();
            yield this.events.emit(beacon_sdk_1.BeaconEvent.SHOW_PREPARE, { walletInfo });
        });
    }
    hideUI(elements) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.events.emit(beacon_sdk_1.BeaconEvent.HIDE_UI, elements);
        });
    }
    /**
     * Will remove the account from the local storage and set a new active account if necessary.
     *
     * @param accountIdentifier ID of the account
     */
    removeAccount(accountIdentifier) {
        const _super = Object.create(null, {
            removeAccount: { get: () => super.removeAccount }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const removeAccountResult = _super.removeAccount.call(this, accountIdentifier);
            const activeAccount = yield this.getActiveAccount();
            if (activeAccount && activeAccount.accountIdentifier === accountIdentifier) {
                yield this.setActiveAccount(undefined);
            }
            return removeAccountResult;
        });
    }
    /**
     * Remove all accounts and set active account to undefined
     */
    removeAllAccounts() {
        const _super = Object.create(null, {
            removeAllAccounts: { get: () => super.removeAllAccounts }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.removeAllAccounts.call(this);
            yield this.setActiveAccount(undefined);
        });
    }
    /**
     * Removes a peer and all the accounts that have been connected through that peer
     *
     * @param peer Peer to be removed
     */
    removePeer(peer, sendDisconnectToPeer = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = yield this.transport;
            const removePeerResult = transport.removePeer(peer);
            yield this.removeAccountsForPeers([peer]);
            if (sendDisconnectToPeer) {
                yield this.sendDisconnectToPeer(peer, transport);
            }
            return removePeerResult;
        });
    }
    /**
     * Remove all peers and all accounts that have been connected through those peers
     */
    removeAllPeers(sendDisconnectToPeers = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = yield this.transport;
            const peers = yield transport.getPeers();
            const removePeerResult = transport.removeAllPeers();
            yield this.removeAccountsForPeers(peers);
            if (sendDisconnectToPeers) {
                const disconnectPromises = peers.map((peer) => this.sendDisconnectToPeer(peer, transport));
                yield Promise.all(disconnectPromises);
            }
            return removePeerResult;
        });
    }
    /**
     * Allows the user to subscribe to specific events that are fired in the SDK
     *
     * @param internalEvent The event to subscribe to
     * @param eventCallback The callback that will be called when the event occurs
     */
    subscribeToEvent(internalEvent, eventCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.events.on(internalEvent, eventCallback);
        });
    }
    /**
     * Check if we have permissions to send the specific message type to the active account.
     * If no active account is set, only permission requests are allowed.
     *
     * @param type The type of the message
     */
    checkPermissions(type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type === beacon_sdk_1.BeaconMessageType.PermissionRequest) {
                return true;
            }
            const activeAccount = yield this.getActiveAccount();
            if (!activeAccount) {
                throw yield this.sendInternalError('No active account set!');
            }
            const permissions = activeAccount.scopes;
            switch (type) {
                case beacon_sdk_1.BeaconMessageType.OperationRequest:
                    return permissions.includes(beacon_sdk_1.PermissionScope.OPERATION_REQUEST);
                case beacon_sdk_1.BeaconMessageType.SignPayloadRequest:
                    return permissions.includes(beacon_sdk_1.PermissionScope.SIGN);
                // TODO: ENCRYPTION
                // case BeaconMessageType.EncryptPayloadRequest:
                //   return permissions.includes(PermissionScope.ENCRYPT)
                case beacon_sdk_1.BeaconMessageType.BroadcastRequest:
                    return true;
                default:
                    return false;
            }
        });
    }
    sendNotification(title, message, payload, protocolIdentifier) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const activeAccount = yield this.getActiveAccount();
            if (!activeAccount ||
                (activeAccount &&
                    !activeAccount.scopes.includes(beacon_sdk_1.PermissionScope.NOTIFICATION) &&
                    !activeAccount.notification)) {
                throw new Error('notification permissions not given');
            }
            if (!((_a = activeAccount.notification) === null || _a === void 0 ? void 0 : _a.token)) {
                throw new Error('No AccessToken');
            }
            const url = (_b = activeAccount.notification) === null || _b === void 0 ? void 0 : _b.apiUrl;
            if (!url) {
                throw new Error('No Push URL set');
            }
            return this.sendNotificationWithAccessToken({
                url,
                recipient: activeAccount.address,
                title,
                body: message,
                payload,
                protocolIdentifier,
                accessToken: (_c = activeAccount.notification) === null || _c === void 0 ? void 0 : _c.token
            });
        });
    }
    addBlockchain(chain) {
        this.blockchains.set(chain.identifier, chain);
        chain.getWalletLists().then((walletLists) => {
            (0, beacon_sdk_1.setDesktopList)(walletLists.desktopList);
            (0, beacon_sdk_1.setExtensionList)(walletLists.extensionList);
            (0, beacon_sdk_1.setWebList)(walletLists.webList);
            (0, beacon_sdk_1.setiOSList)(walletLists.iOSList);
        });
    }
    removeBlockchain(chainIdentifier) {
        this.blockchains.delete(chainIdentifier);
    }
    /** Generic messages */
    permissionRequest(input) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('PERMISSION REQUEST');
            const blockchain = this.blockchains.get(input.blockchainIdentifier);
            if (!blockchain) {
                throw new Error(`Blockchain "${input.blockchainIdentifier}" not supported by dAppClient`);
            }
            const request = Object.assign(Object.assign({}, input), { type: beacon_sdk_1.BeaconMessageType.PermissionRequest, blockchainData: Object.assign(Object.assign({}, input.blockchainData), { appMetadata: yield this.getOwnAppMetadata() }) });
            console.log('REQUESTION PERMIMISSION V3', 'xxx', request);
            const { message: response, connectionInfo } = yield this.makeRequestV3(request).catch((_requestError) => __awaiter(this, void 0, void 0, function* () {
                throw new Error('TODO');
                // throw await this.handleRequestError(request, requestError)
            }));
            console.log('RESPONSE V3', response, connectionInfo);
            const partialAccountInfos = yield blockchain.getAccountInfosFromPermissionResponse(response.message);
            // const accountInfo: AccountInfo = {
            const accountInfo = {
                accountIdentifier: partialAccountInfos[0].accountId,
                senderId: response.senderId,
                origin: {
                    type: connectionInfo.origin,
                    id: connectionInfo.id
                },
                address: partialAccountInfos[0].address,
                publicKey: partialAccountInfos[0].publicKey,
                scopes: response.message.blockchainData.scopes,
                connectedAt: new Date().getTime(),
                chainData: response.message.blockchainData
            };
            yield this.accountManager.addAccount(accountInfo);
            yield this.setActiveAccount(accountInfo);
            yield blockchain.handleResponse({
                request,
                account: accountInfo,
                output: response,
                blockExplorer: this.blockExplorer,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfo()
            });
            yield this.notifySuccess(request, {
                account: accountInfo,
                output: {
                    address: partialAccountInfos[0].address,
                    network: { type: beacon_dapp_1.NetworkType.MAINNET },
                    scopes: [beacon_sdk_1.PermissionScope.OPERATION_REQUEST]
                },
                blockExplorer: this.blockExplorer,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfo()
            });
            // return output
            return response.message;
        });
    }
    request(input) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('REQUEST', input);
            const blockchain = this.blockchains.get(input.blockchainIdentifier);
            if (!blockchain) {
                throw new Error(`Blockchain "${blockchain}" not supported by dAppClient`);
            }
            yield blockchain.validateRequest(input);
            const activeAccount = yield this.getActiveAccount();
            if (!activeAccount) {
                throw yield this.sendInternalError('No active account!');
            }
            const request = Object.assign(Object.assign({}, input), { type: beacon_sdk_1.BeaconMessageType.BlockchainRequest, accountId: activeAccount.accountIdentifier });
            const { message: response, connectionInfo } = yield this.makeRequestV3(request).catch((requestError) => __awaiter(this, void 0, void 0, function* () {
                console.error(requestError);
                throw new Error('TODO');
                // throw await this.handleRequestError(request, requestError)
            }));
            yield blockchain.handleResponse({
                request,
                account: activeAccount,
                output: response,
                blockExplorer: this.blockExplorer,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfo()
            });
            return response.message;
        });
    }
    /**
     * Send a permission request to the DApp. This should be done as the first step. The wallet will respond
     * with an publicKey and permissions that were given. The account returned will be set as the "activeAccount"
     * and will be used for the following requests.
     *
     * @param input The message details we need to prepare the PermissionRequest message.
     */
    requestPermissions(input, isAutonomy) {
        return __awaiter(this, void 0, void 0, function* () {
            this.isAutonomy = isAutonomy || false;
            const request = {
                appMetadata: yield this.getOwnAppMetadata(),
                type: beacon_sdk_1.BeaconMessageType.PermissionRequest,
                network: input && input.network ? input.network : { type: beacon_dapp_1.NetworkType.MAINNET },
                scopes: input && input.scopes
                    ? input.scopes
                    : [beacon_sdk_1.PermissionScope.OPERATION_REQUEST, beacon_sdk_1.PermissionScope.SIGN]
            };
            const { message, connectionInfo } = yield this.makeRequest(request).catch((requestError) => __awaiter(this, void 0, void 0, function* () {
                throw yield this.handleRequestError(request, requestError);
            }));
            // TODO: Migration code. Remove sometime after 1.0.0 release.
            const publicKey = message.publicKey || message.pubkey || message.pubKey;
            const address = yield (0, beacon_sdk_1.getAddressFromPublicKey)(publicKey);
            const accountInfo = {
                accountIdentifier: yield (0, beacon_sdk_1.getAccountIdentifier)(address, message.network),
                senderId: message.senderId,
                origin: {
                    type: connectionInfo.origin,
                    id: connectionInfo.id
                },
                address,
                publicKey,
                network: message.network,
                scopes: message.scopes,
                threshold: message.threshold,
                notification: message.notification,
                connectedAt: new Date().getTime()
            };
            yield this.accountManager.addAccount(accountInfo);
            yield this.setActiveAccount(accountInfo);
            const output = Object.assign(Object.assign({}, message), { address,
                accountInfo });
            yield this.notifySuccess(request, {
                account: accountInfo,
                output,
                blockExplorer: this.blockExplorer,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfo()
            });
            return output;
        });
    }
    /**
     * This method will send a "SignPayloadRequest" to the wallet. This method is meant to be used to sign
     * arbitrary data (eg. a string). It will return the signature in the format of "edsig..."
     *
     * @param input The message details we need to prepare the SignPayloadRequest message.
     */
    requestSignPayload(input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!input.payload) {
                throw yield this.sendInternalError('Payload must be provided');
            }
            const activeAccount = yield this.getActiveAccount();
            if (!activeAccount) {
                throw yield this.sendInternalError('No active account!');
            }
            const payload = input.payload;
            if (typeof payload !== 'string') {
                throw new Error('Payload must be a string');
            }
            const signingType = (() => {
                switch (input.signingType) {
                    case beacon_sdk_1.SigningType.OPERATION:
                        if (!payload.startsWith('03')) {
                            throw new Error('When using signing type "OPERATION", the payload must start with prefix "03"');
                        }
                        return beacon_sdk_1.SigningType.OPERATION;
                    case beacon_sdk_1.SigningType.MICHELINE:
                        if (!payload.startsWith('05')) {
                            throw new Error('When using signing type "MICHELINE", the payload must start with prefix "05"');
                        }
                        return beacon_sdk_1.SigningType.MICHELINE;
                    case beacon_sdk_1.SigningType.RAW:
                    default:
                        return beacon_sdk_1.SigningType.RAW;
                }
            })();
            const request = {
                type: beacon_sdk_1.BeaconMessageType.SignPayloadRequest,
                signingType,
                payload,
                sourceAddress: input.sourceAddress || activeAccount.address
            };
            const { message, connectionInfo } = yield this.makeRequest(request).catch((requestError) => __awaiter(this, void 0, void 0, function* () {
                throw yield this.handleRequestError(request, requestError);
            }));
            yield this.notifySuccess(request, {
                account: activeAccount,
                output: message,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfo()
            });
            return message;
        });
    }
    /**
     * This method will send an "EncryptPayloadRequest" to the wallet. This method is meant to be used to encrypt or decrypt
     * arbitrary data (eg. a string). It will return the encrypted or decrypted payload
     *
     * @param input The message details we need to prepare the EncryptPayloadRequest message.
     */
    // TODO: ENCRYPTION
    // public async requestEncryptPayload(
    //   input: RequestEncryptPayloadInput
    // ): Promise<EncryptPayloadResponseOutput> {
    //   if (!input.payload) {
    //     throw await this.sendInternalError('Payload must be provided')
    //   }
    //   const activeAccount: AccountInfo | undefined = await this.getActiveAccount()
    //   if (!activeAccount) {
    //     throw await this.sendInternalError('No active account!')
    //   }
    //   const payload = input.payload
    //   if (typeof payload !== 'string') {
    //     throw new Error('Payload must be a string')
    //   }
    //   if (typeof input.encryptionCryptoOperation === 'undefined') {
    //     throw new Error('encryptionCryptoOperation must be defined')
    //   }
    //   if (typeof input.encryptionType === 'undefined') {
    //     throw new Error('encryptionType must be defined')
    //   }
    //   const request: EncryptPayloadRequestInput = {
    //     type: BeaconMessageType.EncryptPayloadRequest,
    //     cryptoOperation: input.encryptionCryptoOperation,
    //     encryptionType: input.encryptionType,
    //     payload,
    //     sourceAddress: input.sourceAddress || activeAccount.address
    //   }
    //   const { message, connectionInfo } = await this.makeRequest<
    //     EncryptPayloadRequest,
    //     EncryptPayloadResponse
    //   >(request).catch(async (requestError: ErrorResponse) => {
    //     throw await this.handleRequestError(request, requestError)
    //   })
    //   await this.notifySuccess(request, {
    //     account: activeAccount,
    //     output: message,
    //     connectionContext: connectionInfo,
    //     walletInfo: await this.getWalletInfo()
    //   })
    //   return message
    // }
    /**
     * This method sends an OperationRequest to the wallet. This method should be used for all kinds of operations,
     * eg. transaction or delegation. Not all properties have to be provided. Data like "counter" and fees will be
     * fetched and calculated by the wallet (but they can still be provided if required).
     *
     * @param input The message details we need to prepare the OperationRequest message.
     */
    requestOperation(input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!input.operationDetails) {
                throw yield this.sendInternalError('Operation details must be provided');
            }
            const activeAccount = yield this.getActiveAccount();
            if (!activeAccount) {
                throw yield this.sendInternalError('No active account!');
            }
            const request = {
                type: beacon_sdk_1.BeaconMessageType.OperationRequest,
                network: activeAccount.network || { type: beacon_dapp_1.NetworkType.MAINNET },
                operationDetails: input.operationDetails,
                sourceAddress: activeAccount.address || ''
            };
            const { message, connectionInfo } = yield this.makeRequest(request).catch((requestError) => __awaiter(this, void 0, void 0, function* () {
                throw yield this.handleRequestError(request, requestError);
            }));
            yield this.notifySuccess(request, {
                account: activeAccount,
                output: message,
                blockExplorer: this.blockExplorer,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfo()
            });
            return message;
        });
    }
    /**
     * Sends a "BroadcastRequest" to the wallet. This method can be used to inject an already signed transaction
     * to the network.
     *
     * @param input The message details we need to prepare the BroadcastRequest message.
     */
    requestBroadcast(input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!input.signedTransaction) {
                throw yield this.sendInternalError('Signed transaction must be provided');
            }
            const network = input.network || { type: beacon_dapp_1.NetworkType.MAINNET };
            const request = {
                type: beacon_sdk_1.BeaconMessageType.BroadcastRequest,
                network,
                signedTransaction: input.signedTransaction
            };
            const { message, connectionInfo } = yield this.makeRequest(request).catch((requestError) => __awaiter(this, void 0, void 0, function* () {
                throw yield this.handleRequestError(request, requestError);
            }));
            yield this.notifySuccess(request, {
                network,
                output: message,
                blockExplorer: this.blockExplorer,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfo()
            });
            return message;
        });
    }
    setActivePeer(peer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._activePeer.isSettled()) {
                // If the promise has already been resolved we need to create a new one.
                this._activePeer = beacon_sdk_1.ExposedPromise.resolve(peer);
            }
            else {
                this._activePeer.resolve(peer);
            }
            if (peer) {
                yield this.initInternalTransports();
                if (peer.type === 'postmessage-pairing-response') {
                    yield this.setTransport(this.postMessageTransport);
                }
                else if (peer.type === 'p2p-pairing-response') {
                    yield this.setTransport(this.p2pTransport);
                }
            }
            return;
        });
    }
    /**
     * A "setter" for when the transport needs to be changed.
     */
    setTransport(transport) {
        const _super = Object.create(null, {
            setTransport: { get: () => super.setTransport }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (!transport) {
                this._initPromise = undefined;
            }
            const result = _super.setTransport.call(this, transport);
            yield this.events.emit(beacon_sdk_1.BeaconEvent.ACTIVE_TRANSPORT_SET, transport);
            return result;
        });
    }
    /**
     * This method will emit an internal error message.
     *
     * @param errorMessage The error message to send.
     */
    sendInternalError(errorMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.events.emit(beacon_sdk_1.BeaconEvent.INTERNAL_ERROR, { text: errorMessage });
            throw new Error(errorMessage);
        });
    }
    /**
     * This method will remove all accounts associated with a specific peer.
     *
     * @param peersToRemove An array of peers for which accounts should be removed
     */
    removeAccountsForPeers(peersToRemove) {
        return __awaiter(this, void 0, void 0, function* () {
            const accounts = yield this.accountManager.getAccounts();
            const peerIdsToRemove = peersToRemove.map((peer) => peer.senderId);
            // Remove all accounts with origin of the specified peer
            const accountsToRemove = accounts.filter((account) => peerIdsToRemove.includes(account.senderId));
            const accountIdentifiersToRemove = accountsToRemove.map((accountInfo) => accountInfo.accountIdentifier);
            yield this.accountManager.removeAccounts(accountIdentifiersToRemove);
            // Check if one of the accounts that was removed was the active account and if yes, set it to undefined
            const activeAccount = yield this.getActiveAccount();
            if (activeAccount) {
                if (accountIdentifiersToRemove.includes(activeAccount.accountIdentifier)) {
                    yield this.setActiveAccount(undefined);
                }
            }
        });
    }
    /**
     * This message handles errors that we receive from the wallet.
     *
     * @param request The request we sent
     * @param beaconError The error we received
     */
    handleRequestError(request, beaconError) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.error('handleRequestError', 'error response', beaconError);
            if (beaconError.errorType) {
                const buttons = [];
                if (beaconError.errorType === beacon_sdk_1.BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR) {
                    const actionCallback = () => __awaiter(this, void 0, void 0, function* () {
                        const operationRequest = request;
                        // if the account we requested is not available, we remove it locally
                        let accountInfo;
                        if (operationRequest.sourceAddress && operationRequest.network) {
                            const accountIdentifier = yield (0, beacon_sdk_1.getAccountIdentifier)(operationRequest.sourceAddress, operationRequest.network);
                            accountInfo = yield this.getAccount(accountIdentifier);
                            if (accountInfo) {
                                yield this.removeAccount(accountInfo.accountIdentifier);
                            }
                        }
                    });
                    buttons.push({ text: 'Remove account', actionCallback });
                }
                const peer = yield this.getPeer();
                const activeAccount = yield this.getActiveAccount();
                // If we sent a permission request, received an error and there is no active account, we need to reset the DAppClient.
                // This most likely means that the user rejected the first permission request after pairing a wallet, so we "forget" the paired wallet to allow the user to pair again.
                if (request.type === beacon_sdk_1.BeaconMessageType.PermissionRequest &&
                    (yield this.getActiveAccount()) === undefined) {
                    this._initPromise = undefined;
                    this.postMessageTransport = undefined;
                    this.p2pTransport = undefined;
                    yield this.setTransport();
                    yield this.setActivePeer();
                }
                this.events
                    .emit(beacon_message_events_1.messageEvents[request.type].error, {
                    errorResponse: beaconError,
                    walletInfo: yield this.getWalletInfo(peer, activeAccount),
                    errorMessages: this.errorMessages
                }, buttons)
                    .catch((emitError) => logger.error('handleRequestError', emitError));
                throw beacon_sdk_1.BeaconError.getError(beaconError.errorType, beaconError.errorData);
            }
            throw beaconError;
        });
    }
    /**
     * This message will send an event when we receive a successful response to one of the requests we sent.
     *
     * @param request The request we sent
     * @param response The response we received
     */
    notifySuccess(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            this.events
                .emit(beacon_message_events_1.messageEvents[request.type].success, response)
                .catch((emitError) => console.warn(emitError));
        });
    }
    getWalletInfo(peer, account) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const selectedAccount = account ? account : yield this.getActiveAccount();
            const selectedPeer = peer ? peer : yield this.getPeer(selectedAccount);
            let walletInfo;
            if (selectedAccount) {
                walletInfo = yield this.appMetadataManager.getAppMetadata(selectedAccount.senderId);
            }
            const typedPeer = selectedPeer;
            if (!walletInfo) {
                walletInfo = {
                    name: typedPeer.name,
                    icon: typedPeer.icon
                };
            }
            const lowerCaseCompare = (str1, str2) => {
                if (str1 && str2) {
                    return str1.toLowerCase() === str2.toLowerCase();
                }
                return false;
            };
            let selectedApp;
            let type;
            // TODO: Remove once all wallets send the icon?
            if ((0, beacon_sdk_1.getiOSList)().find((app) => lowerCaseCompare(app.name, walletInfo === null || walletInfo === void 0 ? void 0 : walletInfo.name))) {
                selectedApp = (0, beacon_sdk_1.getiOSList)().find((app) => lowerCaseCompare(app.name, walletInfo === null || walletInfo === void 0 ? void 0 : walletInfo.name));
                type = 'mobile';
            }
            else if ((0, beacon_sdk_1.getWebList)().find((app) => lowerCaseCompare(app.name, walletInfo === null || walletInfo === void 0 ? void 0 : walletInfo.name))) {
                selectedApp = (0, beacon_sdk_1.getWebList)().find((app) => lowerCaseCompare(app.name, walletInfo === null || walletInfo === void 0 ? void 0 : walletInfo.name));
                type = 'web';
            }
            else if ((0, beacon_sdk_1.getDesktopList)().find((app) => lowerCaseCompare(app.name, walletInfo === null || walletInfo === void 0 ? void 0 : walletInfo.name))) {
                selectedApp = (0, beacon_sdk_1.getDesktopList)().find((app) => lowerCaseCompare(app.name, walletInfo === null || walletInfo === void 0 ? void 0 : walletInfo.name));
                type = 'desktop';
            }
            else if ((0, beacon_sdk_1.getExtensionList)().find((app) => lowerCaseCompare(app.name, walletInfo === null || walletInfo === void 0 ? void 0 : walletInfo.name))) {
                selectedApp = (0, beacon_sdk_1.getExtensionList)().find((app) => lowerCaseCompare(app.name, walletInfo === null || walletInfo === void 0 ? void 0 : walletInfo.name));
                type = 'extension';
            }
            if (selectedApp) {
                let deeplink;
                if (selectedApp.hasOwnProperty('links')) {
                    deeplink = selectedApp.links[(_a = selectedAccount === null || selectedAccount === void 0 ? void 0 : selectedAccount.network.type) !== null && _a !== void 0 ? _a : this.preferredNetwork];
                }
                else if (selectedApp.hasOwnProperty('deepLink')) {
                    deeplink = selectedApp.deepLink;
                }
                return {
                    name: walletInfo.name,
                    icon: (_b = walletInfo.icon) !== null && _b !== void 0 ? _b : selectedApp.logo,
                    deeplink,
                    type
                };
            }
            return walletInfo;
        });
    }
    getPeer(account) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let peer;
            if (account) {
                logger.log('getPeer', 'We have an account', account);
                const postMessagePeers = (_b = (yield ((_a = this.postMessageTransport) === null || _a === void 0 ? void 0 : _a.getPeers()))) !== null && _b !== void 0 ? _b : [];
                const p2pPeers = (_d = (yield ((_c = this.p2pTransport) === null || _c === void 0 ? void 0 : _c.getPeers()))) !== null && _d !== void 0 ? _d : [];
                const peers = [...postMessagePeers, ...p2pPeers];
                logger.log('getPeer', 'Found peers', peers, account);
                peer = peers.find((peerEl) => peerEl.senderId === account.senderId);
                if (!peer) {
                    // We could not find an exact match for a sender, so we most likely received it over a relay
                    peer = peers.find((peerEl) => peerEl.extensionId === account.origin.id);
                }
            }
            else {
                peer = yield this._activePeer.promise;
                logger.log('getPeer', 'Active peer', peer);
            }
            if (!peer) {
                throw new Error('No matching peer found.');
            }
            return peer;
        });
    }
    /**
     * This method handles sending of requests to the DApp. It makes sure that the DAppClient is initialized and connected
     * to the transport. After that rate limits and permissions will be checked, an ID is attached and the request is sent
     * to the DApp over the transport.
     *
     * @param requestInput The BeaconMessage to be sent to the wallet
     * @param account The account that the message will be sent to
     */
    makeRequest(requestInput) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const messageId = yield (0, beacon_sdk_1.generateGUID)();
            console.time(messageId);
            logger.log('makeRequest', 'starting');
            yield this.init();
            console.timeLog(messageId, 'init done');
            logger.log('makeRequest', 'after init');
            if (yield this.addRequestAndCheckIfRateLimited()) {
                this.events
                    .emit(beacon_sdk_1.BeaconEvent.LOCAL_RATE_LIMIT_REACHED)
                    .catch((emitError) => console.warn(emitError));
                throw new Error('rate limit reached');
            }
            if (!(yield this.checkPermissions(requestInput.type))) {
                this.events.emit(beacon_sdk_1.BeaconEvent.NO_PERMISSIONS).catch((emitError) => console.warn(emitError));
                throw new Error('No permissions to send this request to wallet!');
            }
            if (!this.beaconId) {
                throw yield this.sendInternalError('BeaconID not defined');
            }
            const request = Object.assign({ id: messageId, version: '2', senderId: yield (0, beacon_sdk_1.getSenderId)(yield this.beaconId) }, requestInput);
            const exposed = new beacon_sdk_1.ExposedPromise();
            this.addOpenRequest(request.id, exposed);
            const payload = yield new beacon_core_1.Serializer().serialize(request);
            const account = yield this.getActiveAccount();
            const peer = yield this.getPeer(account);
            const walletInfo = yield this.getWalletInfo(peer, account);
            logger.log('makeRequest', 'sending message', request);
            console.timeLog(messageId, 'sending');
            try {
                yield (yield this.transport).send(payload, peer);
            }
            catch (sendError) {
                this.events.emit(beacon_sdk_1.BeaconEvent.INTERNAL_ERROR, {
                    text: 'Unable to send message. If this problem persists, please reset the connection and pair your wallet again.',
                    buttons: [
                        {
                            text: 'Reset Connection',
                            actionCallback: () => __awaiter(this, void 0, void 0, function* () {
                                yield (0, beacon_sdk_1.closeToast)();
                                this.disconnect();
                            })
                        }
                    ]
                });
                console.timeLog(messageId, 'send error');
                throw sendError;
            }
            console.timeLog(messageId, 'sent');
            this.events
                .emit(beacon_message_events_1.messageEvents[requestInput.type].sent, {
                walletInfo: Object.assign(Object.assign({}, walletInfo), { name: (_a = walletInfo.name) !== null && _a !== void 0 ? _a : 'Wallet' }),
                extraInfo: {
                    resetCallback: () => __awaiter(this, void 0, void 0, function* () {
                        this.disconnect();
                    })
                }
            })
                .catch((emitError) => console.warn(emitError));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return exposed.promise; // TODO: fix type
        });
    }
    /**
     * This method handles sending of requests to the DApp. It makes sure that the DAppClient is initialized and connected
     * to the transport. After that rate limits and permissions will be checked, an ID is attached and the request is sent
     * to the DApp over the transport.
     *
     * @param requestInput The BeaconMessage to be sent to the wallet
     * @param account The account that the message will be sent to
     */
    makeRequestV3(requestInput) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const messageId = yield (0, beacon_sdk_1.generateGUID)();
            console.time(messageId);
            logger.log('makeRequest', 'starting');
            yield this.init();
            console.timeLog(messageId, 'init done');
            logger.log('makeRequest', 'after init');
            if (yield this.addRequestAndCheckIfRateLimited()) {
                this.events
                    .emit(beacon_sdk_1.BeaconEvent.LOCAL_RATE_LIMIT_REACHED)
                    .catch((emitError) => console.warn(emitError));
                throw new Error('rate limit reached');
            }
            // if (!(await this.checkPermissions(requestInput.type as BeaconMessageType))) {
            //   this.events.emit(BeaconEvent.NO_PERMISSIONS).catch((emitError) => console.warn(emitError))
            //   throw new Error('No permissions to send this request to wallet!')
            // }
            if (!this.beaconId) {
                throw yield this.sendInternalError('BeaconID not defined');
            }
            const request = {
                id: messageId,
                version: '3',
                senderId: yield (0, beacon_sdk_1.getSenderId)(yield this.beaconId),
                message: requestInput
            };
            const exposed = new beacon_sdk_1.ExposedPromise();
            this.addOpenRequest(request.id, exposed);
            const payload = yield new beacon_core_1.Serializer().serialize(request);
            const account = yield this.getActiveAccount();
            const peer = yield this.getPeer(account);
            const walletInfo = yield this.getWalletInfo(peer, account);
            logger.log('makeRequest', 'sending message', request);
            console.timeLog(messageId, 'sending');
            try {
                yield (yield this.transport).send(payload, peer);
            }
            catch (sendError) {
                this.events.emit(beacon_sdk_1.BeaconEvent.INTERNAL_ERROR, {
                    text: 'Unable to send message. If this problem persists, please reset the connection and pair your wallet again.',
                    buttons: [
                        {
                            text: 'Reset Connection',
                            actionCallback: () => __awaiter(this, void 0, void 0, function* () {
                                yield (0, beacon_sdk_1.closeToast)();
                                this.disconnect();
                            })
                        }
                    ]
                });
                console.timeLog(messageId, 'send error');
                throw sendError;
            }
            console.timeLog(messageId, 'sent');
            const index = requestInput.type;
            this.events
                .emit(beacon_message_events_1.messageEvents[index].sent, {
                walletInfo: Object.assign(Object.assign({}, walletInfo), { name: (_a = walletInfo.name) !== null && _a !== void 0 ? _a : 'Wallet' }),
                extraInfo: {
                    resetCallback: () => __awaiter(this, void 0, void 0, function* () {
                        this.disconnect();
                    })
                }
            })
                .catch((emitError) => console.warn(emitError));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return exposed.promise; // TODO: fix type
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.postMessageTransport = undefined;
            this.p2pTransport = undefined;
            yield Promise.all([this.clearActiveAccount(), (yield this.transport).disconnect()]);
        });
    }
    /**
     * Adds a requests to the "openRequests" set so we know what messages have already been answered/handled.
     *
     * @param id The ID of the message
     * @param promise A promise that resolves once the response for that specific message is received
     */
    addOpenRequest(id, promise) {
        logger.log('addOpenRequest', this.name, `adding request ${id} and waiting for answer`);
        this.openRequests.set(id, promise);
    }
    sendNotificationWithAccessToken(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            const { url, recipient, title, body, payload, protocolIdentifier, accessToken } = notification;
            const timestamp = new Date().toISOString();
            const keypair = yield this.keyPair;
            const rawPublicKey = keypair.publicKey;
            const prefix = Buffer.from(new Uint8Array([13, 15, 37, 217]));
            const publicKey = bs58check.encode(Buffer.concat([prefix, Buffer.from(rawPublicKey)]));
            const constructedString = [
                'Tezos Signed Message: ',
                recipient,
                title,
                body,
                timestamp,
                payload
            ].join(' ');
            const bytes = (0, beacon_sdk_1.toHex)(constructedString);
            const payloadBytes = '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes;
            const signature = yield (0, beacon_sdk_1.signMessage)(payloadBytes, {
                secretKey: Buffer.from(keypair.secretKey)
            });
            const notificationResponse = yield axios_1.default.post(`${url}/send`, {
                recipient,
                title,
                body,
                timestamp,
                payload,
                accessToken,
                protocolIdentifier,
                sender: {
                    name: this.name,
                    publicKey,
                    signature
                }
            });
            return notificationResponse.data;
        });
    }
}
exports.DAppClientWrapped = DAppClientWrapped;
//# sourceMappingURL=DappClientWrapped.js.map