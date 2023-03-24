import { DAppClientOptions, RequestPermissionInput } from "@airgap/beacon-sdk";
import { LoginType } from "./const/login-type";
import { DAppClientWrapped } from "./features-wrapped/DappClientWrapped";

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
export class AuBeaconWrapper extends DAppClientWrapped {
  title: string;
  constructor(
    title: string,
    config: DAppClientOptions
  ) {
    super(config);
    this.title = title;
  }
  /**
   *
   * Call a pop-up to connect. Return a number preferred to an option.
   * @param {RequestPermissionInput} input Input for instantiate DappClient
   * @returns {LoginType} Autonomy: 0, Other wallets: 1.
   */
  public async showConnect(input?: RequestPermissionInput): Promise<number> {
    try {
      const container = document.createElement('div');
      container.id = 'beacon-button-container';
      document.body.appendChild(container);
      const wrapperIframe = this.instantiateIframe();
      wrapperIframe.addEventListener('load', () => {
        const siteNameElement = wrapperIframe.contentDocument?.querySelector('.site-name');
        if (siteNameElement) {
            siteNameElement.textContent = this.title;
        }
      });
      container.appendChild(wrapperIframe);
      return this.frameLoadPromise(wrapperIframe, container, input);
    } catch (e) {
      throw e;
    }
  }

  private frameLoadPromise(frame: HTMLIFrameElement, container: HTMLDivElement, input?: RequestPermissionInput): Promise<number> {
    return new Promise<number>((resolve) => {
      frame.onload = () => {
        this.auClickPromise(frame).then(async r => {
          await this.prepareBeforeAutonomyRequestPermission();
          this.requestPermissions(input, true).then(() => {
            resolve(LoginType.Autonomy);
          })
          container.remove();
        })
        this.otherClickPromise(frame).then(r => {
          this.requestPermissions(input).then(() => {
            resolve(LoginType.OtherWallets);
          })
          container.remove();
        })
      };
    });
  }

  private auClickPromise(frame: HTMLIFrameElement): Promise<void> {
    return new Promise<void>((resolve) => {
      const auBtn = frame.contentDocument?.querySelector('#autonomy-wallet-btn');
      auBtn?.addEventListener('click', async () => {
        resolve();
      });
    });
  }

  private otherClickPromise(frame: HTMLIFrameElement): Promise<void> {
    return new Promise<void>((resolve) => {
      const otherBtn = frame.contentDocument?.querySelector('#other-wallet-btn');
      otherBtn?.addEventListener('click', async () => {
        resolve();
      });
    });
  }

  private instantiateIframe(): HTMLIFrameElement {
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