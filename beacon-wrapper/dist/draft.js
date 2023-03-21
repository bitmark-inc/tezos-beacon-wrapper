"use strict";
// import { DAppClientOptions, DAppClient, P2PTransport, PostMessageTransport, NetworkType, StorageKey } from '@airgap/beacon-dapp';
// import { Serializer } from '@airgap/beacon-core';
// import QRcode from "qrcode";
// import { messageEvents } from '@airgap/beacon-dapp/dist/cjs/beacon-message-events';
// import { AccountInfo, AlertButton, App, AppMetadataManager, BeaconBaseMessage, BeaconError, BeaconErrorType, BeaconEvent, BeaconMessage, BeaconMessageType, BeaconMessageWrapper, BeaconRequestInputMessage, BlockExplorer, BroadcastResponseOutput, closeToast, ConnectionContext, DesktopApp, ErrorResponse, ExposedPromise, ExtendedP2PPairingResponse, ExtendedPostMessagePairingResponse, ExtensionApp, generateGUID, getAccountIdentifier, getAddressFromPublicKey, getDesktopList, getExtensionList, getiOSList, getSenderId, getWebList, IgnoredRequestInputProperties, Network, OperationRequestInput, OperationResponseOutput, Optional, Origin, PeerInfo, PermissionRequest, PermissionRequestInput, PermissionResponse, PermissionResponseOutput, PermissionScope, PostMessagePairingResponse, RequestPermissionInput, SignPayloadResponseOutput, Transport, TransportType, WalletInfo, WebApp } from '@airgap/beacon-sdk';
// export class AuBeaconWrapper extends DAppClient {
//   name: string;
//   private readonly activeAccountLoadedWrapped: Promise<void>
//   private _initPromiseWrapped: Promise<TransportType> | undefined
//   protected readonly openRequestsWrapped = new Map<
//     string,
//     ExposedPromise<
//       {
//         message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>
//         connectionInfo: ConnectionContext
//       },
//       ErrorResponse
//     >
//   >()
//   private _activePeerWrapped: ExposedPromise<
//     ExtendedPostMessagePairingResponse | ExtendedP2PPairingResponse | undefined
//   > = new ExposedPromise()
//   private readonly appMetadataManagerWrapped: AppMetadataManager
//   constructor(
//     /**
//     * @param name name of the project, it will be appeared on the title.
//     */
//     /** @type {string} */
//     name: string,
//     options: DAppClientOptions,
//   ) {
//     super(options);
//     this.activeAccountLoadedWrapped = this.storage.get(StorageKey.ACTIVE_ACCOUNT)
//     .then(async (activeAccountIdentifier) => {
//       if (activeAccountIdentifier) {
//         await this.setActiveAccount(await this.accountManager.getAccount(activeAccountIdentifier))
//       } else {
//         await this.setActiveAccount(undefined)
//       }
//     })
//     .catch(async (storageError) => {
//       await this.setActiveAccount(undefined)
//       console.error(storageError)
//     })
//     this.appMetadataManagerWrapped = new AppMetadataManager(this.storage)
//     this.name = name;
//   }
//   public showConnect(): Promise<number> {
//     try {
//       const container = document.createElement('div');
//       container.id = 'beacon-button-container';
//       document.body.appendChild(container);
//       const wrapperIframe = this.instantiateIframe();
//       container.appendChild(wrapperIframe);
//       return this.frameLoadPromise(wrapperIframe, container);
//     } catch (e) {
//       throw e;
//     }
//   }
//   private async sendInternalErrorWrapped(errorMessage: string): Promise<void> {
//     await this.eventsWrapped.emit(BeaconEvent.INTERNAL_ERROR, { text: errorMessage })
//     throw new Error(errorMessage)
//   }
//   private addOpenRequestWrapped(
//     id: string,
//     promise: ExposedPromise<
//       {
//         message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>
//         connectionInfo: ConnectionContext
//       },
//       ErrorResponse
//     >
//   ): void {
//     console.log('addOpenRequest', this.name, `adding request ${id} and waiting for answer`)
//     this.openRequestsWrapped.set(id, promise)
//   }
//   private async getPeerWrapped(account?: AccountInfo): Promise<PeerInfo> {
//     let peer: PeerInfo | undefined
//     if (account) {
//       console.log('getPeer', 'We have an account', account)
//       const postMessagePeers: ExtendedPostMessagePairingResponse[] =
//         (await this.postMessageTransportWrapped?.getPeers()) ?? []
//       const p2pPeers: ExtendedP2PPairingResponse[] = (await this.p2pTransportWrapped?.getPeers()) ?? []
//       const peers = [...postMessagePeers, ...p2pPeers]
//       console.log('getPeer', 'Found peers', peers, account)
//       peer = peers.find((peerEl) => peerEl.senderId === account.senderId)
//       if (!peer) {
//         // We could not find an exact match for a sender, so we most likely received it over a relay
//         peer = peers.find((peerEl) => (peerEl as any).extensionId === account.origin.id)
//       }
//     } else {
//       peer = await this._activePeerWrapped.promise
//       console.log('getPeer', 'Active peer', peer)
//     }
//     if (!peer) {
//       throw new Error('No matching peer found.')
//     }
//     return peer
//   }
//   private async getWalletInfoWrapped(peer?: PeerInfo, account?: AccountInfo): Promise<WalletInfo> {
//     const selectedAccount = account ? account : await this.getActiveAccount()
//     const selectedPeer = peer ? peer : await this.getPeerWrapped(selectedAccount)
//     let walletInfo: WalletInfo | undefined
//     if (selectedAccount) {
//       walletInfo = await this.appMetadataManagerWrapped.getAppMetadata(selectedAccount.senderId)
//     }
//     const typedPeer: PostMessagePairingResponse = selectedPeer as any
//     if (!walletInfo) {
//       walletInfo = {
//         name: typedPeer.name,
//         icon: typedPeer.icon
//       }
//     }
//     const lowerCaseCompare = (str1?: string, str2?: string): boolean => {
//       if (str1 && str2) {
//         return str1.toLowerCase() === str2.toLowerCase()
//       }
//       return false
//     }
//     let selectedApp: WebApp | App | DesktopApp | ExtensionApp | undefined
//     let type: 'extension' | 'mobile' | 'web' | 'desktop' | undefined
//     // TODO: Remove once all wallets send the icon?
//     if (getiOSList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))) {
//       selectedApp = getiOSList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))
//       type = 'mobile'
//     } else if (getWebList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))) {
//       selectedApp = getWebList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))
//       type = 'web'
//     } else if (getDesktopList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))) {
//       selectedApp = getDesktopList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))
//       type = 'desktop'
//     } else if (getExtensionList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))) {
//       selectedApp = getExtensionList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))
//       type = 'extension'
//     }
//     if (selectedApp) {
//       let deeplink: string | undefined
//       if (selectedApp.hasOwnProperty('links')) {
//         deeplink = (selectedApp as WebApp).links[
//           selectedAccount?.network.type ?? this.preferredNetworkWrapped
//         ]
//       } else if (selectedApp.hasOwnProperty('deepLink')) {
//         deeplink = (selectedApp as App).deepLink
//       }
//       return {
//         name: walletInfo.name,
//         icon: walletInfo.icon ?? selectedApp.logo,
//         deeplink,
//         type
//       }
//     }
//     return walletInfo
//   }
//   private async handleRequestErrorWrapped(
//     request: BeaconRequestInputMessage,
//     beaconError: ErrorResponse
//   ): Promise<void> {
//     console.error('handleRequestError', 'error response', beaconError)
//     if (beaconError.errorType) {
//       const buttons: AlertButton[] = []
//       if (beaconError.errorType === BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR) {
//         const actionCallback = async (): Promise<void> => {
//           const operationRequest: OperationRequestInput = request as OperationRequestInput
//           // if the account we requested is not available, we remove it locally
//           let accountInfo: AccountInfo | undefined
//           if (operationRequest.sourceAddress && operationRequest.network) {
//             const accountIdentifier = await getAccountIdentifier(
//               operationRequest.sourceAddress,
//               operationRequest.network
//             )
//             accountInfo = await this.getAccount(accountIdentifier)
//             if (accountInfo) {
//               await this.removeAccount(accountInfo.accountIdentifier)
//             }
//           }
//         }
//         buttons.push({ text: 'Remove account', actionCallback })
//       }
//       const peer = await this.getPeerWrapped()
//       const activeAccount = await this.getActiveAccount()
//       // If we sent a permission request, received an error and there is no active account, we need to reset the DAppClient.
//       // This most likely means that the user rejected the first permission request after pairing a wallet, so we "forget" the paired wallet to allow the user to pair again.
//       if (
//         request.type === BeaconMessageType.PermissionRequest &&
//         (await this.getActiveAccount()) === undefined
//       ) {
//         this.postMessageTransportWrapped = undefined
//         this.p2pTransportWrapped = undefined
//         await this.setTransport()
//         await this.setActivePeer()
//       }
//       this.eventsWrapped
//         .emit(
//           messageEvents[request.type].error,
//           {
//             errorResponse: beaconError,
//             walletInfo: await this.getWalletInfoWrapped(peer, activeAccount),
//           },
//           buttons
//         )
//         .catch((emitError) => console.error('handleRequestError', emitError))
//       throw BeaconError.getError(beaconError.errorType, beaconError.errorData)
//     }
//     throw beaconError
//   }
//   override async initWrapped(transport?: Transport<any>): Promise<TransportType> {
//     if (this._initPromiseWrapped) {
//       return this._initPromiseWrapped
//     }
//     try {
//       await this.activeAccountLoadedWrapped
//     } catch {
//       //
//     }
//     console.log("init poin1");
//     this._initPromiseWrapped = new Promise(async (resolve) => {
//       if (transport) {
//         console.log("Transport");
//         await this.addListener(transport)
//         resolve(await super.initWrapped(transport))
//       } else if (this._transport.isSettled()) {
//         console.log("settled transport");
//         await (await this.transport).connect()
//         resolve(await super.initWrapped(await this.transport))
//       } else {
//         console.log("No transport");
//         const activeAccount = await this.getActiveAccount()
//         const stopListening = () => {
//           if (this.postMessageTransportWrapped) {
//             this.postMessageTransportWrapped.stopListeningForNewPeers().catch(console.error)
//           }
//           if (this.p2pTransportWrapped) {
//             this.p2pTransportWrapped.stopListeningForNewPeers().catch(console.error)
//           }
//         }
//         await this.initInternalTransportsWrapped()
//         if (!this.postMessageTransportWrapped || !this.p2pTransportWrapped) {
//           return
//         }
//         this.postMessageTransportWrapped.connect().then().catch(console.error)
//         console.log("Before activeacc check");
//         if (activeAccount && activeAccount.origin) {
//           console.log("Have acc");
//           const origin = activeAccount.origin.type
//           // Select the transport that matches the active account
//           if (origin === Origin.EXTENSION) {
//             resolve(await super.initWrapped(this.postMessageTransportWrapped))
//           } else if (origin === Origin.P2P) {
//             resolve(await super.initWrapped(this.p2pTransportWrapped))
//           }
//         } else {
//           console.log("Acc not found");
//           const p2pTransport = this.p2pTransportWrapped
//           const postMessageTransport = this.postMessageTransportWrapped
//           console.log("before mess transport");
//           postMessageTransport
//             .listenForNewPeer((peer) => {
//               console.log('init', 'postmessage transport peer connected', peer)
//               this.eventsWrapped
//                 .emit(BeaconEvent.PAIR_SUCCESS, peer)
//                 .catch((emitError) => console.warn(emitError))
//               this.setActivePeer(peer).catch(console.error)
//               this.setTransport(this.postMessageTransportWrapped).catch(console.error)
//               stopListening()
//               resolve(TransportType.POST_MESSAGE)
//             })
//             .catch(console.error)
//           console.log("Bf p2p transport");
//           p2pTransport
//             .listenForNewPeer((peer) => {
//               console.log("get peer", peer);
//               console.log('init', 'p2p transport peer connected', peer)
//               this.eventsWrapped
//                 .emit(BeaconEvent.PAIR_SUCCESS, peer)
//                 .catch((emitError) => console.warn(emitError))
//               this.setActivePeer(peer).catch(console.error)
//               this.setTransport(this.p2pTransportWrapped).catch(console.error)
//               stopListening()
//               resolve(TransportType.P2P)
//             })
//             .catch(console.error)
//           console.log("ubder p2p transport");
//           PostMessageTransport.getAvailableExtensions()
//             .then(async () => {
//               const winfo = await postMessageTransport.getPairingRequestInfo();
//               console.log(winfo);
//               this.eventsWrapped
//                 .emit(BeaconEvent.PAIR_INIT, {
//                   p2pPeerInfo: async () => {
//                     p2pTransport.connect().then().catch(console.error)
//                     const info = p2pTransport.getPairingRequestInfo();
//                     console.log(await info);
//                     return info
//                   },
//                   postmessagePeerInfo: () => postMessageTransport.getPairingRequestInfo(),
//                   preferredNetwork: this.preferredNetworkWrapped,
//                   abortedHandler: () => {
//                     console.log('ABORTED')
//                     this._initPromiseWrapped = undefined
//                   },
//                   disclaimerText: 'this.disclaimerText'
//                 })
//                 .catch((emitError) => console.warn(emitError))
//             })
//             .catch((error) => {
//               this._initPromiseWrapped = undefined
//               console.error(error)
//             })
//         }
//       }
//     })
//     return this._initPromiseWrapped
//   }
//   private async makeRequestWrapped<T extends BeaconRequestInputMessage, U extends BeaconMessage>(
//     requestInput: Optional<T, IgnoredRequestInputProperties>
//   ): Promise<{
//     message: U
//     connectionInfo: ConnectionContext
//   }> {
//     console.log(1);
//     const messageId = await generateGUID()
//     console.log(2);
//     console.time(messageId)
//     console.log('makeRequest', 'starting')
//     await this.initWrapped()
//     console.timeLog(messageId, 'init done')
//     console.log('makeRequest', 'after init')
//     if (await this.addRequestAndCheckIfRateLimited()) {
//       this.eventsWrapped
//         .emit(BeaconEvent.LOCAL_RATE_LIMIT_REACHED)
//         .catch((emitError) => console.warn(emitError))
//       throw new Error('rate limit reached')
//     }
//     if (!(await this.checkPermissions(requestInput.type))) {
//       this.eventsWrapped.emit(BeaconEvent.NO_PERMISSIONS).catch((emitError) => console.warn(emitError))
//       throw new Error('No permissions to send this request to wallet!')
//     }
//     if (!this.beaconId) {
//       throw await this.sendInternalErrorWrapped('BeaconID not defined')
//     }
//     const request: Optional<T, IgnoredRequestInputProperties> &
//       Pick<U, IgnoredRequestInputProperties> = {
//       id: messageId,
//       version: '2', // This is the old version
//       senderId: await getSenderId(await this.beaconId),
//       ...requestInput
//     }
//     const exposed = new ExposedPromise<
//       {
//         message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>
//         connectionInfo: ConnectionContext
//       },
//       ErrorResponse
//     >()
//     this.addOpenRequestWrapped(request.id, exposed)
//     const payload = await new Serializer().serialize(request)
//     const account = await this.getActiveAccount()
//     const peer = await this.getPeerWrapped(account)
//     const walletInfo = await this.getWalletInfoWrapped(peer, account)
//     console.log('makeRequest', 'sending message', request)
//     console.timeLog(messageId, 'sending')
//     try {
//       await (await this.transport).send(payload, peer)
//     } catch (sendError) {
//       this.eventsWrapped.emit(BeaconEvent.INTERNAL_ERROR, {
//         text: 'Unable to send message. If this problem persists, please reset the connection and pair your wallet again.',
//         buttons: [
//           {
//             text: 'Reset Connection',
//             actionCallback: async (): Promise<void> => {
//               await closeToast()
//               this.disconnect()
//             }
//           }
//         ]
//       })
//       console.timeLog(messageId, 'send error')
//       throw sendError
//     }
//     console.timeLog(messageId, 'sent')
//     this.eventsWrapped
//       .emit(messageEvents[requestInput.type].sent, {
//         walletInfo: {
//           ...walletInfo,
//           name: walletInfo.name ?? 'Wallet'
//         },
//         extraInfo: {
//           resetCallback: async () => {
//             this.disconnect()
//           }
//         }
//       })
//       .catch((emitError) => console.warn(emitError))
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     return exposed.promise as any // TODO: fix type
//   }
//   private async notifySuccessWrapped(
//     request: BeaconRequestInputMessage,
//     response:
//       | {
//           account: AccountInfo
//           output: PermissionResponseOutput
//           blockExplorer: BlockExplorer
//           connectionContext: ConnectionContext
//           walletInfo: WalletInfo
//         }
//       | {
//           account: AccountInfo
//           output: OperationResponseOutput
//           blockExplorer: BlockExplorer
//           connectionContext: ConnectionContext
//           walletInfo: WalletInfo
//         }
//       | {
//           output: SignPayloadResponseOutput
//           connectionContext: ConnectionContext
//           walletInfo: WalletInfo
//         }
//       // | {
//       //     output: EncryptPayloadResponseOutput
//       //     connectionContext: ConnectionContext
//       //     walletInfo: WalletInfo
//       // }
//       | {
//           network: Network
//           output: BroadcastResponseOutput
//           blockExplorer: BlockExplorer
//           connectionContext: ConnectionContext
//           walletInfo: WalletInfo
//         }
//   ): Promise<void> {
//     this.eventsWrapped
//       .emit(messageEvents[request.type].success, response)
//       .catch((emitError) => console.warn(emitError))
//   }
//   override async requestPermissions(
//     input?: RequestPermissionInput
//   ): Promise<PermissionResponseOutput> {
//     const request: PermissionRequestInput = {
//       appMetadata: await this.getOwnAppMetadata(),
//       type: BeaconMessageType.PermissionRequest,
//       network: input && input.network ? input.network : { type: NetworkType.MAINNET },
//       scopes:
//         input && input.scopes
//           ? input.scopes
//           : [PermissionScope.OPERATION_REQUEST, PermissionScope.SIGN]
//     }
//     const { message, connectionInfo } = await this.makeRequestWrapped<
//       PermissionRequest,
//       PermissionResponse
//     >(request).catch(async (requestError: ErrorResponse) => {
//       throw await this.handleRequestErrorWrapped(request, requestError)
//     })
//     // TODO: Migration code. Remove sometime after 1.0.0 release.
//     const publicKey = message.publicKey || (message as any).pubkey || (message as any).pubKey
//     const address = await getAddressFromPublicKey(publicKey)
//     const accountInfo: AccountInfo = {
//       accountIdentifier: await getAccountIdentifier(address, message.network),
//       senderId: message.senderId,
//       origin: {
//         type: connectionInfo.origin,
//         id: connectionInfo.id
//       },
//       address,
//       publicKey,
//       network: message.network,
//       scopes: message.scopes,
//       threshold: message.threshold,
//       notification: message.notification,
//       connectedAt: new Date().getTime()
//     }
//     await this.accountManager.addAccount(accountInfo)
//     await this.setActiveAccount(accountInfo)
//     const output: PermissionResponseOutput = {
//       ...message,
//       address,
//       accountInfo
//     }
//     await this.notifySuccessWrapped(request, {
//       account: accountInfo,
//       output,
//       blockExplorer: this.blockExplorerWrapped,
//       connectionContext: connectionInfo,
//       walletInfo: await this.getWalletInfoWrapped()
//     })
//     return output
//   }
//   private frameLoadPromise(frame: HTMLIFrameElement, container: HTMLDivElement): Promise<number> {
//     return new Promise<number>((resolve) => {
//       frame.onload = () => {
//         this.auClickPromise(frame).then(async r => {
//           // const serializer = new Serializer();
//           // const keyPair = this._keyPair.promise;
//           // const postMessageTransport = new PostMessageTransport(this.name, await keyPair, this.storage, StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP);
//           // const p2PTransport = new P2PTransport(this.name, await keyPair, this.storage, this.matrixNodes, StorageKey.TRANSPORT_P2P_PEERS_DAPP, this.iconUrl, this.appUrl);
//           // const pairingPayload = {
//           //   p2pSyncCode: () => {
//           //     p2PTransport.connect().then().catch(console.error);
//           //     return p2PTransport.getPairingRequestInfo();
//           //   },
//           //   postmessageSyncCode: () => postMessageTransport.getPairingRequestInfo(),
//           //   preferredNetwork: this.preferredNetwork,
//           // }
//           // const url = 'autonomy-tezos://';
//           // const code = await serializer.serialize(await pairingPayload.p2pSyncCode());
//           // const uri = "".concat(url, "?type=tzip10&data=").concat('');
//           // const qrCode = document.createElement('canvas');
//           // console.log(qrCode)
//           // await QRcode.toCanvas(qrCode, uri, (e) => {
//           //   if (e) {
//           //     throw e;
//           //   }
//           // })
//           // this.request
//           // frame.remove();
//           // container.appendChild(qrCode)
//           this.requestPermissions().then(() => {
//             console.log("hmmm");
//           })
//           resolve(1);
//         })
//         this.otherClickPromise(frame).then(r => {
//           this.requestPermissions().then(() => {
//             resolve(2);
//           })
//           container.remove();
//         })
//       };
//     });
//   }
//   private auClickPromise(frame: HTMLIFrameElement): Promise<void> {
//     return new Promise<void>((resolve) => {
//       const auBtn = frame.contentDocument?.querySelector('#autonomy-wallet-btn');
//       auBtn?.addEventListener('click', async () => {
//         resolve();
//       });
//     });
//   }
//   private otherClickPromise(frame: HTMLIFrameElement): Promise<void> {
//     return new Promise<void>((resolve) => {
//       const otherBtn = frame.contentDocument?.querySelector('#other-wallet-btn');
//       otherBtn?.addEventListener('click', async () => {
//         resolve();
//       });
//     });
//   }
//   private instantiateIframe(): HTMLIFrameElement {
//     const wrapperIframe = document.createElement('iframe');
//     wrapperIframe.src = __dirname + '/templates/pop-up-login.html';
//     wrapperIframe.style.border = 'none';
//     wrapperIframe.style.width = '100%';
//     wrapperIframe.style.height = '100%';
//     wrapperIframe.style.position = 'fixed';
//     wrapperIframe.style.background = 'rgba(2, 0, 1, 0.7)';
//     wrapperIframe.style.left = '0';
//     wrapperIframe.style.top = '0';
//     return wrapperIframe;
//   }
// }
//# sourceMappingURL=draft.js.map