/**
 * Whether the home page's current is held at the hub (see Circuit): once it
 * has reached the hub and closed the circuit, it stays there while the
 * reader is within `stayPx` of the foot of the page, so a small scroll there
 * neither draws the wire back nor switches the contact graph off. Scrolled
 * further up, the hold lets go, and the circuit closes again only when the
 * current next reaches the hub.
 */
export const holdsAtHub = (closed: boolean, scrollY: number, foot: number, stayPx: number) =>
  closed && scrollY >= foot - stayPx;
