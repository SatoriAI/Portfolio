#!/bin/sh
# Draws og/og.svg to public/og.png, the 1200 x 630 social preview, with
# headless Chrome so the site's own font files set the text. Run it by hand
# after editing the SVG and commit both; the build only copies the PNG.
#
#   sh og/render.sh            (from frontend/)
#   CHROME=/path/to/chrome sh og/render.sh
set -eu

here=$(cd "$(dirname "$0")" && pwd)
chrome=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}

"${chrome}" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --allow-file-access-from-files --window-size=1200,630 \
  --screenshot="${here}/../public/og.png" "file://${here}/og.svg"
