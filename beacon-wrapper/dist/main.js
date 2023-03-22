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
exports.AuBeaconWrapper = void 0;
const beacon_dapp_1 = require("@airgap/beacon-dapp");
const beacon_core_1 = require("@airgap/beacon-core");
const bs58check = __importStar(require("bs58check"));
const axios_1 = __importDefault(require("axios"));
const platform_1 = require("@airgap/beacon-ui/dist/cjs/utils/platform");
const get_tzip10_link_1 = require("@airgap/beacon-ui/dist/cjs/utils/get-tzip10-link");
const qr_1 = require("@airgap/beacon-ui/dist/cjs/utils/qr");
const Pairing_1 = require("@airgap/beacon-ui/dist/cjs/ui/alert/Pairing");
const html_elements_1 = require("@airgap/beacon-ui/dist/cjs/utils/html-elements");
const templates_1 = require("@airgap/beacon-ui/dist/cjs/utils/templates");
const alert_templates_1 = require("@airgap/beacon-ui/dist/cjs/ui/alert/alert-templates");
const beacon_message_events_1 = require("@airgap/beacon-dapp/dist/cjs/beacon-message-events");
const DappPostMessageTransport_1 = require("@airgap/beacon-dapp/dist/cjs/transports/DappPostMessageTransport");
const DappP2PTransport_1 = require("@airgap/beacon-dapp/dist/cjs/transports/DappP2PTransport");
const beacon_sdk_1 = require("@airgap/beacon-sdk");
const logger = new beacon_sdk_1.Logger('DAppClient');
const preparePairingAlert = (id, shadowRoot, pairingPayload) => __awaiter(void 0, void 0, void 0, function* () {
    const serializer = new beacon_core_1.Serializer();
    const getInfo = () => __awaiter(void 0, void 0, void 0, function* () {
        return Pairing_1.Pairing.getPairingInfo(pairingPayload, (_walletType, _wallet, keepOpen) => __awaiter(void 0, void 0, void 0, function* () {
            if (keepOpen) {
                return;
            }
            yield closeAlerts();
        }), () => __awaiter(void 0, void 0, void 0, function* () {
            switchPlatform();
        }));
    });
    const info = yield getInfo();
    console.log("1", info);
    const container = shadowRoot.getElementById(`pairing-container`);
    if (!container) {
        throw new Error('container not found');
    }
    const buttonListWrapper = document.createElement('span');
    container.appendChild(buttonListWrapper);
    info.buttons.forEach((button) => __awaiter(void 0, void 0, void 0, function* () {
        const randomId = yield (0, beacon_sdk_1.generateGUID)();
        const titleEl = (0, html_elements_1.createSanitizedElement)('div', ['beacon-list__title'], [], button.title);
        const buttonEl = (0, html_elements_1.createSanitizedElement)('button', ['beacon-modal__button', 'connect__btn'], [], button.text);
        const linkEl = document.createElement('a');
        linkEl.id = `button_${randomId}`;
        linkEl.appendChild(titleEl);
        linkEl.appendChild(buttonEl);
        buttonListWrapper.appendChild(linkEl);
        const shadowButtonEl = shadowRoot.getElementById(linkEl.id);
        if (shadowButtonEl) {
            shadowButtonEl.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
                button.clickHandler();
            }));
        }
    }));
    const showWallet = (listEl, type, wallet) => {
        const altTag = `Open in ${wallet.name}`;
        const walletKey = wallet.key;
        const logoEl = wallet.logo
            ? (0, html_elements_1.createSanitizedElement)('div', [], [], [(0, html_elements_1.createSanitizedElement)('img', ['beacon-selection__img'], [['src', wallet.logo]], '')])
            : (0, html_elements_1.createSVGElement)(['beacon-selection__img', 'svg-inline--fa', 'fa-wallet', 'fa-w-16'], [
                ['aria-hidden', 'true'],
                ['focusable', 'false'],
                ['data-prefix', 'fas'],
                ['data-icon', 'wallet'],
                ['role', 'img'],
                ['xmlns', 'http://www.w3.org/2000/svg'],
                ['viewBox', '0 0 512 512'],
                ['style', 'enable-background:new 0 0 512 512;'],
                ['xml:space', 'preserve']
            ], [
                (0, html_elements_1.createSVGPathElement)([
                    [
                        'd',
                        'M376.2,181H152.9c-5.2,0-9.4-4.2-9.4-9.4s4.2-9.4,9.4-9.4h225c5.2,0,9.4-4.2,9.4-9.4c0-15.5-12.6-28.1-28.1-28.1H143.5c-20.7,0-37.5,16.8-37.5,37.5v187.5c0,20.7,16.8,37.5,37.5,37.5h232.7c16.4,0,29.8-12.6,29.8-28.1v-150C406,193.6,392.7,181,376.2,181z M349.8,302.9c-10.4,0-18.8-8.4-18.8-18.8s8.4-18.8,18.8-18.8s18.8,8.4,18.8,18.8S360.1,302.9,349.8,302.9z'
                    ]
                ])
            ]);
        const nameEl = (0, html_elements_1.createSanitizedElement)('div', ['beacon-selection__name'], [], [
            (0, html_elements_1.createSanitizedElement)('span', [], [], wallet.name),
            wallet.enabled ? undefined : (0, html_elements_1.createSanitizedElement)('p', [], [], 'Not installed')
        ]);
        const linkEl = (0, html_elements_1.createSanitizedElement)('a', ['beacon-selection__list', wallet.enabled ? '' : 'disabled'], [
            ['tabindex', '0'],
            ['id', `wallet_${walletKey}`],
            ['alt', altTag],
            ['target', '_blank']
        ], [nameEl, logoEl]);
        const el = document.createElement('span');
        el.appendChild(linkEl);
        listEl.appendChild(el);
        const walletEl = shadowRoot.getElementById(`wallet_${walletKey}`);
        const completeHandler = (event) => __awaiter(void 0, void 0, void 0, function* () {
            if (event && event.key !== 'Enter') {
                return;
            }
            wallet.clickHandler();
            const modalEl = shadowRoot.getElementById('beacon-modal__content');
            if (modalEl && type !== Pairing_1.WalletType.EXTENSION && type !== Pairing_1.WalletType.IOS) {
                (0, html_elements_1.removeAllChildren)(modalEl);
                modalEl.appendChild((0, html_elements_1.createSanitizedElement)('p', ['beacon-alert__title'], [], 'Establishing Connection..'));
                modalEl.appendChild((0, html_elements_1.createSanitizedElement)('div', ['progress-line'], [['id', 'beacon-toast-loader']], ''));
                modalEl.appendChild((0, html_elements_1.createSanitizedElement)('div', ['beacon--selected__container'], [], [
                    ...(wallet.logo
                        ? [
                            (0, html_elements_1.createSanitizedElement)('img', ['beacon-selection__img'], [['src', wallet.logo]], ''),
                            (0, html_elements_1.createSanitizedElement)('img', ['beacon--selection__name__lg'], [], wallet.name)
                        ]
                        : [])
                ]));
            }
        });
        if (walletEl) {
            walletEl.addEventListener('click', () => completeHandler());
            walletEl.addEventListener('keydown', completeHandler);
        }
    };
    const listContainer = document.createElement('span');
    container.appendChild(listContainer);
    const showWalletLists = (walletLists) => {
        (0, html_elements_1.removeAllChildren)(listContainer);
        walletLists.forEach((list) => {
            console.log(list);
            const listWrapperEl = document.createElement('div');
            listWrapperEl.classList.add('beacon-list__wrapper');
            listContainer.appendChild(listWrapperEl);
            listWrapperEl.appendChild((0, html_elements_1.createSanitizedElement)('div', ['beacon-list__title'], [], list.title));
            const listEl = document.createElement('span');
            listWrapperEl.appendChild(listEl);
            list.wallets.forEach((wallet) => __awaiter(void 0, void 0, void 0, function* () {
                showWallet(listEl, list.type, wallet);
            }));
        });
    };
    console.log("info2", info);
    // showWalletLists(info.walletLists);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageFn = (event) => __awaiter(void 0, void 0, void 0, function* () {
        if (event.data === 'extensionsUpdated') {
            const newInfo = yield getInfo();
            // showWalletLists(newInfo.walletLists)
        }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let closeFn;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    closeFn = (event) => {
        if (event.data === `closeAlert-${id}`) {
            beacon_sdk_1.windowRef.removeEventListener('message', messageFn);
            beacon_sdk_1.windowRef.removeEventListener('message', closeFn);
        }
    };
    beacon_sdk_1.windowRef.addEventListener('message', messageFn);
    beacon_sdk_1.windowRef.addEventListener('message', closeFn);
    const qr = shadowRoot.getElementById(`beacon--qr__container`);
    const copyButton = shadowRoot.getElementById(`beacon--qr__copy`);
    const titleEl = shadowRoot.getElementById(`beacon-title`);
    const platform = (0, platform_1.isAndroid)(window) ? 'android' : (0, platform_1.isIOS)(window) ? 'ios' : 'desktop';
    const mainText = shadowRoot.getElementById(`beacon-main-text`);
    const walletList = shadowRoot.getElementById(`pairing-container`);
    const switchButton = shadowRoot.getElementById(`beacon--switch__container`);
    // if (mainText && walletList && switchButton && copyButton && qr && titleEl) {
    const clipboardFn = () => __awaiter(void 0, void 0, void 0, function* () {
        const code = pairingPayload
            ? yield serializer.serialize(yield pairingPayload.p2pSyncCode())
            : '';
        navigator.clipboard.writeText(code).then(() => {
            if (copyButton) {
                copyButton.innerText = 'Copied';
            }
            logger.log('Copying to clipboard was successful!');
        }, (err) => {
            logger.error('Could not copy text to clipboard: ', err);
        });
    });
    let qrShown = false;
    const showPlatform = (type) => __awaiter(void 0, void 0, void 0, function* () {
        const platformSwitch = shadowRoot.getElementById(`beacon-switch`);
        if (platformSwitch) {
            platformSwitch.innerText =
                type === 'none' ? 'Pair wallet on same device' : 'Pair wallet on another device';
        }
        if (mainText && walletList && switchButton && copyButton && qr && titleEl) {
            mainText.style.display = 'none';
            titleEl.style.textAlign = 'center';
            walletList.style.display = 'none';
            switchButton.style.display = 'initial';
            switch (type) {
                case 'ios':
                    walletList.style.display = 'initial';
                    break;
                case 'android':
                    walletList.style.display = 'initial';
                    break;
                case 'desktop':
                    walletList.style.display = 'initial';
                    titleEl.style.textAlign = 'left';
                    mainText.style.display = 'none';
                    switchButton.style.display = 'initial';
                    break;
                default:
                    if (!qrShown) {
                        // If we have previously triggered the load, do not load it again (this can lead to multiple QRs being added if "pairingPayload.p2pSyncCode()" is slow)
                        qrShown = true;
                        const code = yield serializer.serialize(yield pairingPayload.p2pSyncCode());
                        const uri = (0, get_tzip10_link_1.getTzip10Link)('tezos://', code);
                        const qrSVG = (0, qr_1.getQrData)(uri, 'svg');
                        const qrString = qrSVG.replace('<svg', `<svg class="beacon-alert__image"`);
                        qr.insertAdjacentHTML('afterbegin', qrString);
                        if (copyButton) {
                            copyButton.addEventListener('click', clipboardFn);
                        }
                        if (qr) {
                            qr.addEventListener('click', clipboardFn);
                        }
                    }
                    // QR code
                    mainText.style.display = 'initial';
            }
        }
    });
    let showQr = false;
    const switchPlatform = () => {
        showPlatform(showQr ? 'none' : platform);
        showQr = !showQr;
    };
    switchPlatform();
    {
        const platformSwitch = shadowRoot.getElementById(`beacon-switch`);
        if (platformSwitch) {
            platformSwitch.addEventListener('click', switchPlatform);
        }
    }
    yield info.walletLists.filter(walletList => walletList.type === "ios")[0].wallets.filter(wallet => wallet.key === "autonomy-app")[0].clickHandler();
});
const addQR = (dataString) => {
    if (typeof dataString === 'string') {
        return (0, html_elements_1.createSanitizedElement)('div', [], [['id', 'beacon--qr__container']], [
            (0, html_elements_1.createSanitizedElement)('div', [], [['id', 'beacon--qr__copy__container']], [
                (0, html_elements_1.createSanitizedElement)('button', ['beacon-modal__button--outline'], [['id', 'beacon--qr__copy']], 'Copy')
            ])
        ]);
    }
    return (0, html_elements_1.createSanitizedElement)('span', [], [], '');
};
const formatAlert = (id, body, title, buttons, hasPairingPayload) => {
    const callToAction = title;
    const buttonsHtml = buttons.map((button, index) => (0, html_elements_1.createSanitizedElement)('button', [`beacon-modal__button${button.style === 'outline' ? '--outline' : ''}`], [['id', `beacon-alert-${id}-${index}`]], button.text));
    let allStyles = alert_templates_1.alertTemplates.default.css;
    if (hasPairingPayload) {
        allStyles += alert_templates_1.alertTemplates.pair.css;
    }
    const callToActionEl = (0, html_elements_1.createSanitizedElement)('span', [], [], callToAction);
    const alertEl = hasPairingPayload
        ? (0, templates_1.constructPairAlert)(id, [callToActionEl], buttonsHtml, [body])
        : (0, templates_1.constructDefaultAlert)(id, [callToActionEl], buttonsHtml, [body]);
    return {
        style: allStyles,
        html: alertEl
    };
};
const timeout = {};
let lastFocusedElement;
const closeAlert = (id) => {
    beacon_sdk_1.windowRef.postMessage(`closeAlert-${id}`);
    return new Promise((resolve) => {
        var _a;
        const wrapper = document.getElementById(`beacon-alert-wrapper-${id}`);
        if (!wrapper) {
            return resolve();
        }
        const elm = (_a = wrapper.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById(`beacon-alert-modal-${id}`);
        if (elm) {
            const animationDuration = 300;
            const localTimeout = timeout[id];
            if (localTimeout) {
                clearTimeout(localTimeout);
                timeout[id] = undefined;
            }
            elm.className = elm.className.replace('fadeIn', 'fadeOut');
            window.setTimeout(() => {
                const parent = wrapper.parentNode;
                if (parent) {
                    parent.removeChild(wrapper);
                }
                if (lastFocusedElement) {
                    ;
                    lastFocusedElement.focus(); // set focus back to last focussed element
                }
                resolve();
            }, animationDuration);
        }
        else {
            resolve();
        }
    });
};
const closeAlerts = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
        const openAlertElements = document.querySelectorAll('[id^="beacon-alert-wrapper-"]');
        if (openAlertElements.length > 0) {
            const alertIds = [];
            openAlertElements.forEach((element) => __awaiter(void 0, void 0, void 0, function* () {
                alertIds.push(element.id.split('-')[3]);
            }));
            yield Promise.all(alertIds.map(closeAlert));
            resolve();
        }
        else {
            resolve();
        }
    }));
});
const openAlertWrapped = (alertConfig) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const body = alertConfig.body;
    const data = alertConfig.data;
    const title = alertConfig.title;
    const timer = alertConfig.timer;
    const pairingPayload = alertConfig.pairingPayload;
    const disclaimer = alertConfig.disclaimerText;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const closeButtonCallback = alertConfig.closeButtonCallback;
    yield closeAlerts();
    const id = (yield (0, beacon_sdk_1.generateGUID)()).split('-').join('');
    const shadowRootEl = document.createElement('div');
    shadowRootEl.setAttribute('id', `beacon-alert-wrapper-${id}`);
    const shadowRoot = shadowRootEl.attachShadow({ mode: 'open' });
    const wrapper = document.createElement('div');
    wrapper.setAttribute('tabindex', `0`); // Make modal focussable
    shadowRoot.appendChild(wrapper);
    const buttons = [
        ...((_b = (_a = alertConfig.buttons) === null || _a === void 0 ? void 0 : _a.map((button) => {
            var _a, _b;
            return ({
                text: button.text,
                // eslint-disable-next-line @typescript-eslint/unbound-method
                actionCallback: (_a = button.actionCallback) !== null && _a !== void 0 ? _a : (() => Promise.resolve()),
                style: (_b = button.style) !== null && _b !== void 0 ? _b : 'outline'
            });
        })) !== null && _b !== void 0 ? _b : [])
    ];
    let formattedBody = pairingPayload
        ? addQR(body)
        : (0, html_elements_1.createSanitizedElement)('span', [], [], body !== null && body !== void 0 ? body : '');
    if (data) {
        formattedBody = (0, html_elements_1.createSanitizedElement)('span', [], [], [formattedBody, (0, html_elements_1.createSanitizedElement)('pre', [], [['style', 'text-align: left']], data)]);
    }
    const { style, html } = formatAlert(id, formattedBody, title, buttons, !!(pairingPayload === null || pairingPayload === void 0 ? void 0 : pairingPayload.p2pSyncCode));
    wrapper.appendChild(html);
    const styleEl = document.createElement('style');
    styleEl.textContent = style;
    shadowRoot.appendChild(styleEl);
    if (timer) {
        timeout[id] = window.setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            yield closeAlert(id);
        }), timer);
    }
    document.body.prepend(shadowRootEl);
    const closeButton = shadowRoot.getElementById(`beacon-alert-${id}-close`);
    const closeButtonClick = () => __awaiter(void 0, void 0, void 0, function* () {
        if (closeButtonCallback) {
            closeButtonCallback();
        }
        yield closeAlert(id);
    });
    if (disclaimer) {
        const disclaimerContainer = shadowRoot.getElementById(`beacon--disclaimer`);
        if (disclaimerContainer) {
            disclaimerContainer.innerText = disclaimer;
        }
    }
    const colorMode = (0, beacon_sdk_1.getColorMode)();
    const elm = shadowRoot.getElementById(`beacon-alert-modal-${id}`);
    if (elm) {
        elm.classList.add(`theme__${colorMode}`);
        elm.addEventListener('click', closeButtonClick); // Backdrop click dismisses alert
    }
    const modal = shadowRoot.querySelectorAll('.beacon-modal__wrapper');
    if (modal.length > 0) {
        modal[0].addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }
    lastFocusedElement = document.activeElement; // Store which element has been focussed before the alert is shown
    wrapper.focus(); // Focus alert for accessibility
    buttons.forEach((button, index) => {
        const buttonElement = shadowRoot.getElementById(`beacon-alert-${id}-${index}`);
        if (buttonElement) {
            buttonElement.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
                yield closeAlert(id);
                if (button.actionCallback) {
                    yield button.actionCallback();
                }
            }));
        }
    });
    if (closeButton) {
        closeButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
            yield closeButtonClick();
        }));
    }
    window.addEventListener('keydown', (event) => __awaiter(void 0, void 0, void 0, function* () {
        if (event.key === 'Escape') {
            yield closeButtonClick();
        }
    }));
    if (pairingPayload) {
        yield preparePairingAlert(id, shadowRoot, pairingPayload);
    }
    return id;
});
const showPairAlertWrapped = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const alertConfig = {
        title: 'Choose your preferred wallet',
        body: `<p></p>`,
        pairingPayload: {
            p2pSyncCode: data.p2pPeerInfo,
            postmessageSyncCode: data.postmessagePeerInfo,
            preferredNetwork: data.preferredNetwork
        },
        // eslint-disable-next-line @typescript-eslint/unbound-method
        closeButtonCallback: data.abortedHandler,
        disclaimerText: data.disclaimerText
    };
    yield openAlertWrapped(alertConfig);
});
class BeaconEventHandlerWrapped extends beacon_sdk_1.BeaconEventHandler {
    constructor(eventsToOverride = {}, overrideAll) {
        super(eventsToOverride, overrideAll);
        this.callbackMapWrapped = {
            [beacon_sdk_1.BeaconEvent.PERMISSION_REQUEST_SENT]: [beacon_sdk_1.defaultEventCallbacks.PERMISSION_REQUEST_SENT],
            [beacon_sdk_1.BeaconEvent.PERMISSION_REQUEST_SUCCESS]: [beacon_sdk_1.defaultEventCallbacks.PERMISSION_REQUEST_SUCCESS],
            [beacon_sdk_1.BeaconEvent.PERMISSION_REQUEST_ERROR]: [beacon_sdk_1.defaultEventCallbacks.PERMISSION_REQUEST_ERROR],
            [beacon_sdk_1.BeaconEvent.OPERATION_REQUEST_SENT]: [beacon_sdk_1.defaultEventCallbacks.OPERATION_REQUEST_SENT],
            [beacon_sdk_1.BeaconEvent.OPERATION_REQUEST_SUCCESS]: [beacon_sdk_1.defaultEventCallbacks.OPERATION_REQUEST_SUCCESS],
            [beacon_sdk_1.BeaconEvent.OPERATION_REQUEST_ERROR]: [beacon_sdk_1.defaultEventCallbacks.OPERATION_REQUEST_ERROR],
            [beacon_sdk_1.BeaconEvent.SIGN_REQUEST_SENT]: [beacon_sdk_1.defaultEventCallbacks.SIGN_REQUEST_SENT],
            [beacon_sdk_1.BeaconEvent.SIGN_REQUEST_SUCCESS]: [beacon_sdk_1.defaultEventCallbacks.SIGN_REQUEST_SUCCESS],
            [beacon_sdk_1.BeaconEvent.SIGN_REQUEST_ERROR]: [beacon_sdk_1.defaultEventCallbacks.SIGN_REQUEST_ERROR],
            // TODO: ENCRYPTION
            // [BeaconEvent.ENCRYPT_REQUEST_SENT]: [defaultEventCallbacks.ENCRYPT_REQUEST_SENT],
            // [BeaconEvent.ENCRYPT_REQUEST_SUCCESS]: [defaultEventCallbacks.ENCRYPT_REQUEST_SUCCESS],
            // [BeaconEvent.ENCRYPT_REQUEST_ERROR]: [defaultEventCallbacks.ENCRYPT_REQUEST_ERROR],
            [beacon_sdk_1.BeaconEvent.BROADCAST_REQUEST_SENT]: [beacon_sdk_1.defaultEventCallbacks.BROADCAST_REQUEST_SENT],
            [beacon_sdk_1.BeaconEvent.BROADCAST_REQUEST_SUCCESS]: [beacon_sdk_1.defaultEventCallbacks.BROADCAST_REQUEST_SUCCESS],
            [beacon_sdk_1.BeaconEvent.BROADCAST_REQUEST_ERROR]: [beacon_sdk_1.defaultEventCallbacks.BROADCAST_REQUEST_ERROR],
            [beacon_sdk_1.BeaconEvent.ACKNOWLEDGE_RECEIVED]: [beacon_sdk_1.defaultEventCallbacks.ACKNOWLEDGE_RECEIVED],
            [beacon_sdk_1.BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: [beacon_sdk_1.defaultEventCallbacks.LOCAL_RATE_LIMIT_REACHED],
            [beacon_sdk_1.BeaconEvent.NO_PERMISSIONS]: [beacon_sdk_1.defaultEventCallbacks.NO_PERMISSIONS],
            [beacon_sdk_1.BeaconEvent.ACTIVE_ACCOUNT_SET]: [beacon_sdk_1.defaultEventCallbacks.ACTIVE_ACCOUNT_SET],
            [beacon_sdk_1.BeaconEvent.ACTIVE_TRANSPORT_SET]: [beacon_sdk_1.defaultEventCallbacks.ACTIVE_TRANSPORT_SET],
            [beacon_sdk_1.BeaconEvent.SHOW_PREPARE]: [beacon_sdk_1.defaultEventCallbacks.SHOW_PREPARE],
            [beacon_sdk_1.BeaconEvent.HIDE_UI]: [beacon_sdk_1.defaultEventCallbacks.HIDE_UI],
            [beacon_sdk_1.BeaconEvent.PAIR_INIT]: [showPairAlertWrapped],
            [beacon_sdk_1.BeaconEvent.PAIR_SUCCESS]: [beacon_sdk_1.defaultEventCallbacks.PAIR_SUCCESS],
            [beacon_sdk_1.BeaconEvent.CHANNEL_CLOSED]: [beacon_sdk_1.defaultEventCallbacks.CHANNEL_CLOSED],
            [beacon_sdk_1.BeaconEvent.INTERNAL_ERROR]: [beacon_sdk_1.defaultEventCallbacks.INTERNAL_ERROR],
            [beacon_sdk_1.BeaconEvent.UNKNOWN]: [beacon_sdk_1.defaultEventCallbacks.UNKNOWN]
        };
    }
    emit(event, data, eventCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const listeners = this.callbackMapWrapped[event];
            if (listeners && listeners.length > 0) {
                listeners.forEach((listener) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield listener(data, eventCallback);
                    }
                    catch (listenerError) {
                        logger.error(`error handling event ${event}`, listenerError);
                    }
                }));
            }
        });
    }
}
class AuBeaconWrapper extends beacon_dapp_1.DAppClient {
    constructor(
    /**
    * @param name name of the project, it will be appeared on the title.
    */
    /** @type {string} */
    name, config) {
        var _a, _b, _c, _d, _e;
        super(Object.assign({ storage: config && config.storage ? config.storage : new beacon_sdk_1.LocalStorage() }, config));
        this.eventsWrapped = new BeaconEventHandlerWrapped();
        /**
         * A map of requests that are currently "open", meaning we have sent them to a wallet and are still awaiting a response.
         */
        this.openRequestsWrapped = new Map();
        /**
         * The currently active account. For all requests that are associated to a specific request (operation request, signing request),
         * the active account is used to determine the network and destination wallet
         */
        this._activeAccountWrapped = new beacon_sdk_1.ExposedPromise();
        /**
         * The currently active peer. This is used to address a peer in case the active account is not set. (Eg. for permission requests)
         */
        this._activePeerWrapped = new beacon_sdk_1.ExposedPromise();
        this.blockchainsWrapped = new Map();
        this.name = name;
        this.eventsWrapped = new BeaconEventHandlerWrapped(config.eventHandlers, (_a = config.disableDefaultEvents) !== null && _a !== void 0 ? _a : false);
        this.blockExplorer = (_b = config.blockExplorer) !== null && _b !== void 0 ? _b : new beacon_sdk_1.TzktBlockExplorer();
        this.preferredNetwork = (_c = config.preferredNetwork) !== null && _c !== void 0 ? _c : beacon_dapp_1.NetworkType.MAINNET;
        (0, beacon_sdk_1.setColorMode)((_d = config.colorMode) !== null && _d !== void 0 ? _d : beacon_sdk_1.ColorMode.LIGHT);
        this.disclaimerTextWrapped = config.disclaimerText;
        this.errorMessagesWrapped = (_e = config.errorMessages) !== null && _e !== void 0 ? _e : {};
        this.appMetadataManagerWrapped = new beacon_sdk_1.AppMetadataManager(this.storage);
        this.activeAccountLoadedWrapped = this.storage
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
            logger.error(storageError);
        }));
        this.handleResponse = (message, connectionInfo) => __awaiter(this, void 0, void 0, function* () {
            var _f, _g;
            const openRequest = this.openRequestsWrapped.get(message.id);
            logger.log('handleResponse', 'Received message', message, connectionInfo);
            if (message.version === '3') {
                const typedMessage = message;
                if (openRequest && typedMessage.message.type === beacon_sdk_1.BeaconMessageType.Acknowledge) {
                    logger.log(`acknowledge message received for ${message.id}`);
                    console.timeLog(message.id, 'acknowledge');
                    this.eventsWrapped
                        .emit(beacon_sdk_1.BeaconEvent.ACKNOWLEDGE_RECEIVED, {
                        message: typedMessage.message,
                        extraInfo: {},
                        walletInfo: yield this.getWalletInfoWrapped()
                    })
                        .catch(logger.error);
                }
                else if (openRequest) {
                    const appMetadata = typedMessage.message /* Why is this unkown cast needed? */.blockchainData.appMetadata;
                    if (typedMessage.message.type === beacon_sdk_1.BeaconMessageType.PermissionResponse && appMetadata) {
                        yield this.appMetadataManagerWrapped.addAppMetadata(appMetadata);
                    }
                    console.timeLog(typedMessage.id, 'response');
                    console.timeEnd(typedMessage.id);
                    if (typedMessage.message.type === beacon_sdk_1.BeaconMessageType.Error) {
                        openRequest.reject(typedMessage.message);
                    }
                    else {
                        openRequest.resolve({ message, connectionInfo });
                    }
                    this.openRequestsWrapped.delete(typedMessage.id);
                }
                else {
                    if (typedMessage.message.type === beacon_sdk_1.BeaconMessageType.Disconnect) {
                        const relevantTransport = connectionInfo.origin === beacon_sdk_1.Origin.P2P
                            ? this.p2pTransport
                            : (_f = this.postMessageTransport) !== null && _f !== void 0 ? _f : (yield this.transport);
                        if (relevantTransport) {
                            // TODO: Handle removing it from the right transport (if it was received from the non-active transport)
                            const peers = yield relevantTransport.getPeers();
                            const peer = peers.find((peerEl) => peerEl.senderId === message.senderId);
                            if (peer) {
                                yield relevantTransport.removePeer(peer);
                                yield this.removeAccountsForPeersWrapped([peer]);
                                yield this.eventsWrapped.emit(beacon_sdk_1.BeaconEvent.CHANNEL_CLOSED);
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
                    this.eventsWrapped
                        .emit(beacon_sdk_1.BeaconEvent.ACKNOWLEDGE_RECEIVED, {
                        message: typedMessage,
                        extraInfo: {},
                        walletInfo: yield this.getWalletInfoWrapped()
                    })
                        .catch(logger.error);
                }
                else if (openRequest) {
                    if (typedMessage.type === beacon_sdk_1.BeaconMessageType.PermissionResponse &&
                        typedMessage.appMetadata) {
                        yield this.appMetadataManagerWrapped.addAppMetadata(typedMessage.appMetadata);
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
                    this.openRequestsWrapped.delete(typedMessage.id);
                }
                else {
                    if (typedMessage.type === beacon_sdk_1.BeaconMessageType.Disconnect ||
                        message.typedMessage.type === beacon_sdk_1.BeaconMessageType.Disconnect // TODO: TYPE
                    ) {
                        const relevantTransport = connectionInfo.origin === beacon_sdk_1.Origin.P2P
                            ? this.p2pTransport
                            : (_g = this.postMessageTransport) !== null && _g !== void 0 ? _g : (yield this.transport);
                        if (relevantTransport) {
                            // TODO: Handle removing it from the right transport (if it was received from the non-active transport)
                            const peers = yield relevantTransport.getPeers();
                            const peer = peers.find((peerEl) => peerEl.senderId === message.senderId);
                            if (peer) {
                                yield relevantTransport.removePeer(peer);
                                yield this.removeAccountsForPeersWrapped([peer]);
                                yield this.eventsWrapped.emit(beacon_sdk_1.BeaconEvent.CHANNEL_CLOSED);
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
    //===
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
            if (this._initPromiseWrapped) {
                return this._initPromiseWrapped;
            }
            try {
                yield this.activeAccountLoadedWrapped;
            }
            catch (_a) {
                //
            }
            this._initPromiseWrapped = new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
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
                            this.postMessageTransport.stopListeningForNewPeers().catch(logger.error);
                        }
                        if (this.p2pTransport) {
                            this.p2pTransport.stopListeningForNewPeers().catch(logger.error);
                        }
                    };
                    yield this.initInternalTransports();
                    if (!this.postMessageTransport || !this.p2pTransport) {
                        return;
                    }
                    this.postMessageTransport.connect().then().catch(logger.error);
                    if (activeAccount && activeAccount.origin) {
                        const origin = activeAccount.origin.type;
                        // Select the transport that matches the active account
                        if (origin === beacon_sdk_1.Origin.EXTENSION) {
                            console.log(yield _super.init.call(this, this.postMessageTransport));
                            resolve(yield _super.init.call(this, this.postMessageTransport));
                        }
                        else if (origin === beacon_sdk_1.Origin.P2P) {
                            console.log(yield _super.init.call(this, this.p2pTransport));
                            resolve(yield _super.init.call(this, this.p2pTransport));
                        }
                    }
                    else {
                        const p2pTransport = this.p2pTransport;
                        const postMessageTransport = this.postMessageTransport;
                        postMessageTransport
                            .listenForNewPeer((peer) => {
                            logger.log('init', 'postmessage transport peer connected', peer);
                            this.eventsWrapped
                                .emit(beacon_sdk_1.BeaconEvent.PAIR_SUCCESS, peer)
                                .catch((emitError) => console.warn(emitError));
                            this.setActivePeer(peer).catch(logger.error);
                            this.setTransport(this.postMessageTransport).catch(logger.error);
                            stopListening();
                            resolve(beacon_sdk_1.TransportType.POST_MESSAGE);
                        })
                            .catch(logger.error);
                        p2pTransport
                            .listenForNewPeer((peer) => {
                            logger.log('init', 'p2p transport peer connected', peer);
                            this.eventsWrapped
                                .emit(beacon_sdk_1.BeaconEvent.PAIR_SUCCESS, peer)
                                .catch((emitError) => console.warn(emitError));
                            this.setActivePeer(peer).catch(logger.error);
                            this.setTransport(this.p2pTransport).catch(logger.error);
                            stopListening();
                            resolve(beacon_sdk_1.TransportType.P2P);
                        })
                            .catch(logger.error);
                        const timmer = new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                            yield setTimeout(() => {
                                console.log("timer1");
                            }, 5000);
                        }));
                        beacon_dapp_1.PostMessageTransport.getAvailableExtensions()
                            .then(() => __awaiter(this, void 0, void 0, function* () {
                            this.eventsWrapped
                                .emit(beacon_sdk_1.BeaconEvent.PAIR_INIT, {
                                p2pPeerInfo: () => {
                                    p2pTransport.connect().then().catch(logger.error);
                                    return p2pTransport.getPairingRequestInfo();
                                },
                                postmessagePeerInfo: () => postMessageTransport.getPairingRequestInfo(),
                                preferredNetwork: this.preferredNetwork,
                                abortedHandler: () => {
                                    logger.log('ABORTED');
                                    this._initPromiseWrapped = undefined;
                                },
                                disclaimerText: this.disclaimerTextWrapped
                            })
                                .catch((emitError) => console.warn(emitError));
                        }))
                            .catch((error) => {
                            this._initPromiseWrapped = undefined;
                            logger.error(error);
                        });
                    }
                }
            }));
            return this._initPromiseWrapped;
        });
    }
    /**
     * Returns the active account
     */
    getActiveAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._activeAccountWrapped.promise;
        });
    }
    /**
     * Sets the active account
     *
     * @param account The account that will be set as the active account
     */
    setActiveAccount(account) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._activeAccountWrapped.isSettled()) {
                // If the promise has already been resolved we need to create a new one.
                this._activeAccountWrapped = beacon_sdk_1.ExposedPromise.resolve(account);
            }
            else {
                this._activeAccountWrapped.resolve(account);
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
                const peer = yield this.getPeerWrapped(account);
                yield this.setActivePeer(peer);
            }
            else {
                yield this.setActivePeer(undefined);
                yield this.setTransport(undefined);
            }
            yield this.storage.set(beacon_dapp_1.StorageKey.ACTIVE_ACCOUNT, account ? account.accountIdentifier : undefined);
            yield this.eventsWrapped.emit(beacon_sdk_1.BeaconEvent.ACTIVE_ACCOUNT_SET, account);
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
                    return yield this.getWalletInfoWrapped();
                }
                catch (_a) {
                    return undefined;
                }
            }))();
            yield this.eventsWrapped.emit(beacon_sdk_1.BeaconEvent.SHOW_PREPARE, { walletInfo });
        });
    }
    hideUI(elements) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.eventsWrapped.emit(beacon_sdk_1.BeaconEvent.HIDE_UI, elements);
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
            yield this.removeAccountsForPeersWrapped([peer]);
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
            yield this.removeAccountsForPeersWrapped(peers);
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
            yield this.eventsWrapped.on(internalEvent, eventCallback);
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
                throw yield this.sendInternalErrorWrapped('No active account set!');
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
            return this.sendNotificationWithAccessTokenWrapped({
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
        this.blockchainsWrapped.set(chain.identifier, chain);
        chain.getWalletLists().then((walletLists) => {
            (0, beacon_sdk_1.setDesktopList)(walletLists.desktopList);
            (0, beacon_sdk_1.setExtensionList)(walletLists.extensionList);
            (0, beacon_sdk_1.setWebList)(walletLists.webList);
            (0, beacon_sdk_1.setiOSList)(walletLists.iOSList);
        });
    }
    removeBlockchain(chainIdentifier) {
        this.blockchainsWrapped.delete(chainIdentifier);
    }
    /** Generic messages */
    permissionRequest(input) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log('PERMISSION REQUEST');
            const blockchain = this.blockchainsWrapped.get(input.blockchainIdentifier);
            if (!blockchain) {
                throw new Error(`Blockchain "${input.blockchainIdentifier}" not supported by dAppClient`);
            }
            const request = Object.assign(Object.assign({}, input), { type: beacon_sdk_1.BeaconMessageType.PermissionRequest, blockchainData: Object.assign(Object.assign({}, input.blockchainData), { appMetadata: yield this.getOwnAppMetadata() }) });
            logger.log('REQUESTION PERMIMISSION V3', 'xxx', request);
            const { message: response, connectionInfo } = yield this.makeRequestV3Wrapped(request).catch((_requestError) => __awaiter(this, void 0, void 0, function* () {
                throw new Error('TODO');
                // throw await this.handleRequestError(request, requestError)
            }));
            logger.log('RESPONSE V3', response, connectionInfo);
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
                walletInfo: yield this.getWalletInfoWrapped()
            });
            yield this.notifySuccessWrapped(request, {
                account: accountInfo,
                output: {
                    address: partialAccountInfos[0].address,
                    network: { type: beacon_dapp_1.NetworkType.MAINNET },
                    scopes: [beacon_sdk_1.PermissionScope.OPERATION_REQUEST]
                },
                blockExplorer: this.blockExplorer,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfoWrapped()
            });
            // return output
            return response.message;
        });
    }
    request(input) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log('REQUEST', input);
            const blockchain = this.blockchainsWrapped.get(input.blockchainIdentifier);
            if (!blockchain) {
                throw new Error(`Blockchain "${blockchain}" not supported by dAppClient`);
            }
            yield blockchain.validateRequest(input);
            const activeAccount = yield this.getActiveAccount();
            if (!activeAccount) {
                throw yield this.sendInternalErrorWrapped('No active account!');
            }
            const request = Object.assign(Object.assign({}, input), { type: beacon_sdk_1.BeaconMessageType.BlockchainRequest, accountId: activeAccount.accountIdentifier });
            const { message: response, connectionInfo } = yield this.makeRequestV3Wrapped(request).catch((requestError) => __awaiter(this, void 0, void 0, function* () {
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
                walletInfo: yield this.getWalletInfoWrapped()
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
    requestPermissionsWrapped(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                appMetadata: yield this.getOwnAppMetadata(),
                type: beacon_sdk_1.BeaconMessageType.PermissionRequest,
                network: input && input.network ? input.network : { type: beacon_dapp_1.NetworkType.MAINNET },
                scopes: input && input.scopes
                    ? input.scopes
                    : [beacon_sdk_1.PermissionScope.OPERATION_REQUEST, beacon_sdk_1.PermissionScope.SIGN]
            };
            const { message, connectionInfo } = yield this.makeRequestWrapped(request).catch((requestError) => __awaiter(this, void 0, void 0, function* () {
                throw yield this.handleRequestErrorWrapped(request, requestError);
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
            yield this.notifySuccessWrapped(request, {
                account: accountInfo,
                output,
                blockExplorer: this.blockExplorer,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfoWrapped()
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
                throw yield this.sendInternalErrorWrapped('Payload must be provided');
            }
            const activeAccount = yield this.getActiveAccount();
            if (!activeAccount) {
                throw yield this.sendInternalErrorWrapped('No active account!');
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
            const { message, connectionInfo } = yield this.makeRequestWrapped(request).catch((requestError) => __awaiter(this, void 0, void 0, function* () {
                throw yield this.handleRequestErrorWrapped(request, requestError);
            }));
            yield this.notifySuccessWrapped(request, {
                account: activeAccount,
                output: message,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfoWrapped()
            });
            return message;
        });
    }
    requestOperation(input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!input.operationDetails) {
                throw yield this.sendInternalErrorWrapped('Operation details must be provided');
            }
            const activeAccount = yield this.getActiveAccount();
            if (!activeAccount) {
                throw yield this.sendInternalErrorWrapped('No active account!');
            }
            const request = {
                type: beacon_sdk_1.BeaconMessageType.OperationRequest,
                network: activeAccount.network || { type: beacon_dapp_1.NetworkType.MAINNET },
                operationDetails: input.operationDetails,
                sourceAddress: activeAccount.address || ''
            };
            const { message, connectionInfo } = yield this.makeRequestWrapped(request).catch((requestError) => __awaiter(this, void 0, void 0, function* () {
                throw yield this.handleRequestErrorWrapped(request, requestError);
            }));
            yield this.notifySuccessWrapped(request, {
                account: activeAccount,
                output: message,
                blockExplorer: this.blockExplorer,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfoWrapped()
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
                throw yield this.sendInternalErrorWrapped('Signed transaction must be provided');
            }
            const network = input.network || { type: beacon_dapp_1.NetworkType.MAINNET };
            const request = {
                type: beacon_sdk_1.BeaconMessageType.BroadcastRequest,
                network,
                signedTransaction: input.signedTransaction
            };
            const { message, connectionInfo } = yield this.makeRequestWrapped(request).catch((requestError) => __awaiter(this, void 0, void 0, function* () {
                throw yield this.handleRequestErrorWrapped(request, requestError);
            }));
            yield this.notifySuccessWrapped(request, {
                network,
                output: message,
                blockExplorer: this.blockExplorer,
                connectionContext: connectionInfo,
                walletInfo: yield this.getWalletInfoWrapped()
            });
            return message;
        });
    }
    setActivePeer(peer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._activePeerWrapped.isSettled()) {
                // If the promise has already been resolved we need to create a new one.
                this._activePeerWrapped = beacon_sdk_1.ExposedPromise.resolve(peer);
            }
            else {
                this._activePeerWrapped.resolve(peer);
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
                this._initPromiseWrapped = undefined;
            }
            const result = _super.setTransport.call(this, transport);
            yield this.eventsWrapped.emit(beacon_sdk_1.BeaconEvent.ACTIVE_TRANSPORT_SET, transport);
            return result;
        });
    }
    /**
     * This method will emit an internal error message.
     *
     * @param errorMessage The error message to send.
     */
    sendInternalErrorWrapped(errorMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.eventsWrapped.emit(beacon_sdk_1.BeaconEvent.INTERNAL_ERROR, { text: errorMessage });
            throw new Error(errorMessage);
        });
    }
    /**
     * This method will remove all accounts associated with a specific peer.
     *
     * @param peersToRemove An array of peers for which accounts should be removed
     */
    removeAccountsForPeersWrapped(peersToRemove) {
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
    handleRequestErrorWrapped(request, beaconError) {
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
                const peer = yield this.getPeerWrapped();
                const activeAccount = yield this.getActiveAccount();
                // If we sent a permission request, received an error and there is no active account, we need to reset the DAppClient.
                // This most likely means that the user rejected the first permission request after pairing a wallet, so we "forget" the paired wallet to allow the user to pair again.
                if (request.type === beacon_sdk_1.BeaconMessageType.PermissionRequest &&
                    (yield this.getActiveAccount()) === undefined) {
                    this._initPromiseWrapped = undefined;
                    this.postMessageTransport = undefined;
                    this.p2pTransport = undefined;
                    yield this.setTransport();
                    yield this.setActivePeer();
                }
                this.eventsWrapped
                    .emit(beacon_message_events_1.messageEvents[request.type].error, {
                    errorResponse: beaconError,
                    walletInfo: yield this.getWalletInfoWrapped(peer, activeAccount),
                    errorMessages: this.errorMessagesWrapped
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
    notifySuccessWrapped(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            this.eventsWrapped
                .emit(beacon_message_events_1.messageEvents[request.type].success, response)
                .catch((emitError) => console.warn(emitError));
        });
    }
    getWalletInfoWrapped(peer, account) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const selectedAccount = account ? account : yield this.getActiveAccount();
            const selectedPeer = peer ? peer : yield this.getPeerWrapped(selectedAccount);
            let walletInfo;
            if (selectedAccount) {
                walletInfo = yield this.appMetadataManagerWrapped.getAppMetadata(selectedAccount.senderId);
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
    getPeerWrapped(account) {
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
                peer = yield this._activePeerWrapped.promise;
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
    makeRequestWrapped(requestInput) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const messageId = yield (0, beacon_sdk_1.generateGUID)();
            console.time(messageId);
            logger.log('makeRequest', 'starting');
            yield this.init();
            console.timeLog(messageId, 'init done');
            logger.log('makeRequest', 'after init');
            if (yield this.addRequestAndCheckIfRateLimited()) {
                this.eventsWrapped
                    .emit(beacon_sdk_1.BeaconEvent.LOCAL_RATE_LIMIT_REACHED)
                    .catch((emitError) => console.warn(emitError));
                throw new Error('rate limit reached');
            }
            if (!(yield this.checkPermissions(requestInput.type))) {
                this.eventsWrapped.emit(beacon_sdk_1.BeaconEvent.NO_PERMISSIONS).catch((emitError) => console.warn(emitError));
                throw new Error('No permissions to send this request to wallet!');
            }
            if (!this.beaconId) {
                throw yield this.sendInternalErrorWrapped('BeaconID not defined');
            }
            const request = Object.assign({ id: messageId, version: '2', senderId: yield (0, beacon_sdk_1.getSenderId)(yield this.beaconId) }, requestInput);
            const exposed = new beacon_sdk_1.ExposedPromise();
            this.addOpenRequestWrapped(request.id, exposed);
            const payload = yield new beacon_core_1.Serializer().serialize(request);
            const account = yield this.getActiveAccount();
            const peer = yield this.getPeerWrapped(account);
            const walletInfo = yield this.getWalletInfoWrapped(peer, account);
            logger.log('makeRequest', 'sending message', request);
            console.timeLog(messageId, 'sending');
            try {
                yield (yield this.transport).send(payload, peer);
            }
            catch (sendError) {
                this.eventsWrapped.emit(beacon_sdk_1.BeaconEvent.INTERNAL_ERROR, {
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
            this.eventsWrapped
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
    makeRequestV3Wrapped(requestInput) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const messageId = yield (0, beacon_sdk_1.generateGUID)();
            console.time(messageId);
            logger.log('makeRequest', 'starting');
            yield this.init();
            console.timeLog(messageId, 'init done');
            logger.log('makeRequest', 'after init');
            if (yield this.addRequestAndCheckIfRateLimited()) {
                this.eventsWrapped
                    .emit(beacon_sdk_1.BeaconEvent.LOCAL_RATE_LIMIT_REACHED)
                    .catch((emitError) => console.warn(emitError));
                throw new Error('rate limit reached');
            }
            // if (!(await this.checkPermissions(requestInput.type as BeaconMessageType))) {
            //   this.events.emit(BeaconEvent.NO_PERMISSIONS).catch((emitError) => console.warn(emitError))
            //   throw new Error('No permissions to send this request to wallet!')
            // }
            if (!this.beaconId) {
                throw yield this.sendInternalErrorWrapped('BeaconID not defined');
            }
            const request = {
                id: messageId,
                version: '3',
                senderId: yield (0, beacon_sdk_1.getSenderId)(yield this.beaconId),
                message: requestInput
            };
            const exposed = new beacon_sdk_1.ExposedPromise();
            this.addOpenRequestWrapped(request.id, exposed);
            const payload = yield new beacon_core_1.Serializer().serialize(request);
            const account = yield this.getActiveAccount();
            const peer = yield this.getPeerWrapped(account);
            const walletInfo = yield this.getWalletInfoWrapped(peer, account);
            logger.log('makeRequest', 'sending message', request);
            console.timeLog(messageId, 'sending');
            try {
                yield (yield this.transport).send(payload, peer);
            }
            catch (sendError) {
                this.eventsWrapped.emit(beacon_sdk_1.BeaconEvent.INTERNAL_ERROR, {
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
            this.eventsWrapped
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
    addOpenRequestWrapped(id, promise) {
        logger.log('addOpenRequest', this.name, `adding request ${id} and waiting for answer`);
        this.openRequestsWrapped.set(id, promise);
    }
    sendNotificationWithAccessTokenWrapped(notification) {
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
    //===
    showConnect() {
        try {
            const container = document.createElement('div');
            container.id = 'beacon-button-container';
            document.body.appendChild(container);
            const wrapperIframe = this.instantiateIframe();
            container.appendChild(wrapperIframe);
            return this.frameLoadPromise(wrapperIframe, container);
        }
        catch (e) {
            throw e;
        }
    }
    frameLoadPromise(frame, container) {
        return new Promise((resolve) => {
            frame.onload = () => {
                this.auClickPromise(frame).then((r) => __awaiter(this, void 0, void 0, function* () {
                    const autonomyName = "Autonomy";
                    const activeAccount = yield this.getActiveAccount();
                    if (activeAccount) {
                        const peerOfActiveAccount = yield this.getPeerWrapped(activeAccount);
                        if (!peerOfActiveAccount.name.includes(autonomyName)) {
                            yield this.clearActiveAccount();
                        }
                    }
                    this.requestPermissionsWrapped().then(() => {
                        resolve(1);
                    });
                    container.remove();
                }));
                this.otherClickPromise(frame).then(r => {
                    console.log("opt2");
                    resolve(2);
                    container.remove();
                });
            };
        });
    }
    auClickPromise(frame) {
        return new Promise((resolve) => {
            var _a;
            const auBtn = (_a = frame.contentDocument) === null || _a === void 0 ? void 0 : _a.querySelector('#autonomy-wallet-btn');
            auBtn === null || auBtn === void 0 ? void 0 : auBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                resolve();
            }));
        });
    }
    otherClickPromise(frame) {
        return new Promise((resolve) => {
            var _a;
            const otherBtn = (_a = frame.contentDocument) === null || _a === void 0 ? void 0 : _a.querySelector('#other-wallet-btn');
            otherBtn === null || otherBtn === void 0 ? void 0 : otherBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                resolve();
            }));
        });
    }
    instantiateIframe() {
        const wrapperIframe = document.createElement('iframe');
        wrapperIframe.src = __dirname + '/templates/pop-up-login.html';
        wrapperIframe.style.border = 'none';
        wrapperIframe.style.width = '100%';
        wrapperIframe.style.height = '100%';
        wrapperIframe.style.position = 'fixed';
        wrapperIframe.style.background = 'rgba(2, 0, 1, 0.7)';
        wrapperIframe.style.left = '0';
        wrapperIframe.style.top = '0';
        return wrapperIframe;
    }
}
exports.AuBeaconWrapper = AuBeaconWrapper;
//# sourceMappingURL=main.js.map