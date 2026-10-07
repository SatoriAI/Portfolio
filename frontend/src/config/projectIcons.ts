/**
 * Each project's own app icon, keyed by the project's title as the backend
 * gives it, shown in the project tabs and in the frame's band when there is no
 * screenshot. Copies of the icon each site serves (its favicon, touch icon or
 * logo), kept here so the home page never depends on another site staying up
 * or keeping a file where it was. A white mark made for dark browser tabs is
 * set on a dark tile so it reads on the page. Where a title has none here, the
 * backend's image is used.
 */
export const projectIcons: Readonly<Record<string, string>> = {
  OpenGrant: "/projects/icons/opengrant.png",
  Konfio: "/projects/icons/konfio.svg",
  Athlo: "/projects/icons/athlo.png",
  AdLume: "/projects/icons/adlume.svg",
  Slip: "/projects/icons/slip.png",
  Picko: "/projects/icons/picko.png",
  tURL: "/projects/icons/turl.png",
};
