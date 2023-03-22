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
const DappClientWrapped_1 = require("./DappClientWrapped");
class AuBeaconWrapper extends DappClientWrapped_1.DAppClientWrapped {
    constructor(
    /**
    * @param title name of the project, it will be appeared on the title.
    */
    /** @type {string} */
    title, config) {
        super(config);
        this.title = title;
    }
    showConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const container = document.createElement('div');
                container.id = 'beacon-button-container';
                document.body.appendChild(container);
                const wrapperIframe = this.instantiateIframe();
                wrapperIframe.addEventListener('load', () => {
                    var _a;
                    console.log(wrapperIframe.contentDocument);
                    const siteNameElement = (_a = wrapperIframe.contentDocument) === null || _a === void 0 ? void 0 : _a.querySelector('.site-name');
                    if (siteNameElement) {
                        siteNameElement.textContent = this.title;
                    }
                });
                container.appendChild(wrapperIframe);
                return this.frameLoadPromise(wrapperIframe, container);
            }
            catch (e) {
                throw e;
            }
        });
    }
    frameLoadPromise(frame, container) {
        return new Promise((resolve) => {
            frame.onload = () => {
                this.auClickPromise(frame).then((r) => __awaiter(this, void 0, void 0, function* () {
                    console.log("Autonomy.");
                    yield this.prepareBeforeAutonomyRequestPermission();
                    this.requestPermissions({}, true).then(() => {
                        resolve(1);
                    });
                    container.remove();
                }));
                this.otherClickPromise(frame).then(r => {
                    console.log("Original Beacon.");
                    this.requestPermissions().then(() => {
                        resolve(2);
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