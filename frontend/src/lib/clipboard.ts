/**
 * Copies text to the clipboard, and says whether it did. The Clipboard API
 * where the page may use it (a secure context, a permission not refused);
 * otherwise the older way, a hidden field selected and copied, which works
 * over plain http and in older browsers. Focus goes back where it was.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Refused (no permission, the document not focused): try the older way.
  }
  return copyBySelection(text);
}

function copyBySelection(text: string): boolean {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.setAttribute("aria-hidden", "true");
  // Out of sight and out of the layout, without display:none, which cannot be selected.
  Object.assign(field.style, { position: "fixed", top: "0", left: "0", opacity: "0" });
  const focused = document.activeElement as HTMLElement | null;
  document.body.appendChild(field);
  field.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
    focused?.focus({ preventScroll: true });
  }
}
