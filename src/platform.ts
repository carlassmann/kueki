const agent = navigator.userAgent;

export function isIOS() {
  return (
    /iphone|ipad|ipod/i.test(agent) || (/macintosh/i.test(agent) && navigator.maxTouchPoints > 1)
  );
}

export function isAndroid() {
  return /android/i.test(agent);
}

export function isMobile() {
  return isIOS() || isAndroid() || /mobile|blackberry|iemobile|opera mini/i.test(agent);
}
