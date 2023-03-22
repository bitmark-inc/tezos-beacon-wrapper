import { DAppClientOptions } from "@airgap/beacon-sdk";
import { DAppClientWrapped } from "./DappClientWrapped";

export class AuBeaconWrapper extends DAppClientWrapped {
  title: string;
  constructor(
    /**
    * @param title name of the project, it will be appeared on the title.
    */
    /** @type {string} */
    title: string,
    config: DAppClientOptions
  ) {
    super(config);
    this.title = title;
  }
  public showConnect(): Promise<number> {
    try {
      const container = document.createElement('div');
      container.id = 'beacon-button-container';
      document.body.appendChild(container);
      const wrapperIframe = this.instantiateIframe();
      container.appendChild(wrapperIframe);
      return this.frameLoadPromise(wrapperIframe, container);
    } catch (e) {
      throw e;
    }
  }

  private frameLoadPromise(frame: HTMLIFrameElement, container: HTMLDivElement): Promise<number> {
    return new Promise<number>((resolve) => {
      frame.onload = () => {
        this.auClickPromise(frame).then(async r => {
          console.log("Autonomy.");
          await this.prepareBeforeAutonomyRequestPermission();
          this.requestPermissions({}, true).then(() => {
            resolve(1);
          })
          container.remove();
        })

        this.otherClickPromise(frame).then(r => {
          console.log("Original Beacon.");
          this.requestPermissions().then(() => {
            resolve(2);
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