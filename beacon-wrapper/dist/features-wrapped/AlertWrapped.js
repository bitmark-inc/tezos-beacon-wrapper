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
exports.openAlertWrapped = void 0;
const html_elements_1 = require("@airgap/beacon-ui/dist/cjs/utils/html-elements");
const templates_1 = require("@airgap/beacon-ui/dist/cjs/utils/templates");
const alert_templates_1 = require("@airgap/beacon-ui/dist/cjs/ui/alert/alert-templates");
const Alert_1 = require("@airgap/beacon-ui/dist/cjs/ui/alert/Alert");
const PairingAlertWrapped_1 = require("./PairingAlertWrapped");
const beacon_sdk_1 = require("@airgap/beacon-sdk");
const timeout = {};
let lastFocusedElement;
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
/**
 * Show an alert
 *
 * @param alertConfig The configuration of the alert
 */
// eslint-disable-next-line complexity
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
    yield (0, beacon_sdk_1.closeAlerts)();
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
            yield (0, Alert_1.closeAlert)(id);
        }), timer);
    }
    document.body.prepend(shadowRootEl);
    const closeButton = shadowRoot.getElementById(`beacon-alert-${id}-close`);
    const closeButtonClick = () => __awaiter(void 0, void 0, void 0, function* () {
        if (closeButtonCallback) {
            closeButtonCallback();
        }
        yield (0, Alert_1.closeAlert)(id);
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
                yield (0, Alert_1.closeAlert)(id);
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
        yield (0, PairingAlertWrapped_1.preparePairingAlert)(id, shadowRoot, pairingPayload);
    }
    return id;
});
exports.openAlertWrapped = openAlertWrapped;
//# sourceMappingURL=AlertWrapped.js.map