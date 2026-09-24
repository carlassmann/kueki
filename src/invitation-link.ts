/** The room name rides along in the hash, which never reaches the server, so the joining device
    can say which room it is about to enter before it has joined. Anyone holding the link can join
    anyway, so the name reveals nothing the code does not. */
export function invitationLink(code: string, roomName: string) {
  const hash = new URLSearchParams({ join: code, room: roomName });
  return `${location.origin}/app/join#${hash}`;
}

/** Reads an invitation back out of a location hash, with or without its leading `#`. */
export function parseInvitation(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    code: params.get('join') || '',
    roomName: params.get('room')?.trim().slice(0, 40) || '',
  };
}
