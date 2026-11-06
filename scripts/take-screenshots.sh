#!/usr/bin/env bash
# Takes the App Store screenshots on an iOS simulator, without taps.
#
# The app is built in the Release configuration with EXPO_PUBLIC_SEED_DEMO=1. In that
# build, the app loads demo data into an empty database and reads the launch arguments
# -demoRoute and -demoRecord. Normal builds do not contain this behavior.
#
# Usage: scripts/take-screenshots.sh [--skip-build]
# Environment: DEVICE_NAME (default "iPhone 17 Pro Max"), OUTPUT_DIR (default fastlane/screenshots/en-US)

set -euo pipefail

cd "$(dirname "$0")/.."

DEVICE_NAME="${DEVICE_NAME:-iPhone 17 Pro Max}"
OUTPUT_DIR="${OUTPUT_DIR:-fastlane/screenshots/en-US}"
BUNDLE_ID="dev.zirkelc.heatmap"
DERIVED_DATA="ios/build"
APP_PATH="$DERIVED_DATA/Build/Products/Release-iphonesimulator/Heatmap.app"
# Location of the simulator: Montmartre in Paris, where the demo trip ends
LOCATION="48.8858,2.3418"
# Time for the app to start, load the map tiles and navigate
SETTLE_SECONDS=18

DEVICE_ID=$(xcrun simctl list devices available -j | node -e '
  const name = process.argv[1];
  const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
  // Use the device with the newest iOS version, so that each run uses the same simulator
  const version = (runtime) => runtime.replace(/^.*iOS-/, "").split("-").map(Number);
  const newestFirst = Object.keys(data.devices)
    .filter((runtime) => runtime.includes("iOS"))
    .sort((a, b) => {
      const [x, y] = [version(a), version(b)];
      return y[0] - x[0] || (y[1] ?? 0) - (x[1] ?? 0);
    });
  const device = newestFirst.flatMap((runtime) => data.devices[runtime]).find((d) => d.name === name);
  if (!device) { console.error(`No simulator named "${name}"`); process.exit(1); }
  console.log(device.udid);
' "$DEVICE_NAME")

echo "Simulator: $DEVICE_NAME ($DEVICE_ID)"
xcrun simctl boot "$DEVICE_ID" 2>/dev/null || true
xcrun simctl bootstatus "$DEVICE_ID" >/dev/null

if [[ "${1:-}" != "--skip-build" ]]; then
  if [[ ! -d ios ]]; then
    CI=1 npx expo prebuild --platform ios
  fi
  echo "Building the Release app with demo data..."
  EXPO_PUBLIC_SEED_DEMO=1 xcodebuild \
    -workspace ios/Heatmap.xcworkspace \
    -scheme Heatmap \
    -configuration Release \
    -sdk iphonesimulator \
    -destination "id=$DEVICE_ID" \
    -derivedDataPath "$DERIVED_DATA" \
    build >/tmp/heatmap-screenshots-build.log 2>&1 \
    || { echo "Build failed, see /tmp/heatmap-screenshots-build.log"; exit 1; }
fi

xcrun simctl status_bar "$DEVICE_ID" override \
  --time 9:41 --batteryState charged --batteryLevel 100 \
  --cellularMode active --cellularBars 4 --wifiBars 3

mkdir -p "$OUTPUT_DIR"

# Install a fresh copy for each screenshot, so that each one starts from the same demo data
shoot() {
  local name="$1"
  shift
  xcrun simctl terminate "$DEVICE_ID" "$BUNDLE_ID" 2>/dev/null || true
  xcrun simctl uninstall "$DEVICE_ID" "$BUNDLE_ID" 2>/dev/null || true
  xcrun simctl install "$DEVICE_ID" "$APP_PATH"
  xcrun simctl privacy "$DEVICE_ID" grant location "$BUNDLE_ID"
  xcrun simctl location "$DEVICE_ID" set "$LOCATION"
  xcrun simctl launch "$DEVICE_ID" "$BUNDLE_ID" "$@" >/dev/null
  sleep "$SETTLE_SECONDS"
  xcrun simctl io "$DEVICE_ID" screenshot "$OUTPUT_DIR/$name.png" >/dev/null 2>&1
  echo "Saved $OUTPUT_DIR/$name.png"
}

shoot "01-map"
shoot "02-recording" -demoRecord 1
shoot "03-history" -demoRoute history
shoot "04-series" -demoRoute series

xcrun simctl terminate "$DEVICE_ID" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl status_bar "$DEVICE_ID" clear
