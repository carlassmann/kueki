import { messages, translate } from '@ccssmnn/intl';

export { baseCommonMessages, deCommonMessages };

const baseCommonMessages = messages({
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.privacy': 'Privacy',
  'common.error.generic': 'Something went wrong. Try again.',
  'common.error.connection': 'Connection problem. Try again.',
  'common.relative.seconds': '{$seconds}s ago',
  'common.relative.minutes': '{$minutes}m ago',
  'common.copyUnavailable': 'Copy is unavailable. Select and copy the invitation code below.',
  'common.dismissError': 'Dismiss error',
  'common.closeDialog': 'Close dialog',
  'common.audioLevel': 'Audio level',

  'role.baby': 'Baby',
  'role.parent': 'Parent',

  'nav.monitor': 'Monitor',
  'nav.activity': 'Activity',
  'nav.settings': 'Settings',
  'nav.roomLabel': 'Room navigation',
  'nav.projectLinks': 'Project links',
  'app.title': 'Kueki · A little peace of mind',
  'app.description':
    'A little peace of mind. A private, audio-only baby monitor for your own devices.',
  'app.homeLabel': 'Kueki homepage',
  'app.roomHomeLabel': 'Kueki home',
  'app.accessRemoved': 'Your access to this room was removed.',
  'app.switchFailed': 'Could not switch rooms.',
  'app.connectBeforeSwitch': 'Connect before switching rooms.',
  'notFound.title': 'Page not found',
  'notFound.body': 'This page has wandered off. Your monitor is still where you left it.',
  'notFound.action': 'Open your monitor',
  'notFound.mascotAlt': 'Kueki, dozing on a pillow',

  'forgetRoom.title': 'Forget {$room}?',
  'forgetRoom.body':
    'This device stops remembering {$room}. The room itself keeps running, but you’ll need the invitation code to add it back here.',
  'forgetRoom.confirm': 'Forget {$room}',
  'forgetRoom.keep': 'Keep this room',

  'language.title': 'Language',
  'language.description': 'Choose the language Kueki uses.',
  'language.label': 'Language',
  'language.name.en': 'English',
  'language.name.de': 'Deutsch',
});

const deCommonMessages = translate(baseCommonMessages, {
  'common.cancel': 'Abbrechen',
  'common.save': 'Speichern',
  'common.privacy': 'Datenschutz',
  'common.error.generic': 'Etwas ist schiefgelaufen. Versuch es noch einmal.',
  'common.error.connection': 'Verbindungsproblem. Versuch es noch einmal.',
  'common.relative.seconds': 'vor {$seconds} s',
  'common.relative.minutes': 'vor {$minutes} min',
  'common.copyUnavailable':
    'Kopieren ist nicht möglich. Markiere den Einladungscode unten und kopiere ihn.',
  'common.dismissError': 'Fehler schließen',
  'common.closeDialog': 'Dialog schließen',
  'common.audioLevel': 'Audiolautstärke',

  'role.baby': 'Baby',
  'role.parent': 'Elternteil',

  'nav.monitor': 'Monitor',
  'nav.activity': 'Aktivität',
  'nav.settings': 'Einstellungen',
  'nav.roomLabel': 'Raumnavigation',
  'nav.projectLinks': 'Projektlinks',
  'app.title': 'Kueki · Eine kleine Ruhe',
  'app.description':
    'Eine kleine Ruhe. Ein privates, reines Audio-Babyphone für deine eigenen Geräte.',
  'app.homeLabel': 'Kueki-Startseite',
  'app.roomHomeLabel': 'Kueki-Start',
  'app.accessRemoved': 'Dein Zugriff auf diesen Raum wurde entfernt.',
  'app.switchFailed': 'Räume konnten nicht gewechselt werden.',
  'app.connectBeforeSwitch': 'Stelle die Verbindung her, bevor du den Raum wechselst.',
  'notFound.title': 'Seite nicht gefunden',
  'notFound.body':
    'Diese Seite ist abhandengekommen. Dein Monitor ist noch da, wo du ihn gelassen hast.',
  'notFound.action': 'Öffne deinen Monitor',
  'notFound.mascotAlt': 'Kueki, dösend auf einem Kissen',

  'forgetRoom.title': '{$room} vergessen?',
  'forgetRoom.body':
    'Dieses Gerät merkt sich {$room} nicht mehr. Der Raum selbst läuft weiter, aber du brauchst den Einladungscode, um ihn hier wieder hinzuzufügen.',
  'forgetRoom.confirm': '{$room} vergessen',
  'forgetRoom.keep': 'Diesen Raum behalten',

  'language.title': 'Sprache',
  'language.description': 'Wähle die Sprache, die Kueki verwendet.',
  'language.label': 'Sprache',
  'language.name.en': 'English',
  'language.name.de': 'Deutsch',
});
