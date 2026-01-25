# Form Sheets in Expo Router

This skill covers implementing form sheets with footers using Expo Router's Stack navigator and HeroUI Native components.

## Overview

Form sheets are modal presentations that appear as a card sliding up from the bottom of the screen. They're ideal for:

- Quick actions and confirmations
- Settings panels
- Login/signup flows
- Action sheets with custom content

**Requirements:**

- Expo Router Stack navigator
- HeroUI Native

## Basic Usage

### Form Sheet with Footer

Configure the Stack.Screen with transparent backgrounds and sheet presentation:

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="about"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.25],
          headerTransparent: true,
          contentStyle: { backgroundColor: "transparent" },
          sheetGrabberVisible: true,
        }}
      >
        <Stack.Header className="bg-transparent"></Stack.Header>
      </Stack.Screen>
    </Stack>
  );
}
```

### Form Sheet Screen Content

Use `flex-1` to allow the content to fill available space.

```tsx
// app/about.tsx
import { View, Text } from "react-native";

export default function AboutSheet() {
  return (
    <View className="flex-1">
      {/* Main content */}
      <View className="flex-1 p-4">
        <Text>Sheet Content</Text>
      </View>

      {/* Footer - stays at bottom */}
      <View className="p-4">
        <Text>Footer Content</Text>
      </View>
    </View>
  );
}
```

## Key Options

| Option                | Type       | Description                                                 |
| --------------------- | ---------- | ----------------------------------------------------------- |
| `presentation`        | `string`   | Set to `'formSheet'` for sheet presentation                 |
| `sheetGrabberVisible` | `boolean`  | Shows the drag handle at the top of the sheet               |
| `sheetAllowedDetents` | `number[]` | Array of detent heights (0-1 range, e.g., `[0.25]` for 25%) |
| `headerTransparent`   | `boolean`  | Makes header background transparent                         |
| `contentStyle`        | `object`   | Style object for the screen content container               |
| `title`               | `string`   | Screen title (set to `''` for no title)                     |

## Common Detent Values

- `[0.25]` - Quarter sheet (compact actions)
- `[0.5]` - Half sheet (medium content)
- `[0.75]` - Three-quarter sheet (detailed forms)
- `[0.25, 0.5, 1]` - Multiple stops (expandable sheet)

## Complete Example

```tsx
// _layout.tsx
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen
        name="confirm"
        options={{
          contentStyle: { backgroundColor: "transparent" },
          presentation: "formSheet",
          title: "",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.25],
          headerTransparent: true,
        }}
      >
        <Stack.Header className="bg-transparent">
          <Stack.Header.Right />
        </Stack.Header>
      </Stack.Screen>
    </Stack>
  );
}
```

```tsx
// app/confirm.tsx
// app/confirm.tsx
import { View, Text } from "react-native";
import { router } from "expo-router";
import { Button } from "heroui-native";

export default function ConfirmSheet() {
  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center p-5">
        <Text className="mb-2 text-xl font-bold text-foreground">
          Confirm Action
        </Text>
        <Text className="text-center text-base text-muted-foreground">
          Are you sure you want to proceed? This action cannot be undone.
        </Text>
      </View>

      <View className="flex-row gap-3 p-4">
        <Button
          variant="flat"
          className="flex-1"
          onPress={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          className="flex-1"
          onPress={() => {
            // Perform action
            router.back();
          }}
        >
          Confirm
        </Button>
      </View>
    </View>
  );
}
```

## Troubleshooting

### Content not filling sheet

Make sure the root View uses `flex-1`:

```tsx
<View className="flex-1">{/* content */}</View>
```

### Sheet background showing through

Set `contentStyle: { backgroundColor: 'transparent' }` in options and style your content container with the desired background color instead.
