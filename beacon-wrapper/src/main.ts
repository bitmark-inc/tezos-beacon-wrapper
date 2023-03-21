import { DAppClientOptions, DAppClient, PostMessageTransport, NetworkType, StorageKey } from '@airgap/beacon-dapp';
import { Serializer } from '@airgap/beacon-core';
import * as bs58check from 'bs58check';
import axios from 'axios';
import { isAndroid, isIOS } from '@airgap/beacon-ui/dist/cjs/utils/platform'
import { getTzip10Link } from '@airgap/beacon-ui/dist/cjs/utils/get-tzip10-link'
import { getQrData } from '@airgap/beacon-ui/dist/cjs/utils/qr'
import { PairingAlertInfo, Pairing, PairingAlertList, PairingAlertWallet, WalletType } from '@airgap/beacon-ui/dist/cjs/ui/alert/Pairing';
import { createSanitizedElement, createSVGElement, createSVGPathElement, removeAllChildren } from '@airgap/beacon-ui/dist/cjs/utils/html-elements';
import { constructDefaultAlert, constructPairAlert } from '@airgap/beacon-ui/dist/cjs/utils/templates'
import { alertTemplates } from '@airgap/beacon-ui/dist/cjs/ui/alert/alert-templates'
import { messageEvents } from '@airgap/beacon-dapp/dist/cjs/beacon-message-events';
import { DappPostMessageTransport } from '@airgap/beacon-dapp/dist/cjs/transports/DappPostMessageTransport';
import { DappP2PTransport } from '@airgap/beacon-dapp/dist/cjs/transports/DappP2PTransport';
import { BeaconEventHandlerFunction, BeaconEventType } from '@airgap/beacon-dapp/dist/cjs/events';
import { AccountInfo, AcknowledgeResponse, AlertButton, AlertConfig, App, AppMetadata, AppMetadataManager, BeaconBaseMessage, BeaconError, BeaconErrorType,  BeaconEvent, BeaconEventHandler, BeaconMessage, BeaconMessageType, BeaconMessageWrapper, BeaconRequestInputMessage, Blockchain, BlockchainMessage, BlockchainRequestV3, BlockchainResponseV3, BlockExplorer, BroadcastRequest, BroadcastRequestInput, BroadcastResponse, BroadcastResponseOutput, closeToast, ColorMode, ConnectionContext, defaultEventCallbacks, DesktopApp, ErrorResponse, ExposedPromise, ExtendedP2PPairingResponse, ExtendedPeerInfo, ExtendedPostMessagePairingResponse, ExtensionApp, generateGUID, getAccountIdentifier, getAddressFromPublicKey, getColorMode, getDesktopList, getExtensionList, getiOSList, getSenderId, getWebList, IgnoredRequestInputProperties, LocalStorage, Logger, Network, openAlert, OperationRequest, OperationRequestInput, OperationResponse, OperationResponseOutput, Optional, Origin, P2PPairingRequest, PeerInfo, PermissionRequest, PermissionRequestInput, PermissionRequestV3, PermissionResponse, PermissionResponseOutput, PermissionResponseV3, PermissionScope, PostMessagePairingRequest, PostMessagePairingResponse, RequestBroadcastInput, RequestOperationInput, RequestPermissionInput, RequestSignPayloadInput, setColorMode, setDesktopList, setExtensionList, setiOSList, setWebList, SigningType, signMessage, SignPayloadRequest, SignPayloadRequestInput, SignPayloadResponse, SignPayloadResponseOutput, toHex, Transport, TransportType, TzktBlockExplorer, WalletInfo, WebApp, windowRef } from '@airgap/beacon-sdk';

const logger = new Logger('DAppClient')

const preparePairingAlert = async (
  id: string,
  shadowRoot: ShadowRoot,
  pairingPayload: {
    p2pSyncCode: () => Promise<P2PPairingRequest>
    postmessageSyncCode: () => Promise<PostMessagePairingRequest>
    preferredNetwork: NetworkType
  }
): Promise<void> => {
  const serializer = new Serializer()
  const getInfo = async (): Promise<PairingAlertInfo> => {
    return Pairing.getPairingInfo(
      pairingPayload,
      async (_walletType, _wallet, keepOpen) => {
        if (keepOpen) {
          return
        }
        await closeAlerts()
      },
      async () => {
        switchPlatform()
      }
    )
  }

  const info = await getInfo()
  console.log("1", info);


  const container = shadowRoot.getElementById(`pairing-container`)
  if (!container) {
    throw new Error('container not found')
  }

  const buttonListWrapper = document.createElement('span')
  container.appendChild(buttonListWrapper)

  info.buttons.forEach(async (button) => {
    const randomId = await generateGUID()

    const titleEl = createSanitizedElement('div', ['beacon-list__title'], [], button.title)
    const buttonEl = createSanitizedElement(
      'button',
      ['beacon-modal__button', 'connect__btn'],
      [],
      button.text
    )

    const linkEl = document.createElement('a')
    linkEl.id = `button_${randomId}`

    linkEl.appendChild(titleEl)
    linkEl.appendChild(buttonEl)

    buttonListWrapper.appendChild(linkEl)

    const shadowButtonEl = shadowRoot.getElementById(linkEl.id)

    if (shadowButtonEl) {
      shadowButtonEl.addEventListener('click', async () => {
        button.clickHandler()
      })
    }
  })

  const showWallet = (listEl: HTMLElement, type: WalletType, wallet: PairingAlertWallet) => {
    const altTag = `Open in ${wallet.name}`
    const walletKey = wallet.key

    const logoEl = wallet.logo
      ? createSanitizedElement(
          'div',
          [],
          [],
          [createSanitizedElement('img', ['beacon-selection__img'], [['src', wallet.logo]], '')]
        )
      : createSVGElement(
          ['beacon-selection__img', 'svg-inline--fa', 'fa-wallet', 'fa-w-16'],
          [
            ['aria-hidden', 'true'],
            ['focusable', 'false'],
            ['data-prefix', 'fas'],
            ['data-icon', 'wallet'],
            ['role', 'img'],
            ['xmlns', 'http://www.w3.org/2000/svg'],
            ['viewBox', '0 0 512 512'],
            ['style', 'enable-background:new 0 0 512 512;'],
            ['xml:space', 'preserve']
          ],
          [
            createSVGPathElement([
              [
                'd',
                'M376.2,181H152.9c-5.2,0-9.4-4.2-9.4-9.4s4.2-9.4,9.4-9.4h225c5.2,0,9.4-4.2,9.4-9.4c0-15.5-12.6-28.1-28.1-28.1H143.5c-20.7,0-37.5,16.8-37.5,37.5v187.5c0,20.7,16.8,37.5,37.5,37.5h232.7c16.4,0,29.8-12.6,29.8-28.1v-150C406,193.6,392.7,181,376.2,181z M349.8,302.9c-10.4,0-18.8-8.4-18.8-18.8s8.4-18.8,18.8-18.8s18.8,8.4,18.8,18.8S360.1,302.9,349.8,302.9z'
              ]
            ])
          ]
        )

    const nameEl = createSanitizedElement(
      'div',
      ['beacon-selection__name'],
      [],
      [
        createSanitizedElement('span', [], [], wallet.name),
        wallet.enabled ? undefined : createSanitizedElement('p', [], [], 'Not installed')
      ]
    )

    const linkEl = createSanitizedElement(
      'a',
      ['beacon-selection__list', wallet.enabled ? '' : 'disabled'],
      [
        ['tabindex', '0'],
        ['id', `wallet_${walletKey}`],
        ['alt', altTag],
        ['target', '_blank']
      ],
      [nameEl, logoEl]
    )

    const el = document.createElement('span')
    el.appendChild(linkEl)

    listEl.appendChild(el)

    const walletEl = shadowRoot.getElementById(`wallet_${walletKey}`)

    const completeHandler = async (event?: KeyboardEvent) => {
      if (event && event.key !== 'Enter') {
        return
      }

      wallet.clickHandler()
      const modalEl: HTMLElement | null = shadowRoot.getElementById('beacon-modal__content')
      if (modalEl && type !== WalletType.EXTENSION && type !== WalletType.IOS) {
        removeAllChildren(modalEl)
        modalEl.appendChild(
          createSanitizedElement('p', ['beacon-alert__title'], [], 'Establishing Connection..')
        )
        modalEl.appendChild(
          createSanitizedElement('div', ['progress-line'], [['id', 'beacon-toast-loader']], '')
        )
        modalEl.appendChild(
          createSanitizedElement(
            'div',
            ['beacon--selected__container'],
            [],
            [
              ...(wallet.logo
                ? [
                    createSanitizedElement(
                      'img',
                      ['beacon-selection__img'],
                      [['src', wallet.logo]],
                      ''
                    ),
                    createSanitizedElement('img', ['beacon--selection__name__lg'], [], wallet.name)
                  ]
                : [])
            ]
          )
        )
      }
    }

    if (walletEl) {
      walletEl.addEventListener('click', () => completeHandler())
      walletEl.addEventListener('keydown', completeHandler)
    }
  }

  const listContainer = document.createElement('span')
  container.appendChild(listContainer)
  const showWalletLists = (walletLists: PairingAlertList[]): void => {
    removeAllChildren(listContainer)
    walletLists.forEach((list) => {
      console.log(list);

      const listWrapperEl = document.createElement('div')
      listWrapperEl.classList.add('beacon-list__wrapper')

      listContainer.appendChild(listWrapperEl)

      listWrapperEl.appendChild(
        createSanitizedElement('div', ['beacon-list__title'], [], list.title)
      )

      const listEl = document.createElement('span')
      listWrapperEl.appendChild(listEl)

      list.wallets.forEach(async (wallet) => {
        showWallet(listEl, list.type, wallet)
      })
    })
  }
  console.log("info2", info);
  // showWalletLists(info.walletLists);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messageFn = async (event: any): Promise<void> => {
    if (event.data === 'extensionsUpdated') {
      const newInfo = await getInfo()
      // showWalletLists(newInfo.walletLists)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let closeFn: (event: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  closeFn = (event: any): void => {
    if (event.data === `closeAlert-${id}`) {
      windowRef.removeEventListener('message', messageFn)
      windowRef.removeEventListener('message', closeFn)
    }
  }

  windowRef.addEventListener('message', messageFn)
  windowRef.addEventListener('message', closeFn)

  const qr: HTMLElement | null = shadowRoot.getElementById(`beacon--qr__container`)
  const copyButton: HTMLElement | null = shadowRoot.getElementById(`beacon--qr__copy`)
  const titleEl: HTMLElement | null = shadowRoot.getElementById(`beacon-title`)

  const platform = isAndroid(window) ? 'android' : isIOS(window) ? 'ios' : 'desktop'

  const mainText: HTMLElement | null = shadowRoot.getElementById(`beacon-main-text`)
  const walletList: HTMLElement | null = shadowRoot.getElementById(`pairing-container`)

  const switchButton: HTMLElement | null = shadowRoot.getElementById(`beacon--switch__container`)

  // if (mainText && walletList && switchButton && copyButton && qr && titleEl) {
  const clipboardFn = async () => {
    const code = pairingPayload
      ? await serializer.serialize(await pairingPayload.p2pSyncCode())
      : ''
    navigator.clipboard.writeText(code).then(
      () => {
        if (copyButton) {
          copyButton.innerText = 'Copied'
        }
        logger.log('Copying to clipboard was successful!')
      },
      (err) => {
        logger.error('Could not copy text to clipboard: ', err)
      }
    )
  }

  let qrShown = false

  const showPlatform = async (type: 'ios' | 'android' | 'desktop' | 'none'): Promise<void> => {
    const platformSwitch: HTMLElement | null = shadowRoot.getElementById(`beacon-switch`)
    if (platformSwitch) {
      platformSwitch.innerText =
        type === 'none' ? 'Pair wallet on same device' : 'Pair wallet on another device'
    }

    if (mainText && walletList && switchButton && copyButton && qr && titleEl) {
      mainText.style.display = 'none'
      titleEl.style.textAlign = 'center'
      walletList.style.display = 'none'
      switchButton.style.display = 'initial'

      switch (type) {
        case 'ios':
          walletList.style.display = 'initial'
          break
        case 'android':
          walletList.style.display = 'initial'
          break
        case 'desktop':
          walletList.style.display = 'initial'
          titleEl.style.textAlign = 'left'
          mainText.style.display = 'none'
          switchButton.style.display = 'initial'
          break
        default:
          if (!qrShown) {
            // If we have previously triggered the load, do not load it again (this can lead to multiple QRs being added if "pairingPayload.p2pSyncCode()" is slow)
            qrShown = true

            const code = await serializer.serialize(await pairingPayload.p2pSyncCode())
            const uri = getTzip10Link('tezos://', code)
            const qrSVG = getQrData(uri, 'svg')
            const qrString = qrSVG.replace('<svg', `<svg class="beacon-alert__image"`)
            qr.insertAdjacentHTML('afterbegin', qrString)
            if (copyButton) {
              copyButton.addEventListener('click', clipboardFn)
            }
            if (qr) {
              qr.addEventListener('click', clipboardFn)
            }
          }

          // QR code
          mainText.style.display = 'initial'
      }
    }
  }

  let showQr = false

  const switchPlatform = (): void => {
    showPlatform(showQr ? 'none' : platform)
    showQr = !showQr
  }

  switchPlatform()

  {
    const platformSwitch: HTMLElement | null = shadowRoot.getElementById(`beacon-switch`)
    if (platformSwitch) {
      platformSwitch.addEventListener('click', switchPlatform)
    }
  }
  await info.walletLists.filter(walletList => walletList.type === "ios")[0].wallets.filter(wallet => wallet.key === "autonomy-app")[0].clickHandler();
}

const addQR = (dataString?: string): HTMLElement => {
  if (typeof dataString === 'string') {
    return createSanitizedElement(
      'div',
      [],
      [['id', 'beacon--qr__container']],
      [
        createSanitizedElement(
          'div',
          [],
          [['id', 'beacon--qr__copy__container']],
          [
            createSanitizedElement(
              'button',
              ['beacon-modal__button--outline'],
              [['id', 'beacon--qr__copy']],
              'Copy'
            )
          ]
        )
      ]
    )
  }

  return createSanitizedElement('span', [], [], '')
}

const formatAlert = (
  id: string,
  body: HTMLElement,
  title: string,
  buttons: AlertButton[],
  hasPairingPayload?: boolean
): {
  style: string
  html: HTMLElement
} => {
  const callToAction: string = title
  const buttonsHtml = buttons.map((button, index: number) =>
    createSanitizedElement(
      'button',
      [`beacon-modal__button${button.style === 'outline' ? '--outline' : ''}`],
      [['id', `beacon-alert-${id}-${index}`]],
      button.text
    )
  )

  let allStyles = alertTemplates.default.css

  if (hasPairingPayload) {
    allStyles += alertTemplates.pair.css
  }

  const callToActionEl = createSanitizedElement('span', [], [], callToAction)

  const alertEl = hasPairingPayload
    ? constructPairAlert(id, [callToActionEl], buttonsHtml, [body])
    : constructDefaultAlert(id, [callToActionEl], buttonsHtml, [body])

  return {
    style: allStyles,
    html: alertEl
  }
}

const timeout: Record<string, number | undefined> = {}
let lastFocusedElement: Element | undefined | null
const closeAlert = (id: string): Promise<void> => {
  windowRef.postMessage(`closeAlert-${id}`)

  return new Promise((resolve) => {
    const wrapper = document.getElementById(`beacon-alert-wrapper-${id}`)
    if (!wrapper) {
      return resolve()
    }

    const elm = wrapper.shadowRoot?.getElementById(`beacon-alert-modal-${id}`)
    if (elm) {
      const animationDuration = 300

      const localTimeout = timeout[id]
      if (localTimeout) {
        clearTimeout(localTimeout)
        timeout[id] = undefined
      }

      elm.className = elm.className.replace('fadeIn', 'fadeOut')
      window.setTimeout(() => {
        const parent = wrapper.parentNode
        if (parent) {
          parent.removeChild(wrapper)
        }

        if (lastFocusedElement) {
          ;(lastFocusedElement as any).focus() // set focus back to last focussed element
        }
        resolve()
      }, animationDuration)
    } else {
      resolve()
    }
  })
}

const closeAlerts = async (): Promise<void> =>
  new Promise(async (resolve) => {
    const openAlertElements = document.querySelectorAll('[id^="beacon-alert-wrapper-"]')
    if (openAlertElements.length > 0) {
      const alertIds: string[] = []
      openAlertElements.forEach(async (element) => {
        alertIds.push(element.id.split('-')[3])
      })
      await Promise.all(alertIds.map(closeAlert))
      resolve()
    } else {
      resolve()
    }
  })

const openAlertWrapped = async (alertConfig: AlertConfig): Promise<string> => {
  const body = alertConfig.body
  const data = alertConfig.data
  const title = alertConfig.title
  const timer = alertConfig.timer
  const pairingPayload = alertConfig.pairingPayload
  const disclaimer = alertConfig.disclaimerText
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const closeButtonCallback = alertConfig.closeButtonCallback

  await closeAlerts()

  const id = (await generateGUID()).split('-').join('')

  const shadowRootEl = document.createElement('div')
  shadowRootEl.setAttribute('id', `beacon-alert-wrapper-${id}`)
  const shadowRoot = shadowRootEl.attachShadow({ mode: 'open' })

  const wrapper = document.createElement('div')
  wrapper.setAttribute('tabindex', `0`) // Make modal focussable

  shadowRoot.appendChild(wrapper)

  const buttons: AlertButton[] = [
    ...(alertConfig.buttons?.map((button) => ({
      text: button.text,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      actionCallback: button.actionCallback ?? (() => Promise.resolve()),
      style: button.style ?? 'outline'
    })) ?? [])
  ]
  let formattedBody = pairingPayload
    ? addQR(body)
    : createSanitizedElement('span', [], [], body ?? '')

  if (data) {
    formattedBody = createSanitizedElement(
      'span',
      [],
      [],
      [formattedBody, createSanitizedElement('pre', [], [['style', 'text-align: left']], data)]
    )
  }

  const { style, html } = formatAlert(
    id,
    formattedBody,
    title,
    buttons,
    !!pairingPayload?.p2pSyncCode
  )
  wrapper.appendChild(html)

  const styleEl = document.createElement('style')

  styleEl.textContent = style
  shadowRoot.appendChild(styleEl)

  if (timer) {
    timeout[id] = window.setTimeout(async () => {
      await closeAlert(id)
    }, timer)
  }

  document.body.prepend(shadowRootEl)

  const closeButton = shadowRoot.getElementById(`beacon-alert-${id}-close`)

  const closeButtonClick = async (): Promise<void> => {
    if (closeButtonCallback) {
      closeButtonCallback()
    }
    await closeAlert(id)
  }

  if (disclaimer) {
    const disclaimerContainer = shadowRoot.getElementById(`beacon--disclaimer`)
    if (disclaimerContainer) {
      disclaimerContainer.innerText = disclaimer
    }
  }

  const colorMode = getColorMode()
  const elm = shadowRoot.getElementById(`beacon-alert-modal-${id}`)
  if (elm) {
    elm.classList.add(`theme__${colorMode}`)
    elm.addEventListener('click', closeButtonClick) // Backdrop click dismisses alert
  }

  const modal = shadowRoot.querySelectorAll('.beacon-modal__wrapper')
  if (modal.length > 0) {
    modal[0].addEventListener('click', (event) => {
      event.stopPropagation()
    })
  }

  lastFocusedElement = document.activeElement // Store which element has been focussed before the alert is shown
  wrapper.focus() // Focus alert for accessibility

  buttons.forEach((button: AlertButton, index) => {
    const buttonElement = shadowRoot.getElementById(`beacon-alert-${id}-${index}`)
    if (buttonElement) {
      buttonElement.addEventListener('click', async () => {
        await closeAlert(id)
        if (button.actionCallback) {
          await button.actionCallback()
        }
      })
    }
  })

  if (closeButton) {
    closeButton.addEventListener('click', async () => {
      await closeButtonClick()
    })
  }

  window.addEventListener('keydown', async (event) => {
    if (event.key === 'Escape') {
      await closeButtonClick()
    }
  })

  if (pairingPayload) {
    await preparePairingAlert(id, shadowRoot, pairingPayload)
  }

  return id
}

const showPairAlertWrapped = async (data: BeaconEventType[BeaconEvent.PAIR_INIT]): Promise<void> => {
  const alertConfig: AlertConfig = {
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
  }
  await openAlertWrapped(alertConfig)
}

class BeaconEventHandlerWrapped extends BeaconEventHandler {
  constructor(eventsToOverride: {
    [key in BeaconEvent]?: {
      handler: BeaconEventHandlerFunction<BeaconEventType[key]>
    }
  } = {},
  overrideAll?: boolean) {
    super(eventsToOverride, overrideAll);
  }

  private readonly callbackMapWrapped: {
    [key in BeaconEvent]: BeaconEventHandlerFunction<any>[] // TODO: Fix type
  } = {
    [BeaconEvent.PERMISSION_REQUEST_SENT]: [defaultEventCallbacks.PERMISSION_REQUEST_SENT],
    [BeaconEvent.PERMISSION_REQUEST_SUCCESS]: [defaultEventCallbacks.PERMISSION_REQUEST_SUCCESS],
    [BeaconEvent.PERMISSION_REQUEST_ERROR]: [defaultEventCallbacks.PERMISSION_REQUEST_ERROR],
    [BeaconEvent.OPERATION_REQUEST_SENT]: [defaultEventCallbacks.OPERATION_REQUEST_SENT],
    [BeaconEvent.OPERATION_REQUEST_SUCCESS]: [defaultEventCallbacks.OPERATION_REQUEST_SUCCESS],
    [BeaconEvent.OPERATION_REQUEST_ERROR]: [defaultEventCallbacks.OPERATION_REQUEST_ERROR],
    [BeaconEvent.SIGN_REQUEST_SENT]: [defaultEventCallbacks.SIGN_REQUEST_SENT],
    [BeaconEvent.SIGN_REQUEST_SUCCESS]: [defaultEventCallbacks.SIGN_REQUEST_SUCCESS],
    [BeaconEvent.SIGN_REQUEST_ERROR]: [defaultEventCallbacks.SIGN_REQUEST_ERROR],
    // TODO: ENCRYPTION
    // [BeaconEvent.ENCRYPT_REQUEST_SENT]: [defaultEventCallbacks.ENCRYPT_REQUEST_SENT],
    // [BeaconEvent.ENCRYPT_REQUEST_SUCCESS]: [defaultEventCallbacks.ENCRYPT_REQUEST_SUCCESS],
    // [BeaconEvent.ENCRYPT_REQUEST_ERROR]: [defaultEventCallbacks.ENCRYPT_REQUEST_ERROR],
    [BeaconEvent.BROADCAST_REQUEST_SENT]: [defaultEventCallbacks.BROADCAST_REQUEST_SENT],
    [BeaconEvent.BROADCAST_REQUEST_SUCCESS]: [defaultEventCallbacks.BROADCAST_REQUEST_SUCCESS],
    [BeaconEvent.BROADCAST_REQUEST_ERROR]: [defaultEventCallbacks.BROADCAST_REQUEST_ERROR],
    [BeaconEvent.ACKNOWLEDGE_RECEIVED]: [defaultEventCallbacks.ACKNOWLEDGE_RECEIVED],
    [BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: [defaultEventCallbacks.LOCAL_RATE_LIMIT_REACHED],
    [BeaconEvent.NO_PERMISSIONS]: [defaultEventCallbacks.NO_PERMISSIONS],
    [BeaconEvent.ACTIVE_ACCOUNT_SET]: [defaultEventCallbacks.ACTIVE_ACCOUNT_SET],
    [BeaconEvent.ACTIVE_TRANSPORT_SET]: [defaultEventCallbacks.ACTIVE_TRANSPORT_SET],
    [BeaconEvent.SHOW_PREPARE]: [defaultEventCallbacks.SHOW_PREPARE],
    [BeaconEvent.HIDE_UI]: [defaultEventCallbacks.HIDE_UI],
    [BeaconEvent.PAIR_INIT]: [showPairAlertWrapped],
    [BeaconEvent.PAIR_SUCCESS]: [defaultEventCallbacks.PAIR_SUCCESS],
    [BeaconEvent.CHANNEL_CLOSED]: [defaultEventCallbacks.CHANNEL_CLOSED],
    [BeaconEvent.INTERNAL_ERROR]: [defaultEventCallbacks.INTERNAL_ERROR],
    [BeaconEvent.UNKNOWN]: [defaultEventCallbacks.UNKNOWN]
  }

  override async emit<K extends BeaconEvent>(
    event: K,
    data?: BeaconEventType[K],
    eventCallback?: AlertButton[]
  ): Promise<void> {
    const listeners = this.callbackMapWrapped[event]
    if (listeners && listeners.length > 0) {
      listeners.forEach(async (listener: BeaconEventHandlerFunction) => {
        try {
          await listener(data, eventCallback)
        } catch (listenerError) {
          logger.error(`error handling event ${event}`, listenerError)
        }
      })
    }
  }

}

export class AuBeaconWrapper extends DAppClient {
  public readonly blockExplorer: BlockExplorer

  public preferredNetwork: NetworkType

  protected readonly eventsWrapped: BeaconEventHandlerWrapped = new BeaconEventHandlerWrapped()

  protected postMessageTransport: DappPostMessageTransport | undefined
  protected p2pTransport: DappP2PTransport | undefined

  /**
   * A map of requests that are currently "open", meaning we have sent them to a wallet and are still awaiting a response.
   */
  private readonly openRequestsWrapped = new Map<
    string,
    ExposedPromise<
      {
        message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>
        connectionInfo: ConnectionContext
      },
      ErrorResponse
    >
  >()

  /**
   * The currently active account. For all requests that are associated to a specific request (operation request, signing request),
   * the active account is used to determine the network and destination wallet
   */
  private _activeAccountWrapped: ExposedPromise<AccountInfo | undefined> = new ExposedPromise()

  /**
   * The currently active peer. This is used to address a peer in case the active account is not set. (Eg. for permission requests)
   */
  private _activePeerWrapped: ExposedPromise<
    ExtendedPostMessagePairingResponse | ExtendedP2PPairingResponse | undefined
  > = new ExposedPromise()

  private _initPromiseWrapped: Promise<TransportType> | undefined

  private readonly activeAccountLoadedWrapped: Promise<void>

  private readonly appMetadataManagerWrapped: AppMetadataManager

  private readonly disclaimerTextWrapped?: string

  private readonly errorMessagesWrapped: Record<string, Record<string | number, string>>

  name: string;

  constructor(
    /**
    * @param name name of the project, it will be appeared on the title.
    */
    /** @type {string} */
    name: string,
    config: DAppClientOptions
  ) {
    super({
      storage: config && config.storage ? config.storage : new LocalStorage(),
      ...config
    })
    this.name = name;
    this.eventsWrapped = new BeaconEventHandlerWrapped(config.eventHandlers, config.disableDefaultEvents ?? false)
    this.blockExplorer = config.blockExplorer ?? new TzktBlockExplorer()
    this.preferredNetwork = config.preferredNetwork ?? NetworkType.MAINNET
    setColorMode(config.colorMode ?? ColorMode.LIGHT)

    this.disclaimerTextWrapped = config.disclaimerText

    this.errorMessagesWrapped = config.errorMessages ?? {}

    this.appMetadataManagerWrapped = new AppMetadataManager(this.storage)

    this.activeAccountLoadedWrapped = this.storage
      .get(StorageKey.ACTIVE_ACCOUNT)
      .then(async (activeAccountIdentifier) => {
        if (activeAccountIdentifier) {
          await this.setActiveAccount(await this.accountManager.getAccount(activeAccountIdentifier))
        } else {
          await this.setActiveAccount(undefined)
        }
      })
      .catch(async (storageError) => {
        await this.setActiveAccount(undefined)
        logger.error(storageError)
      })

    this.handleResponse = async (
      message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>,
      connectionInfo: ConnectionContext
    ): Promise<void> => {
      const openRequest = this.openRequestsWrapped.get(message.id)

      logger.log('handleResponse', 'Received message', message, connectionInfo)

      if (message.version === '3') {
        const typedMessage = message as BeaconMessageWrapper<BeaconBaseMessage>

        if (openRequest && typedMessage.message.type === BeaconMessageType.Acknowledge) {
          logger.log(`acknowledge message received for ${message.id}`)
          console.timeLog(message.id, 'acknowledge')

          this.eventsWrapped
            .emit(BeaconEvent.ACKNOWLEDGE_RECEIVED, {
              message: typedMessage.message as AcknowledgeResponse,
              extraInfo: {},
              walletInfo: await this.getWalletInfoWrapped()
            })
            .catch(logger.error)
        } else if (openRequest) {
          const appMetadata: AppMetadata | undefined = (
            typedMessage.message as unknown /* Why is this unkown cast needed? */ as PermissionResponseV3<string>
          ).blockchainData.appMetadata
          if (typedMessage.message.type === BeaconMessageType.PermissionResponse && appMetadata) {
            await this.appMetadataManagerWrapped.addAppMetadata(appMetadata)
          }

          console.timeLog(typedMessage.id, 'response')
          console.timeEnd(typedMessage.id)

          if (typedMessage.message.type === BeaconMessageType.Error) {
            openRequest.reject(typedMessage.message as ErrorResponse)
          } else {
            openRequest.resolve({ message, connectionInfo })
          }
          this.openRequestsWrapped.delete(typedMessage.id)
        } else {
          if (typedMessage.message.type === BeaconMessageType.Disconnect) {
            const relevantTransport =
              connectionInfo.origin === Origin.P2P
                ? this.p2pTransport
                : this.postMessageTransport ?? (await this.transport)

            if (relevantTransport) {
              // TODO: Handle removing it from the right transport (if it was received from the non-active transport)
              const peers: ExtendedPeerInfo[] = await relevantTransport.getPeers()
              const peer: ExtendedPeerInfo | undefined = peers.find(
                (peerEl) => peerEl.senderId === message.senderId
              )
              if (peer) {
                await relevantTransport.removePeer(peer as any)
                await this.removeAccountsForPeersWrapped([peer])
                await this.eventsWrapped.emit(BeaconEvent.CHANNEL_CLOSED)
              } else {
                logger.error('handleDisconnect', 'cannot find peer for sender ID', message.senderId)
              }
            }
          } else {
            logger.error('handleResponse', 'no request found for id ', message.id, message)
          }
        }
      } else {
        const typedMessage = message as BeaconMessage

        if (openRequest && typedMessage.type === BeaconMessageType.Acknowledge) {
          logger.log(`acknowledge message received for ${message.id}`)
          console.timeLog(message.id, 'acknowledge')

          this.eventsWrapped
            .emit(BeaconEvent.ACKNOWLEDGE_RECEIVED, {
              message: typedMessage,
              extraInfo: {},
              walletInfo: await this.getWalletInfoWrapped()
            })
            .catch(logger.error)
        } else if (openRequest) {
          if (
            typedMessage.type === BeaconMessageType.PermissionResponse &&
            typedMessage.appMetadata
          ) {
            await this.appMetadataManagerWrapped.addAppMetadata(typedMessage.appMetadata)
          }

          console.timeLog(typedMessage.id, 'response')
          console.timeEnd(typedMessage.id)

          if (typedMessage.type === BeaconMessageType.Error || (message as any).errorType) {
            // TODO: Remove "any" once we remove support for v1 wallets
            openRequest.reject(typedMessage as any)
          } else {
            openRequest.resolve({ message, connectionInfo })
          }
          this.openRequestsWrapped.delete(typedMessage.id)
        } else {
          if (
            typedMessage.type === BeaconMessageType.Disconnect ||
            (message as any).typedMessage.type === BeaconMessageType.Disconnect // TODO: TYPE
          ) {
            const relevantTransport =
              connectionInfo.origin === Origin.P2P
                ? this.p2pTransport
                : this.postMessageTransport ?? (await this.transport)

            if (relevantTransport) {
              // TODO: Handle removing it from the right transport (if it was received from the non-active transport)
              const peers: ExtendedPeerInfo[] = await relevantTransport.getPeers()
              const peer: ExtendedPeerInfo | undefined = peers.find(
                (peerEl) => peerEl.senderId === message.senderId
              )
              if (peer) {
                await relevantTransport.removePeer(peer as any)
                await this.removeAccountsForPeersWrapped([peer])
                await this.eventsWrapped.emit(BeaconEvent.CHANNEL_CLOSED)
              } else {
                logger.error('handleDisconnect', 'cannot find peer for sender ID', message.senderId)
              }
            }
          } else {
            logger.error('handleResponse', 'no request found for id ', message.id, message)
          }
        }
      }
    }
  }
  //===
  public async initInternalTransports(): Promise<void> {
    const keyPair = await this.keyPair

    if (this.postMessageTransport || this.p2pTransport) {
      return
    }

    this.postMessageTransport = new DappPostMessageTransport(this.name, keyPair, this.storage)
    await this.addListener(this.postMessageTransport)

    this.p2pTransport = new DappP2PTransport(
      this.name,
      keyPair,
      this.storage,
      this.matrixNodes,
      this.iconUrl,
      this.appUrl
    )
    await this.addListener(this.p2pTransport)
  }

  public async init(transport?: Transport<any>): Promise<TransportType> {
    if (this._initPromiseWrapped) {
      return this._initPromiseWrapped
    }

    try {
      await this.activeAccountLoadedWrapped
    } catch {
      //
    }

    this._initPromiseWrapped = new Promise(async (resolve) => {
      if (transport) {
        await this.addListener(transport)

        resolve(await super.init(transport))
      } else if (this._transport.isSettled()) {
        await (await this.transport).connect()

        resolve(await super.init(await this.transport))
      } else {
        const activeAccount = await this.getActiveAccount()
        const stopListening = () => {
          if (this.postMessageTransport) {
            this.postMessageTransport.stopListeningForNewPeers().catch(logger.error)
          }
          if (this.p2pTransport) {
            this.p2pTransport.stopListeningForNewPeers().catch(logger.error)
          }
        }

        await this.initInternalTransports()

        if (!this.postMessageTransport || !this.p2pTransport) {
          return
        }

        this.postMessageTransport.connect().then().catch(logger.error)

        if (activeAccount && activeAccount.origin) {
          const origin = activeAccount.origin.type
          // Select the transport that matches the active account
          if (origin === Origin.EXTENSION) {
            console.log(await super.init(this.postMessageTransport));
            resolve(await super.init(this.postMessageTransport))
          } else if (origin === Origin.P2P) {
            console.log(await super.init(this.p2pTransport));

            resolve(await super.init(this.p2pTransport))
          }
        } else {
          const p2pTransport = this.p2pTransport
          const postMessageTransport = this.postMessageTransport

          postMessageTransport
            .listenForNewPeer((peer) => {
              logger.log('init', 'postmessage transport peer connected', peer)
              this.eventsWrapped
                .emit(BeaconEvent.PAIR_SUCCESS, peer)
                .catch((emitError) => console.warn(emitError))

              this.setActivePeer(peer).catch(logger.error)
              this.setTransport(this.postMessageTransport).catch(logger.error)
              stopListening()
              resolve(TransportType.POST_MESSAGE)
            })
            .catch(logger.error)

          p2pTransport
            .listenForNewPeer((peer) => {
              logger.log('init', 'p2p transport peer connected', peer)
              this.eventsWrapped
                .emit(BeaconEvent.PAIR_SUCCESS, peer)
                .catch((emitError) => console.warn(emitError))

              this.setActivePeer(peer).catch(logger.error)
              this.setTransport(this.p2pTransport).catch(logger.error)
              stopListening()
              resolve(TransportType.P2P)
            })
            .catch(logger.error)
          const timmer = new Promise(async resolve => {
            await setTimeout(() => {
              console.log("timer1");
            }, 5000);
          })
          PostMessageTransport.getAvailableExtensions()
            .then(async () => {
              this.eventsWrapped
                .emit(BeaconEvent.PAIR_INIT, {
                  p2pPeerInfo: () => {
                    p2pTransport.connect().then().catch(logger.error)
                    return p2pTransport.getPairingRequestInfo()
                  },
                  postmessagePeerInfo: () => postMessageTransport.getPairingRequestInfo(),
                  preferredNetwork: this.preferredNetwork,
                  abortedHandler: () => {
                    logger.log('ABORTED')
                    this._initPromiseWrapped = undefined
                  },
                  disclaimerText: this.disclaimerTextWrapped
                })
                .catch((emitError) => console.warn(emitError))
            })
            .catch((error) => {
              this._initPromiseWrapped = undefined
              logger.error(error)
            })
        }
      }
    })

    return this._initPromiseWrapped
  }

  /**
   * Returns the active account
   */
  public async getActiveAccount(): Promise<AccountInfo | undefined> {
    return this._activeAccountWrapped.promise
  }

  /**
   * Sets the active account
   *
   * @param account The account that will be set as the active account
   */
  public async setActiveAccount(account?: AccountInfo): Promise<void> {
    if (this._activeAccountWrapped.isSettled()) {
      // If the promise has already been resolved we need to create a new one.
      this._activeAccountWrapped = ExposedPromise.resolve<AccountInfo | undefined>(account)
    } else {
      this._activeAccountWrapped.resolve(account)
    }

    if (account) {
      const origin = account.origin.type
      await this.initInternalTransports()

      // Select the transport that matches the active account
      if (origin === Origin.EXTENSION) {
        await this.setTransport(this.postMessageTransport)
      } else if (origin === Origin.P2P) {
        await this.setTransport(this.p2pTransport)
      }
      const peer = await this.getPeerWrapped(account)
      await this.setActivePeer(peer as any)
    } else {
      await this.setActivePeer(undefined)
      await this.setTransport(undefined)
    }

    await this.storage.set(
      StorageKey.ACTIVE_ACCOUNT,
      account ? account.accountIdentifier : undefined
    )

    await this.eventsWrapped.emit(BeaconEvent.ACTIVE_ACCOUNT_SET, account)

    return
  }

  /**
   * Clear the active account
   */
  public clearActiveAccount(): Promise<void> {
    return this.setActiveAccount()
  }

  public async setColorMode(colorMode: ColorMode): Promise<void> {
    return setColorMode(colorMode)
  }

  public async getColorMode(): Promise<ColorMode> {
    return getColorMode()
  }

  /**
   * @deprecated
   *
   * Use getOwnAppMetadata instead
   */
  public async getAppMetadata(): Promise<AppMetadata> {
    return this.getOwnAppMetadata()
  }

  public async showPrepare(): Promise<void> {
    const walletInfo = await (async () => {
      try {
        return await this.getWalletInfoWrapped()
      } catch {
        return undefined
      }
    })()
    await this.eventsWrapped.emit(BeaconEvent.SHOW_PREPARE, { walletInfo })
  }

  public async hideUI(elements?: ('alert' | 'toast')[]): Promise<void> {
    await this.eventsWrapped.emit(BeaconEvent.HIDE_UI, elements)
  }

  /**
   * Will remove the account from the local storage and set a new active account if necessary.
   *
   * @param accountIdentifier ID of the account
   */
  public async removeAccount(accountIdentifier: string): Promise<void> {
    const removeAccountResult = super.removeAccount(accountIdentifier)
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()

    if (activeAccount && activeAccount.accountIdentifier === accountIdentifier) {
      await this.setActiveAccount(undefined)
    }

    return removeAccountResult
  }

  /**
   * Remove all accounts and set active account to undefined
   */
  public async removeAllAccounts(): Promise<void> {
    await super.removeAllAccounts()
    await this.setActiveAccount(undefined)
  }

  /**
   * Removes a peer and all the accounts that have been connected through that peer
   *
   * @param peer Peer to be removed
   */
  public async removePeer(
    peer: ExtendedPeerInfo,
    sendDisconnectToPeer: boolean = false
  ): Promise<void> {
    const transport = await this.transport

    const removePeerResult = transport.removePeer(peer)

    await this.removeAccountsForPeersWrapped([peer])

    if (sendDisconnectToPeer) {
      await this.sendDisconnectToPeer(peer, transport)
    }

    return removePeerResult
  }

  /**
   * Remove all peers and all accounts that have been connected through those peers
   */
  public async removeAllPeers(sendDisconnectToPeers: boolean = false): Promise<void> {
    const transport = await this.transport

    const peers: ExtendedPeerInfo[] = await transport.getPeers()
    const removePeerResult = transport.removeAllPeers()

    await this.removeAccountsForPeersWrapped(peers)

    if (sendDisconnectToPeers) {
      const disconnectPromises = peers.map((peer) => this.sendDisconnectToPeer(peer, transport))

      await Promise.all(disconnectPromises)
    }

    return removePeerResult
  }

  /**
   * Allows the user to subscribe to specific events that are fired in the SDK
   *
   * @param internalEvent The event to subscribe to
   * @param eventCallback The callback that will be called when the event occurs
   */
  public async subscribeToEvent<K extends BeaconEvent>(
    internalEvent: K,
    eventCallback: BeaconEventHandlerFunction<BeaconEventType[K]>
  ): Promise<void> {
    await this.eventsWrapped.on(internalEvent, eventCallback)
  }

  /**
   * Check if we have permissions to send the specific message type to the active account.
   * If no active account is set, only permission requests are allowed.
   *
   * @param type The type of the message
   */
  public async checkPermissions(type: BeaconMessageType): Promise<boolean> {
    if (type === BeaconMessageType.PermissionRequest) {
      return true
    }

    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()

    if (!activeAccount) {
      throw await this.sendInternalErrorWrapped('No active account set!')
    }

    const permissions = activeAccount.scopes

    switch (type) {
      case BeaconMessageType.OperationRequest:
        return permissions.includes(PermissionScope.OPERATION_REQUEST)
      case BeaconMessageType.SignPayloadRequest:
        return permissions.includes(PermissionScope.SIGN)
      // TODO: ENCRYPTION
      // case BeaconMessageType.EncryptPayloadRequest:
      //   return permissions.includes(PermissionScope.ENCRYPT)
      case BeaconMessageType.BroadcastRequest:
        return true
      default:
        return false
    }
  }

  public async sendNotification(
    title: string,
    message: string,
    payload: string,
    protocolIdentifier: string
  ): Promise<string> {
    const activeAccount = await this.getActiveAccount()

    if (
      !activeAccount ||
      (activeAccount &&
        !activeAccount.scopes.includes(PermissionScope.NOTIFICATION) &&
        !activeAccount.notification)
    ) {
      throw new Error('notification permissions not given')
    }

    if (!activeAccount.notification?.token) {
      throw new Error('No AccessToken')
    }

    const url = activeAccount.notification?.apiUrl

    if (!url) {
      throw new Error('No Push URL set')
    }

    return this.sendNotificationWithAccessTokenWrapped({
      url,
      recipient: activeAccount.address,
      title,
      body: message,
      payload,
      protocolIdentifier,
      accessToken: activeAccount.notification?.token
    })
  }

  private blockchainsWrapped: Map<string, Blockchain> = new Map()

  addBlockchain(chain: Blockchain) {
    this.blockchainsWrapped.set(chain.identifier, chain)
    chain.getWalletLists().then((walletLists) => {
      setDesktopList(walletLists.desktopList)
      setExtensionList(walletLists.extensionList)
      setWebList(walletLists.webList)
      setiOSList(walletLists.iOSList)
    })
  }

  removeBlockchain(chainIdentifier: string) {
    this.blockchainsWrapped.delete(chainIdentifier)
  }

  /** Generic messages */
  public async permissionRequest(
    input: PermissionRequestV3<string>
  ): Promise<PermissionResponseV3<string>> {
    logger.log('PERMISSION REQUEST')
    const blockchain = this.blockchainsWrapped.get(input.blockchainIdentifier)
    if (!blockchain) {
      throw new Error(`Blockchain "${input.blockchainIdentifier}" not supported by dAppClient`)
    }

    const request: PermissionRequestV3<string> = {
      ...input,
      type: BeaconMessageType.PermissionRequest,
      blockchainData: {
        ...input.blockchainData,
        appMetadata: await this.getOwnAppMetadata()
      }
    }

    logger.log('REQUESTION PERMIMISSION V3', 'xxx', request)

    const { message: response, connectionInfo } = await this.makeRequestV3Wrapped<
      PermissionRequestV3<string>,
      BeaconMessageWrapper<PermissionResponseV3<string>>
    >(request).catch(async (_requestError: ErrorResponse) => {
      throw new Error('TODO')
      // throw await this.handleRequestError(request, requestError)
    })

    logger.log('RESPONSE V3', response, connectionInfo)

    const partialAccountInfos = await blockchain.getAccountInfosFromPermissionResponse(
      response.message
    )

    // const accountInfo: AccountInfo = {
    const accountInfo: any = {
      accountIdentifier: partialAccountInfos[0].accountId,
      senderId: response.senderId,
      origin: {
        type: connectionInfo.origin,
        id: connectionInfo.id
      },
      address: partialAccountInfos[0].address, // Store all addresses
      publicKey: partialAccountInfos[0].publicKey,
      scopes: response.message.blockchainData.scopes as any,
      connectedAt: new Date().getTime(),
      chainData: response.message.blockchainData
    }

    await this.accountManager.addAccount(accountInfo)
    await this.setActiveAccount(accountInfo)

    await blockchain.handleResponse({
      request,
      account: accountInfo,
      output: response,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfoWrapped()
    })

    await this.notifySuccessWrapped(request as any, {
      account: accountInfo,
      output: {
        address: partialAccountInfos[0].address,
        network: { type: NetworkType.MAINNET },
        scopes: [PermissionScope.OPERATION_REQUEST]
      } as any,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfoWrapped()
    })

    // return output
    return response.message
  }

  public async request(input: BlockchainRequestV3<string>): Promise<BlockchainResponseV3<string>> {
    logger.log('REQUEST', input)
    const blockchain = this.blockchainsWrapped.get(input.blockchainIdentifier)
    if (!blockchain) {
      throw new Error(`Blockchain "${blockchain}" not supported by dAppClient`)
    }

    await blockchain.validateRequest(input)

    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()
    if (!activeAccount) {
      throw await this.sendInternalErrorWrapped('No active account!')
    }

    const request: BlockchainRequestV3<string> = {
      ...input,
      type: BeaconMessageType.BlockchainRequest,
      accountId: activeAccount.accountIdentifier
    }

    const { message: response, connectionInfo } = await this.makeRequestV3Wrapped<
      BlockchainRequestV3<string>,
      BeaconMessageWrapper<BlockchainResponseV3<string>>
    >(request).catch(async (requestError: ErrorResponse) => {
      console.error(requestError)
      throw new Error('TODO')
      // throw await this.handleRequestError(request, requestError)
    })

    await blockchain.handleResponse({
      request,
      account: activeAccount,
      output: response,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfoWrapped()
    })

    return response.message
  }

  /**
   * Send a permission request to the DApp. This should be done as the first step. The wallet will respond
   * with an publicKey and permissions that were given. The account returned will be set as the "activeAccount"
   * and will be used for the following requests.
   *
   * @param input The message details we need to prepare the PermissionRequest message.
   */
  public async requestPermissionsWrapped(
    input?: RequestPermissionInput
  ): Promise<PermissionResponseOutput> {
    const request: PermissionRequestInput = {
      appMetadata: await this.getOwnAppMetadata(),
      type: BeaconMessageType.PermissionRequest,
      network: input && input.network ? input.network : { type: NetworkType.MAINNET },
      scopes:
        input && input.scopes
          ? input.scopes
          : [PermissionScope.OPERATION_REQUEST, PermissionScope.SIGN]
    }

    const { message, connectionInfo } = await this.makeRequestWrapped<
      PermissionRequest,
      PermissionResponse
    >(request).catch(async (requestError: ErrorResponse) => {
      throw await this.handleRequestErrorWrapped(request, requestError)
    })

    // TODO: Migration code. Remove sometime after 1.0.0 release.
    const publicKey = message.publicKey || (message as any).pubkey || (message as any).pubKey
    const address = await getAddressFromPublicKey(publicKey)

    const accountInfo: AccountInfo = {
      accountIdentifier: await getAccountIdentifier(address, message.network),
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
    }

    await this.accountManager.addAccount(accountInfo)
    await this.setActiveAccount(accountInfo)

    const output: PermissionResponseOutput = {
      ...message,
      address,
      accountInfo
    }

    await this.notifySuccessWrapped(request, {
      account: accountInfo,
      output,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfoWrapped()
    })

    return output
  }

  /**
   * This method will send a "SignPayloadRequest" to the wallet. This method is meant to be used to sign
   * arbitrary data (eg. a string). It will return the signature in the format of "edsig..."
   *
   * @param input The message details we need to prepare the SignPayloadRequest message.
   */
  public async requestSignPayload(
    input: RequestSignPayloadInput
  ): Promise<SignPayloadResponseOutput> {
    if (!input.payload) {
      throw await this.sendInternalErrorWrapped('Payload must be provided')
    }
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()
    if (!activeAccount) {
      throw await this.sendInternalErrorWrapped('No active account!')
    }

    const payload = input.payload

    if (typeof payload !== 'string') {
      throw new Error('Payload must be a string')
    }

    const signingType = ((): SigningType => {
      switch (input.signingType) {
        case SigningType.OPERATION:
          if (!payload.startsWith('03')) {
            throw new Error(
              'When using signing type "OPERATION", the payload must start with prefix "03"'
            )
          }

          return SigningType.OPERATION

        case SigningType.MICHELINE:
          if (!payload.startsWith('05')) {
            throw new Error(
              'When using signing type "MICHELINE", the payload must start with prefix "05"'
            )
          }

          return SigningType.MICHELINE

        case SigningType.RAW:
        default:
          return SigningType.RAW
      }
    })()

    const request: SignPayloadRequestInput = {
      type: BeaconMessageType.SignPayloadRequest,
      signingType,
      payload,
      sourceAddress: input.sourceAddress || activeAccount.address
    }

    const { message, connectionInfo } = await this.makeRequestWrapped<
      SignPayloadRequest,
      SignPayloadResponse
    >(request).catch(async (requestError: ErrorResponse) => {
      throw await this.handleRequestErrorWrapped(request, requestError)
    })

    await this.notifySuccessWrapped(request, {
      account: activeAccount,
      output: message,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfoWrapped()
    })

    return message
  }

  public async requestOperation(input: RequestOperationInput): Promise<OperationResponseOutput> {
    if (!input.operationDetails) {
      throw await this.sendInternalErrorWrapped('Operation details must be provided')
    }
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()
    if (!activeAccount) {
      throw await this.sendInternalErrorWrapped('No active account!')
    }

    const request: OperationRequestInput = {
      type: BeaconMessageType.OperationRequest,
      network: activeAccount.network || { type: NetworkType.MAINNET },
      operationDetails: input.operationDetails,
      sourceAddress: activeAccount.address || ''
    }

    const { message, connectionInfo } = await this.makeRequestWrapped<OperationRequest, OperationResponse>(
      request
    ).catch(async (requestError: ErrorResponse) => {
      throw await this.handleRequestErrorWrapped(request, requestError)
    })

    await this.notifySuccessWrapped(request, {
      account: activeAccount,
      output: message,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfoWrapped()
    })

    return message
  }

  /**
   * Sends a "BroadcastRequest" to the wallet. This method can be used to inject an already signed transaction
   * to the network.
   *
   * @param input The message details we need to prepare the BroadcastRequest message.
   */
  public async requestBroadcast(input: RequestBroadcastInput): Promise<BroadcastResponseOutput> {
    if (!input.signedTransaction) {
      throw await this.sendInternalErrorWrapped('Signed transaction must be provided')
    }

    const network = input.network || { type: NetworkType.MAINNET }

    const request: BroadcastRequestInput = {
      type: BeaconMessageType.BroadcastRequest,
      network,
      signedTransaction: input.signedTransaction
    }

    const { message, connectionInfo } = await this.makeRequestWrapped<BroadcastRequest, BroadcastResponse>(
      request
    ).catch(async (requestError: ErrorResponse) => {
      throw await this.handleRequestErrorWrapped(request, requestError)
    })

    await this.notifySuccessWrapped(request, {
      network,
      output: message,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfoWrapped()
    })

    return message
  }

  protected async setActivePeer(
    peer?: ExtendedPostMessagePairingResponse | ExtendedP2PPairingResponse
  ): Promise<void> {
    if (this._activePeerWrapped.isSettled()) {
      // If the promise has already been resolved we need to create a new one.
      this._activePeerWrapped = ExposedPromise.resolve<
        ExtendedPostMessagePairingResponse | ExtendedP2PPairingResponse | undefined
      >(peer)
    } else {
      this._activePeerWrapped.resolve(peer)
    }

    if (peer) {
      await this.initInternalTransports()
      if (peer.type === 'postmessage-pairing-response') {
        await this.setTransport(this.postMessageTransport)
      } else if (peer.type === 'p2p-pairing-response') {
        await this.setTransport(this.p2pTransport)
      }
    }

    return
  }

  /**
   * A "setter" for when the transport needs to be changed.
   */
  protected async setTransport(transport?: Transport<any>): Promise<void> {
    if (!transport) {
      this._initPromiseWrapped = undefined
    }

    const result = super.setTransport(transport)

    await this.eventsWrapped.emit(BeaconEvent.ACTIVE_TRANSPORT_SET, transport)

    return result
  }

  /**
   * This method will emit an internal error message.
   *
   * @param errorMessage The error message to send.
   */
  private async sendInternalErrorWrapped(errorMessage: string): Promise<void> {
    await this.eventsWrapped.emit(BeaconEvent.INTERNAL_ERROR, { text: errorMessage })
    throw new Error(errorMessage)
  }

  /**
   * This method will remove all accounts associated with a specific peer.
   *
   * @param peersToRemove An array of peers for which accounts should be removed
   */
  private async removeAccountsForPeersWrapped(peersToRemove: ExtendedPeerInfo[]): Promise<void> {
    const accounts = await this.accountManager.getAccounts()

    const peerIdsToRemove = peersToRemove.map((peer) => peer.senderId)
    // Remove all accounts with origin of the specified peer
    const accountsToRemove = accounts.filter((account) =>
      peerIdsToRemove.includes(account.senderId)
    )
    const accountIdentifiersToRemove = accountsToRemove.map(
      (accountInfo) => accountInfo.accountIdentifier
    )
    await this.accountManager.removeAccounts(accountIdentifiersToRemove)

    // Check if one of the accounts that was removed was the active account and if yes, set it to undefined
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()

    if (activeAccount) {
      if (accountIdentifiersToRemove.includes(activeAccount.accountIdentifier)) {
        await this.setActiveAccount(undefined)
      }
    }
  }

  /**
   * This message handles errors that we receive from the wallet.
   *
   * @param request The request we sent
   * @param beaconError The error we received
   */
  private async handleRequestErrorWrapped(
    request: BeaconRequestInputMessage,
    beaconError: ErrorResponse
  ): Promise<void> {
    logger.error('handleRequestError', 'error response', beaconError)
    if (beaconError.errorType) {
      const buttons: AlertButton[] = []
      if (beaconError.errorType === BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR) {
        const actionCallback = async (): Promise<void> => {
          const operationRequest: OperationRequestInput = request as OperationRequestInput
          // if the account we requested is not available, we remove it locally
          let accountInfo: AccountInfo | undefined
          if (operationRequest.sourceAddress && operationRequest.network) {
            const accountIdentifier = await getAccountIdentifier(
              operationRequest.sourceAddress,
              operationRequest.network
            )
            accountInfo = await this.getAccount(accountIdentifier)

            if (accountInfo) {
              await this.removeAccount(accountInfo.accountIdentifier)
            }
          }
        }

        buttons.push({ text: 'Remove account', actionCallback })
      }

      const peer = await this.getPeerWrapped()
      const activeAccount = await this.getActiveAccount()

      // If we sent a permission request, received an error and there is no active account, we need to reset the DAppClient.
      // This most likely means that the user rejected the first permission request after pairing a wallet, so we "forget" the paired wallet to allow the user to pair again.
      if (
        request.type === BeaconMessageType.PermissionRequest &&
        (await this.getActiveAccount()) === undefined
      ) {
        this._initPromiseWrapped = undefined
        this.postMessageTransport = undefined
        this.p2pTransport = undefined
        await this.setTransport()
        await this.setActivePeer()
      }

      this.eventsWrapped
        .emit(
          messageEvents[request.type].error,
          {
            errorResponse: beaconError,
            walletInfo: await this.getWalletInfoWrapped(peer, activeAccount),
            errorMessages: this.errorMessagesWrapped
          },
          buttons
        )
        .catch((emitError) => logger.error('handleRequestError', emitError))

      throw BeaconError.getError(beaconError.errorType, beaconError.errorData)
    }

    throw beaconError
  }

  /**
   * This message will send an event when we receive a successful response to one of the requests we sent.
   *
   * @param request The request we sent
   * @param response The response we received
   */
  private async notifySuccessWrapped(
    request: BeaconRequestInputMessage,
    response:
      | {
          account: AccountInfo
          output: PermissionResponseOutput
          blockExplorer: BlockExplorer
          connectionContext: ConnectionContext
          walletInfo: WalletInfo
        }
      | {
          account: AccountInfo
          output: OperationResponseOutput
          blockExplorer: BlockExplorer
          connectionContext: ConnectionContext
          walletInfo: WalletInfo
        }
      | {
          output: SignPayloadResponseOutput
          connectionContext: ConnectionContext
          walletInfo: WalletInfo
        }
      // | {
      //     output: EncryptPayloadResponseOutput
      //     connectionContext: ConnectionContext
      //     walletInfo: WalletInfo
      // }
      | {
          network: Network
          output: BroadcastResponseOutput
          blockExplorer: BlockExplorer
          connectionContext: ConnectionContext
          walletInfo: WalletInfo
        }
  ): Promise<void> {
    this.eventsWrapped
      .emit(messageEvents[request.type].success, response)
      .catch((emitError) => console.warn(emitError))
  }

  private async getWalletInfoWrapped(peer?: PeerInfo, account?: AccountInfo): Promise<WalletInfo> {
    const selectedAccount = account ? account : await this.getActiveAccount()

    const selectedPeer = peer ? peer : await this.getPeerWrapped(selectedAccount)

    let walletInfo: WalletInfo | undefined
    if (selectedAccount) {
      walletInfo = await this.appMetadataManagerWrapped.getAppMetadata(selectedAccount.senderId)
    }

    const typedPeer: PostMessagePairingResponse = selectedPeer as any

    if (!walletInfo) {
      walletInfo = {
        name: typedPeer.name,
        icon: typedPeer.icon
      }
    }

    const lowerCaseCompare = (str1?: string, str2?: string): boolean => {
      if (str1 && str2) {
        return str1.toLowerCase() === str2.toLowerCase()
      }

      return false
    }

    let selectedApp: WebApp | App | DesktopApp | ExtensionApp | undefined
    let type: 'extension' | 'mobile' | 'web' | 'desktop' | undefined
    // TODO: Remove once all wallets send the icon?
    if (getiOSList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))) {
      selectedApp = getiOSList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))
      type = 'mobile'
    } else if (getWebList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))) {
      selectedApp = getWebList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))
      type = 'web'
    } else if (getDesktopList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))) {
      selectedApp = getDesktopList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))
      type = 'desktop'
    } else if (getExtensionList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))) {
      selectedApp = getExtensionList().find((app) => lowerCaseCompare(app.name, walletInfo?.name))
      type = 'extension'
    }

    if (selectedApp) {
      let deeplink: string | undefined
      if (selectedApp.hasOwnProperty('links')) {
        deeplink = (selectedApp as WebApp).links[
          selectedAccount?.network.type ?? this.preferredNetwork
        ]
      } else if (selectedApp.hasOwnProperty('deepLink')) {
        deeplink = (selectedApp as App).deepLink
      }

      return {
        name: walletInfo.name,
        icon: walletInfo.icon ?? selectedApp.logo,
        deeplink,
        type
      }
    }

    return walletInfo
  }

  private async getPeerWrapped(account?: AccountInfo): Promise<PeerInfo> {
    let peer: PeerInfo | undefined

    if (account) {
      logger.log('getPeer', 'We have an account', account)
      const postMessagePeers: ExtendedPostMessagePairingResponse[] =
        (await this.postMessageTransport?.getPeers()) ?? []
      const p2pPeers: ExtendedP2PPairingResponse[] = (await this.p2pTransport?.getPeers()) ?? []
      const peers = [...postMessagePeers, ...p2pPeers]

      logger.log('getPeer', 'Found peers', peers, account)

      peer = peers.find((peerEl) => peerEl.senderId === account.senderId)
      if (!peer) {
        // We could not find an exact match for a sender, so we most likely received it over a relay
        peer = peers.find((peerEl) => (peerEl as any).extensionId === account.origin.id)
      }
    } else {
      peer = await this._activePeerWrapped.promise
      logger.log('getPeer', 'Active peer', peer)
    }

    if (!peer) {
      throw new Error('No matching peer found.')
    }

    return peer
  }

  /**
   * This method handles sending of requests to the DApp. It makes sure that the DAppClient is initialized and connected
   * to the transport. After that rate limits and permissions will be checked, an ID is attached and the request is sent
   * to the DApp over the transport.
   *
   * @param requestInput The BeaconMessage to be sent to the wallet
   * @param account The account that the message will be sent to
   */
  private async makeRequestWrapped<T extends BeaconRequestInputMessage, U extends BeaconMessage>(
    requestInput: Optional<T, IgnoredRequestInputProperties>
  ): Promise<{
    message: U
    connectionInfo: ConnectionContext
  }> {
    const messageId = await generateGUID()
    console.time(messageId)
    logger.log('makeRequest', 'starting')
    await this.init()
    console.timeLog(messageId, 'init done')
    logger.log('makeRequest', 'after init')

    if (await this.addRequestAndCheckIfRateLimited()) {
      this.eventsWrapped
        .emit(BeaconEvent.LOCAL_RATE_LIMIT_REACHED)
        .catch((emitError) => console.warn(emitError))

      throw new Error('rate limit reached')
    }

    if (!(await this.checkPermissions(requestInput.type))) {
      this.eventsWrapped.emit(BeaconEvent.NO_PERMISSIONS).catch((emitError) => console.warn(emitError))

      throw new Error('No permissions to send this request to wallet!')
    }

    if (!this.beaconId) {
      throw await this.sendInternalErrorWrapped('BeaconID not defined')
    }

    const request: Optional<T, IgnoredRequestInputProperties> &
      Pick<U, IgnoredRequestInputProperties> = {
      id: messageId,
      version: '2', // This is the old version
      senderId: await getSenderId(await this.beaconId),
      ...requestInput
    }

    const exposed = new ExposedPromise<
      {
        message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>
        connectionInfo: ConnectionContext
      },
      ErrorResponse
    >()

    this.addOpenRequestWrapped(request.id, exposed)

    const payload = await new Serializer().serialize(request)

    const account = await this.getActiveAccount()

    const peer = await this.getPeerWrapped(account)

    const walletInfo = await this.getWalletInfoWrapped(peer, account)

    logger.log('makeRequest', 'sending message', request)
    console.timeLog(messageId, 'sending')
    try {
      await (await this.transport).send(payload, peer)
    } catch (sendError) {
      this.eventsWrapped.emit(BeaconEvent.INTERNAL_ERROR, {
        text: 'Unable to send message. If this problem persists, please reset the connection and pair your wallet again.',
        buttons: [
          {
            text: 'Reset Connection',
            actionCallback: async (): Promise<void> => {
              await closeToast()
              this.disconnect()
            }
          }
        ]
      })
      console.timeLog(messageId, 'send error')
      throw sendError
    }
    console.timeLog(messageId, 'sent')

    this.eventsWrapped
      .emit(messageEvents[requestInput.type].sent, {
        walletInfo: {
          ...walletInfo,
          name: walletInfo.name ?? 'Wallet'
        },
        extraInfo: {
          resetCallback: async () => {
            this.disconnect()
          }
        }
      })
      .catch((emitError) => console.warn(emitError))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return exposed.promise as any // TODO: fix type
  }

  /**
   * This method handles sending of requests to the DApp. It makes sure that the DAppClient is initialized and connected
   * to the transport. After that rate limits and permissions will be checked, an ID is attached and the request is sent
   * to the DApp over the transport.
   *
   * @param requestInput The BeaconMessage to be sent to the wallet
   * @param account The account that the message will be sent to
   */
  private async makeRequestV3Wrapped<
    T extends BlockchainMessage<string>,
    U extends BeaconMessageWrapper<BlockchainMessage<string>>
  >(
    requestInput: T
  ): Promise<{
    message: U
    connectionInfo: ConnectionContext
  }> {
    const messageId = await generateGUID()
    console.time(messageId)
    logger.log('makeRequest', 'starting')
    await this.init()
    console.timeLog(messageId, 'init done')
    logger.log('makeRequest', 'after init')

    if (await this.addRequestAndCheckIfRateLimited()) {
      this.eventsWrapped
        .emit(BeaconEvent.LOCAL_RATE_LIMIT_REACHED)
        .catch((emitError) => console.warn(emitError))

      throw new Error('rate limit reached')
    }

    // if (!(await this.checkPermissions(requestInput.type as BeaconMessageType))) {
    //   this.events.emit(BeaconEvent.NO_PERMISSIONS).catch((emitError) => console.warn(emitError))

    //   throw new Error('No permissions to send this request to wallet!')
    // }

    if (!this.beaconId) {
      throw await this.sendInternalErrorWrapped('BeaconID not defined')
    }

    const request: BeaconMessageWrapper<BlockchainMessage> = {
      id: messageId,
      version: '3',
      senderId: await getSenderId(await this.beaconId),
      message: requestInput
    }

    const exposed = new ExposedPromise<
      {
        message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>
        connectionInfo: ConnectionContext
      },
      ErrorResponse
    >()

    this.addOpenRequestWrapped(request.id, exposed)

    const payload = await new Serializer().serialize(request)

    const account = await this.getActiveAccount()

    const peer = await this.getPeerWrapped(account)

    const walletInfo = await this.getWalletInfoWrapped(peer, account)

    logger.log('makeRequest', 'sending message', request)
    console.timeLog(messageId, 'sending')
    try {
      await (await this.transport).send(payload, peer)
    } catch (sendError) {
      this.eventsWrapped.emit(BeaconEvent.INTERNAL_ERROR, {
        text: 'Unable to send message. If this problem persists, please reset the connection and pair your wallet again.',
        buttons: [
          {
            text: 'Reset Connection',
            actionCallback: async (): Promise<void> => {
              await closeToast()
              this.disconnect()
            }
          }
        ]
      })
      console.timeLog(messageId, 'send error')
      throw sendError
    }
    console.timeLog(messageId, 'sent')

    const index = requestInput.type as any as BeaconMessageType

    this.eventsWrapped
      .emit(messageEvents[index].sent, {
        walletInfo: {
          ...walletInfo,
          name: walletInfo.name ?? 'Wallet'
        },
        extraInfo: {
          resetCallback: async () => {
            this.disconnect()
          }
        }
      })
      .catch((emitError) => console.warn(emitError))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return exposed.promise as any // TODO: fix type
  }

  public async disconnect() {
    this.postMessageTransport = undefined
    this.p2pTransport = undefined
    await Promise.all([this.clearActiveAccount(), (await this.transport).disconnect()])
  }

  /**
   * Adds a requests to the "openRequests" set so we know what messages have already been answered/handled.
   *
   * @param id The ID of the message
   * @param promise A promise that resolves once the response for that specific message is received
   */
  private addOpenRequestWrapped(
    id: string,
    promise: ExposedPromise<
      {
        message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>
        connectionInfo: ConnectionContext
      },
      ErrorResponse
    >
  ): void {
    logger.log('addOpenRequest', this.name, `adding request ${id} and waiting for answer`)
    this.openRequestsWrapped.set(id, promise)
  }

  private async sendNotificationWithAccessTokenWrapped(notification: {
    url: string
    recipient: string
    title: string
    body: string
    payload: string
    protocolIdentifier: string
    accessToken: string
  }): Promise<string> {
    const { url, recipient, title, body, payload, protocolIdentifier, accessToken } = notification
    const timestamp = new Date().toISOString()

    const keypair = await this.keyPair

    const rawPublicKey = keypair.publicKey

    const prefix = Buffer.from(new Uint8Array([13, 15, 37, 217]))

    const publicKey = bs58check.encode(Buffer.concat([prefix, Buffer.from(rawPublicKey)]))

    const constructedString = [
      'Tezos Signed Message: ',
      recipient,
      title,
      body,
      timestamp,
      payload
    ].join(' ')

    const bytes = toHex(constructedString)
    const payloadBytes = '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes

    const signature = await signMessage(payloadBytes, {
      secretKey: Buffer.from(keypair.secretKey)
    })

    const notificationResponse = await axios.post(`${url}/send`, {
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
    })

    return notificationResponse.data
  }
  //===
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
          console.log("opt1");

          this.requestPermissionsWrapped().then(() => {
            resolve(1);
          })
          container.remove();
        })

        this.otherClickPromise(frame).then(r => {
          console.log("opt2");
          resolve(2);
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