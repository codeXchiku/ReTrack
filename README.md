This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.


## Architecture

Study Dojo follows a strict modular feature architecture:

### 5 Core Architectural Rules
1. **Isolated Core**: `src/core` must never import from `src/features`.
2. **Public API Boundaries**: A feature may import `src/core/*` and other features only through their `index.ts`. Never import another feature's inner files.
3. **Registry-Driven Integration**: Features are plugged in only by adding one line in `src/app/features.ts`. Never edit another feature to make room for a new one.
4. **Decoupled Communication**: Features communicate solely via typed events on `src/core/events` or extension slots via `src/core/registry`. No direct state or cross-store coupling.
5. **Pure Logic Separation**: Screens contain UI only. Business logic lives in `logic/` as pure, portable functions (no React Native imports) unit-tested with Jest. Database access lives only in `data/` repositories.

### How to Add a Feature in 3 Steps
1. **Create the Feature Folder**: Add `src/features/<name>` with `index.ts` (public API) and `feature.ts` declaring its `FeatureManifest` (declaring tabs, subTabs, screens, slots, backup, or init hooks).
2. **Implement Logic & UI**: Build screens in `screens/`, components in `components/`, and business logic as pure functions in `logic/` with unit tests.
3. **Register the Manifest**: Add the feature manifest to the `features` array in `src/app/features.ts`.

## Known limits

- **Background Alarm Delivery in Doze Mode**: Phase completion alerts scheduled via Android's AlarmManager (`allowWhileIdle: true`) use inexact alarms to respect system battery optimizations without requiring the sensitive `SCHEDULE_EXACT_ALARM` special permission on Android 12+. Consequently, while an ongoing notification displays a continuous live countdown in the status bar, the audible/vibrating completion alert may be delayed by a few minutes when a device is deep in Android Doze mode on certain OEM power management configurations.
