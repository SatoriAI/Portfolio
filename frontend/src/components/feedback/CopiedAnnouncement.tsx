/**
 * Says "copied" to a screen reader when a copy succeeds: a control whose own
 * text changes in place is not reliably read out. Pair it with
 * useCopyToClipboard's `copied`.
 */
const CopiedAnnouncement = ({ copied, message }: { copied: boolean; message: string }) => (
  <span aria-live="polite" className="sr-only">
    {copied ? message : ""}
  </span>
);

export default CopiedAnnouncement;
