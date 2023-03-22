"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preparePairingAlert = void 0;
const beacon_sdk_1 = require("@airgap/beacon-sdk");
const Pairing_1 = require("@airgap/beacon-ui/dist/cjs/ui/alert/Pairing");
const html_elements_1 = require("@airgap/beacon-ui/dist/cjs/utils/html-elements");
const platform_1 = require("@airgap/beacon-ui/dist/cjs/utils/platform");
const get_tzip10_link_1 = require("@airgap/beacon-ui/dist/cjs/utils/get-tzip10-link");
const qr_1 = require("@airgap/beacon-ui/dist/cjs/utils/qr");
const logger = new beacon_sdk_1.Logger('Alert');
const serializer = new beacon_sdk_1.Serializer();
const preparePairingAlert = (id, shadowRoot, pairingPayload) => __awaiter(void 0, void 0, void 0, function* () {
    const getInfo = () => __awaiter(void 0, void 0, void 0, function* () {
        return Pairing_1.Pairing.getPairingInfo(pairingPayload, (_walletType, _wallet, keepOpen) => __awaiter(void 0, void 0, void 0, function* () {
            if (keepOpen) {
                return;
            }
            yield (0, beacon_sdk_1.closeAlerts)();
        }), () => __awaiter(void 0, void 0, void 0, function* () {
            switchPlatform();
        }));
    });
    const info = yield getInfo();
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
    //   showWalletLists(info.walletLists)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageFn = (event) => __awaiter(void 0, void 0, void 0, function* () {
        if (event.data === 'extensionsUpdated') {
            const newInfo = yield getInfo();
            //   showWalletLists(newInfo.walletLists)
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
    if (switchButton) {
        switchButton.remove();
    }
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
        if (mainText && walletList && copyButton && qr && titleEl) {
            mainText.style.display = 'none';
            titleEl.style.textAlign = 'center';
            walletList.style.display = 'none';
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
                    break;
                default:
                    if (!qrShown) {
                        // If we have previously triggered the load, do not load it again (this can lead to multiple QRs being added if "pairingPayload.p2pSyncCode()" is slow)
                        qrShown = true;
                        const code = yield serializer.serialize(yield pairingPayload.p2pSyncCode());
                        const uri = (0, get_tzip10_link_1.getTzip10Link)('autonomy-tezos://', code);
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
    const autonomyWalletKey = 'autonomy-app';
    yield info.walletLists.filter(walletList => walletList.type === "ios")[0].wallets.filter(wallet => wallet.key === autonomyWalletKey)[0].clickHandler();
});
exports.preparePairingAlert = preparePairingAlert;
//# sourceMappingURL=PairingAlertWrapped.js.map