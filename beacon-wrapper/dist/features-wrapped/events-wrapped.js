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
exports.BeaconEventHandlerWrapped = void 0;
const AlertWrapped_1 = require("./AlertWrapped");
const beacon_sdk_1 = require("@airgap/beacon-sdk");
const logger = new beacon_sdk_1.Logger('BeaconEvents');
class BeaconEventHandlerWrapped extends beacon_sdk_1.BeaconEventHandler {
    constructor() {
        super(...arguments);
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
exports.BeaconEventHandlerWrapped = BeaconEventHandlerWrapped;
const showPairAlertWrapped = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const alertConfig = {
        title: 'Autonomy wallet',
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
    yield (0, AlertWrapped_1.openAlertWrapped)(alertConfig);
});
//# sourceMappingURL=events-wrapped.js.map