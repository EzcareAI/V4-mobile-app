# Visual Effects

## Backdrop Blur

Use `expo-blur` for blur effects. Prefer systemMaterial tints as they adapt to dark mode.

```tsx
import { BlurView } from "expo-blur";

<BlurView tint="systemMaterial" intensity={100} />;
```

### Tint Options

```tsx
// System materials (adapt to dark mode)
<BlurView tint="systemMaterial" />
<BlurView tint="systemThinMaterial" />
<BlurView tint="systemUltraThinMaterial" />
<BlurView tint="systemThickMaterial" />
<BlurView tint="systemChromeMaterial" />

// Basic tints
<BlurView tint="light" />
<BlurView tint="dark" />
<BlurView tint="default" />

// Prominent (more visible)
<BlurView tint="prominent" />

// Extra light/dark
<BlurView tint="extraLight" />
```

### Intensity

Control blur strength with `intensity` (0-100):

```tsx
<BlurView tint="systemMaterial" intensity={50} />  // Subtle
<BlurView tint="systemMaterial" intensity={100} /> // Full
```

### Rounded Corners

BlurView requires `overflow: 'hidden'` to clip rounded corners:

```tsx
<BlurView
  tint="systemMaterial"
  intensity={100}
  className="overflow-hidden rounded-2xl"
/>
```

### Overlay Pattern

Common pattern for overlaying blur on content:

```tsx
<View className="relative">
  <Image source={{ uri: "..." }} className="h-[200px] w-full" />
  <BlurView
    tint="systemUltraThinMaterial"
    intensity={80}
    className="absolute inset-x-0 bottom-0 p-4"
  >
    <Text className="text-white">Caption</Text>
  </BlurView>
</View>
```

## Glass Effects (iOS 26+)

Use `expo-glass-effect` for liquid glass backdrops on iOS 26+.

```tsx
import { GlassView } from "expo-glass-effect";

<GlassView className="rounded-2xl p-4">
  <Text>Content inside glass</Text>
</GlassView>;
```

### Standard Cards with HeroUI

For standard cards, use HeroUI `Card`:

```tsx
import { Card } from "heroui-native";

<Card className="p-4">
  <Card.Title>Title</Card.Title>
  <Card.Description>Description</Card.Description>
</Card>;
```

### Interactive Glass

Add `isInteractive` for buttons and pressable glass:

```tsx
import { GlassView } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { PlatformColor } from "react-native";
import { Button } from "heroui-native";

<GlassView isInteractive className="rounded-full">
  <Button
    size="lg"
    variant="ghost"
    isIconOnly
    className="rounded-full"
    onPress={handlePress}
  >
    <SymbolView name="plus" tintColor={PlatformColor("label")} size={32} />
  </Button>
</GlassView>;
```

### Glass Buttons

Create liquid glass buttons:

```tsx
function GlassButton({ icon, onPress }) {
  return (
    <GlassView isInteractive className="rounded-full">
      <Pressable className="p-3" onPress={onPress}>
        <SymbolView
          name={icon}
          tintColor={PlatformColor("label")}
          size={24}
        />
      </Pressable>
    </GlassView>
  );
}

// Usage
<GlassButton icon="plus" onPress={handleAdd} />
<GlassButton icon="gear" onPress={handleSettings} />
```

### Glass Card

```tsx
<GlassView className="rounded-[20px] p-5">
  <Text className="text-lg font-semibold text-foreground">Card Title</Text>
  <Text className="mt-2 text-secondary-foreground">
    Card content goes here
  </Text>
</GlassView>
```

### Checking Availability

```tsx
import { isLiquidGlassAvailable } from "expo-glass-effect";

if (isLiquidGlassAvailable()) {
  // Use GlassView
} else {
  // Fallback to BlurView or solid background
}
```

### Fallback Pattern

```tsx
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { BlurView } from "expo-blur";

function AdaptiveGlass({ children, className }) {
  if (isLiquidGlassAvailable()) {
    return <GlassView className={className}>{children}</GlassView>;
  }

  return (
    <BlurView tint="systemMaterial" intensity={80} className={className}>
      {children}
    </BlurView>
  );
}
```

## Sheet with Glass Background

Make sheet backgrounds liquid glass on iOS 26+:

```tsx
<Stack.Screen
  name="sheet"
  options={{
    presentation: "formSheet",
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.5, 1.0],
    contentStyle: { backgroundColor: "transparent" },
  }}
/>
```

## Best Practices

- Use `systemMaterial` tints for automatic dark mode support
- Always set `overflow-hidden` on BlurView for rounded corners
- Use `isInteractive` on GlassView for buttons and pressables
- Check `isLiquidGlassAvailable()` and provide fallbacks
- Avoid nesting blur views (performance impact)
- Keep blur intensity reasonable (50-100) for readability
- Use HeroUI `Card` for standard content containers instead of custom blur/glass implementations unless a specific effect is needed.
