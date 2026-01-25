# CSS Gradients

> **New Architecture Only**: CSS gradients require React Native's New Architecture (Fabric). They are not available in the old architecture or Expo Go.

Use CSS gradients with the `experimental_backgroundImage` style property. Note that `experimental_backgroundImage` must use inline styles as it's not yet supported by Tailwind/NativeWind.

## Linear Gradients

```tsx
// Top to bottom
<View
  className="h-48 w-full"
  style={{
    experimental_backgroundImage:
      "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%)",
  }}
/>

// Left to right
<View
  className="h-48 w-full"
  style={{
    experimental_backgroundImage:
      "linear-gradient(to right, #ff0000 0%, #0000ff 100%)",
  }}
/>

// Diagonal
<View
  className="h-48 w-full"
  style={{
    experimental_backgroundImage:
      "linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)",
  }}
/>

// Using degrees
<View
  className="h-48 w-full"
  style={{
    experimental_backgroundImage:
      "linear-gradient(135deg, transparent 0%, black 100%)",
  }}
/>
```

## Radial Gradients

```tsx
// Circle at center
<View
  className="h-48 w-full"
  style={{
    experimental_backgroundImage:
      "radial-gradient(circle at center, rgba(255, 0, 0, 1) 0%, rgba(0, 0, 255, 1) 100%)",
  }}
/>

// Ellipse
<View
  className="h-48 w-full"
  style={{
    experimental_backgroundImage:
      "radial-gradient(ellipse at center, #fff 0%, #000 100%)",
  }}
/>

// Positioned
<View
  className="h-48 w-full"
  style={{
    experimental_backgroundImage:
      "radial-gradient(circle at top left, #ff0000 0%, transparent 70%)",
  }}
/>
```

## Multiple Gradients

Stack multiple gradients by comma-separating them:

```tsx
<View
  className="h-48 w-full"
  style={{
    experimental_backgroundImage: `
      linear-gradient(to bottom, transparent 0%, black 100%),
      radial-gradient(circle at top right, rgba(255, 0, 0, 0.5) 0%, transparent 50%)
    `,
  }}
/>
```

## Common Patterns

### Overlay on Image

```tsx
<View className="relative">
  <Image source={{ uri: "..." }} className="h-[200px] w-full" />
  <View
    className="absolute inset-0"
    style={{
      experimental_backgroundImage:
        "linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 50%)",
    }}
  />
</View>
```

### Frosted Glass Effect

```tsx
<View
  className="rounded-2xl p-4"
  style={{
    experimental_backgroundImage:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
    backdropFilter: "blur(10px)",
  }}
/>
```

### Button Gradient

```tsx
<Pressable
  className="items-center rounded-lg p-4"
  style={{
    experimental_backgroundImage:
      "linear-gradient(to bottom, #4CAF50 0%, #388E3C 100%)",
  }}
>
  <Text className="text-center text-white">Submit</Text>
</Pressable>
```

## Important Notes

- Do NOT use `expo-linear-gradient` — use CSS gradients instead
- Gradients are strings, not objects
- Use `rgba()` for transparency, or `transparent` keyword
- Color stops use percentages (0%, 50%, 100%)
- Direction keywords: `to top`, `to bottom`, `to left`, `to right`, `to top left`, etc.
- Degree values: `45deg`, `90deg`, `135deg`, etc.
- `experimental_backgroundImage` requires inline styles (not Tailwind)
