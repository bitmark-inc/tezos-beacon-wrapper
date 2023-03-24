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
exports.AuBeaconWrapper = void 0;
const login_type_1 = require("./const/login-type");
const DappClientWrapped_1 = require("./features-wrapped/DappClientWrapped");
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
class AuBeaconWrapper extends DappClientWrapped_1.DAppClientWrapped {
    constructor(title, config) {
        super(config);
        this.title = title;
    }
    /**
     *
     * Call a pop-up to connect. Return a number preferred to an option.
     * @param {RequestPermissionInput} input Input for instantiate DappClient
     * @returns {LoginType} Autonomy: 0, Other wallets: 1.
     */
    showConnect(input) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const container = document.createElement('div');
                container.id = 'beacon-button-container';
                document.body.appendChild(container);
                const wrapperIframe = this.instantiateIframe();
                wrapperIframe.addEventListener('load', () => {
                    var _a;
                    const siteNameElement = (_a = wrapperIframe.contentDocument) === null || _a === void 0 ? void 0 : _a.querySelector('.site-name');
                    if (siteNameElement) {
                        siteNameElement.textContent = this.title;
                    }
                });
                container.appendChild(wrapperIframe);
                return this.frameLoadPromise(wrapperIframe, container, input);
            }
            catch (e) {
                throw e;
            }
        });
    }
    frameLoadPromise(frame, container, input) {
        return new Promise((resolve) => {
            frame.onload = () => {
                this.auClickPromise(frame).then((r) => __awaiter(this, void 0, void 0, function* () {
                    yield this.prepareBeforeAutonomyRequestPermission();
                    this.requestPermissions(input, true).then(() => {
                        resolve(login_type_1.LoginType.Autonomy);
                    });
                    container.remove();
                }));
                this.otherClickPromise(frame).then(r => {
                    this.requestPermissions(input).then(() => {
                        resolve(login_type_1.LoginType.OtherWallets);
                    });
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