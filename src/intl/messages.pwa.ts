import { messages, translate } from '@ccssmnn/intl';

export { basePwaMessages, dePwaMessages };

const basePwaMessages = messages({
  'pwa.installTitle': 'Add Kueki to your Home Screen',
  'pwa.installWhy':
    'Installed, Kueki opens full screen, stays put while you monitor, and can send you alerts when it is in the background.',
  'pwa.installNudge': 'Alerts and full screen monitoring only work from the Home Screen icon.',
  'pwa.installShowMe': 'Show me how',
  'pwa.installLater': 'Not now',
  'pwa.installAction': 'Install Kueki',
  'pwa.installDone': 'Done, it is on my Home Screen',
  'pwa.installStepsIntro': 'Takes about ten seconds:',
  'pwa.iosStepShare': 'Tap the Share button in the Safari toolbar.',
  'pwa.iosStepAdd': 'Scroll down and choose Add to Home Screen.',
  'pwa.iosStepOpen': 'Tap Add, then open Kueki from your Home Screen.',
  'pwa.iosNote': 'Safari only. Alerts work once you open Kueki from the Home Screen icon.',
  'pwa.androidStepMenu': 'Open the browser menu in the top right.',
  'pwa.androidStepAdd': 'Choose Install app or Add to Home screen.',
  'pwa.androidStepOpen': 'Confirm, then open Kueki from your home screen.',
  'pwa.androidStepPrompt': 'Tap the button below and confirm the install prompt.',
  'pwa.genericStepMenu': 'Open your browser menu.',
  'pwa.genericStepAdd': 'Choose Install app or Add to Home screen.',
  'pwa.genericStepOpen': 'Open Kueki from the new icon on your home screen.',
  'pwa.notificationsNeedInstall':
    'Notifications need Kueki on your Home Screen. Phones only deliver alerts to installed apps.',
  'pwa.notificationsInstallAction': 'How to install',
  'pwa.updateTitle': 'Kueki update available',
  'pwa.updateBlocked': 'Pause monitoring and listening before updating.',
  'pwa.updateAction': 'Update',
  'pwa.offlineUnavailable': 'Offline installation is unavailable. Reload while connected.',
  'pwa.iosHint':
    'On iPhone or iPad, add Kueki to your Home Screen, then open it there to enable alerts.',
  'pwa.blocked':
    'Notifications are blocked. Allow them in your browser or device settings, then try again.',
  'pwa.gettingReady': 'Installation is still getting ready. Reload and try again.',
  'pwa.notConfigured': 'Push notifications are not configured on this server.',
  'pwa.timeout': 'Notification setup timed out. Check your connection and try again.',
});

const dePwaMessages = translate(basePwaMessages, {
  'pwa.installTitle': 'Kueki zum Home-Bildschirm hinzufügen',
  'pwa.installWhy':
    'Installiert öffnet Kueki im Vollbild, bleibt während der Überwachung stehen und kann dich benachrichtigen, wenn es im Hintergrund ist.',
  'pwa.installNudge':
    'Hinweise und Vollbild-Überwachung funktionieren nur über das Home-Bildschirm-Symbol.',
  'pwa.installShowMe': 'Zeig mir wie',
  'pwa.installLater': 'Später',
  'pwa.installAction': 'Kueki installieren',
  'pwa.installDone': 'Fertig, es ist auf meinem Home-Bildschirm',
  'pwa.installStepsIntro': 'Dauert etwa zehn Sekunden:',
  'pwa.iosStepShare': 'Tippe in der Safari-Leiste auf Teilen.',
  'pwa.iosStepAdd': 'Scrolle nach unten und wähle Zum Home-Bildschirm.',
  'pwa.iosStepOpen': 'Tippe auf Hinzufügen und öffne Kueki vom Home-Bildschirm.',
  'pwa.iosNote':
    'Nur in Safari. Hinweise funktionieren, sobald du Kueki über das Home-Bildschirm-Symbol öffnest.',
  'pwa.androidStepMenu': 'Öffne das Browser-Menü oben rechts.',
  'pwa.androidStepAdd': 'Wähle App installieren oder Zum Startbildschirm hinzufügen.',
  'pwa.androidStepOpen': 'Bestätige und öffne Kueki über das neue Symbol.',
  'pwa.androidStepPrompt': 'Tippe unten auf den Button und bestätige die Installation.',
  'pwa.genericStepMenu': 'Öffne das Menü deines Browsers.',
  'pwa.genericStepAdd': 'Wähle App installieren oder Zum Startbildschirm hinzufügen.',
  'pwa.genericStepOpen': 'Öffne Kueki über das neue Symbol auf deinem Startbildschirm.',
  'pwa.notificationsNeedInstall':
    'Benachrichtigungen brauchen Kueki auf dem Home-Bildschirm. Handys liefern Hinweise nur an installierte Apps.',
  'pwa.notificationsInstallAction': 'So installierst du',
  'pwa.updateTitle': 'Kueki-Update verfügbar',
  'pwa.updateBlocked': 'Pausiere Überwachung und Zuhören, bevor du aktualisierst.',
  'pwa.updateAction': 'Aktualisieren',
  'pwa.offlineUnavailable':
    'Offline-Installation ist nicht verfügbar. Lade neu, während du verbunden bist.',
  'pwa.iosHint':
    'Füge Kueki auf iPhone oder iPad zum Home-Bildschirm hinzu und öffne es dort, um Hinweise zu aktivieren.',
  'pwa.blocked':
    'Benachrichtigungen sind blockiert. Erlaube sie in deinen Browser- oder Geräteeinstellungen und versuch es dann erneut.',
  'pwa.gettingReady': 'Die Installation wird noch vorbereitet. Lade neu und versuch es erneut.',
  'pwa.notConfigured': 'Push-Benachrichtigungen sind auf diesem Server nicht konfiguriert.',
  'pwa.timeout':
    'Die Einrichtung der Benachrichtigungen hat zu lange gedauert. Prüfe deine Verbindung und versuch es erneut.',
});
