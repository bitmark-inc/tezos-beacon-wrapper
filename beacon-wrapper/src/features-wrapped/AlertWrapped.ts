import { createSanitizedElement } from '@airgap/beacon-ui/dist/cjs/utils/html-elements';
import { constructDefaultAlert, constructPairAlert } from '@airgap/beacon-ui/dist/cjs/utils/templates';
import { alertTemplates } from '@airgap/beacon-ui/dist/cjs/ui/alert/alert-templates';
import { closeAlert } from '@airgap/beacon-ui/dist/cjs/ui/alert/Alert';
import { preparePairingAlert } from './PairingAlertWrapped';
import {
  AlertButton,
  AlertConfig, closeAlerts, generateGUID, getColorMode
} from '@airgap/beacon-sdk';

const timeout: Record<string, number | undefined> = {};
let lastFocusedElement: Element | undefined | null;
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

/**
 * Show an alert
 *
 * @param alertConfig The configuration of the alert
 */
// eslint-disable-next-line complexity
export const openAlertWrapped = async (alertConfig: AlertConfig): Promise<string> => {
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