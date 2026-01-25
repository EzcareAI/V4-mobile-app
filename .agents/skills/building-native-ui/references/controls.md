# Native Controls

Use HeroUI Native components for a consistent, theme-aware, and accessible experience.

## Switch

Use for binary on/off settings.

```tsx
import { Switch } from "heroui-native";
import { useState } from "react";

const [isSelected, setIsSelected] = useState(false);

<Switch isSelected={isSelected} onSelectedChange={setIsSelected}>
  <Switch.Label>Enable Notifications</Switch.Label>
</Switch>;
```

### With Description

```tsx
<Switch isSelected={isSelected} onSelectedChange={setIsSelected}>
  <View>
    <Switch.Label>Dark Mode</Switch.Label>
    <Text className="text-sm text-muted-foreground">
      Use a dark theme for the interface
    </Text>
  </View>
</Switch>
```

## Tabs (Segmented Control)

Use `Tabs` for non-navigational interactions like switching views or modes.

```tsx
import { Tabs } from "heroui-native";
import { useState } from "react";

const [selectedTab, setSelectedTab] = useState("photos");

<Tabs value={selectedTab} onValueChange={setSelectedTab}>
  <Tabs.List>
    <Tabs.Trigger value="photos">
      <Tabs.Label>Photos</Tabs.Label>
    </Tabs.Trigger>
    <Tabs.Trigger value="videos">
      <Tabs.Label>Videos</Tabs.Label>
    </Tabs.Trigger>
    <Tabs.Trigger value="albums">
      <Tabs.Label>Albums</Tabs.Label>
    </Tabs.Trigger>
  </Tabs.List>
</Tabs>;
```

## TextField

Use `TextField` for text input. It includes labels, error states, and descriptions.

```tsx
import { TextField } from "heroui-native";

<TextField>
  <TextField.Label>Username</TextField.Label>
  <TextField.Input placeholder="Enter username" />
  <TextField.Description>
    This will be your public display name.
  </TextField.Description>
</TextField>;
```

### With Error State

```tsx
<TextField isInvalid>
  <TextField.Label>Email</TextField.Label>
  <TextField.Input placeholder="user@example.com" />
  <TextField.ErrorMessage>Please enter a valid email.</TextField.ErrorMessage>
</TextField>
```

## Checkbox

For multiple selection options.

```tsx
import { Checkbox } from "heroui-native";

const [accepted, setAccepted] = useState(false);

<Checkbox isSelected={accepted} onSelectedChange={setAccepted}>
  <Checkbox.Label>I accept the terms and conditions</Checkbox.Label>
</Checkbox>;
```

## Radio Group

For single selection from a list.

```tsx
import { RadioGroup } from "heroui-native";

const [value, setValue] = useState("light");

<RadioGroup value={value} onValueChange={setValue}>
  <RadioGroup.Label>Theme</RadioGroup.Label>
  <RadioGroup.Item value="light">
    <RadioGroup.ItemLabel>Light</RadioGroup.ItemLabel>
  </RadioGroup.Item>
  <RadioGroup.Item value="dark">
    <RadioGroup.ItemLabel>Dark</RadioGroup.ItemLabel>
  </RadioGroup.Item>
</RadioGroup>;
```

## Slider

Continuous value selection.

```tsx
import Slider from "@react-native-community/slider";
import { useState } from "react";

const [value, setValue] = useState(0.5);

<Slider
  value={value}
  onValueChange={setValue}
  minimumValue={0}
  maximumValue={1}
/>;
```

### Customization

```tsx
<Slider
  value={value}
  onValueChange={setValue}
  minimumValue={0}
  maximumValue={100}
  step={1}
  minimumTrackTintColor="#007AFF"
  maximumTrackTintColor="#E5E5EA"
  thumbTintColor="#007AFF"
/>
```

### Discrete Steps

```tsx
<Slider
  value={value}
  onValueChange={setValue}
  minimumValue={0}
  maximumValue={10}
  step={1}
/>
```

## Date/Time Picker

Compact pickers with popovers. Has built-in haptics.

```tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";

const [date, setDate] = useState(new Date());

<DateTimePicker
  value={date}
  onChange={(event, selectedDate) => {
    if (selectedDate) setDate(selectedDate);
  }}
  mode="datetime"
/>;
```

### Modes

- `date` — Date only
- `time` — Time only
- `datetime` — Date and time

### Display Styles

```tsx
// Compact inline (default)
<DateTimePicker value={date} mode="date" />

// Spinner wheel
<DateTimePicker
  value={date}
  mode="date"
  display="spinner"
  className="h-[150px] w-[200px]"
/>

// Full calendar
<DateTimePicker value={date} mode="date" display="inline" />
```

### Time Intervals

```tsx
<DateTimePicker
  value={date}
  mode="time"
  minuteInterval={15}
/>
```

### Min/Max Dates

```tsx
<DateTimePicker
  value={date}
  mode="date"
  minimumDate={new Date(2020, 0, 1)}
  maximumDate={new Date(2030, 11, 31)}
/>
```

## Stepper

Increment/decrement numeric values.

```tsx
import { Stepper } from "react-native";
import { useState } from "react";

const [count, setCount] = useState(0);

<Stepper
  value={count}
  onValueChange={setCount}
  minimumValue={0}
  maximumValue={10}
/>;
```

## TextField

Use `TextField` for text input. It wraps the native TextInput and adds labels, descriptions, and error states.

```tsx
import { TextField } from "heroui-native";

<TextField>
  <TextField.Label>Username</TextField.Label>
  <TextField.Input placeholder="Enter username" />
</TextField>;
```

### Keyboard Types

The `TextField.Input` component accepts all standard React Native TextInput props.

```tsx
// Email
<TextField>
  <TextField.Label>Email</TextField.Label>
  <TextField.Input 
    placeholder="Enter email"
    keyboardType="email-address" 
    autoCapitalize="none" 
  />
</TextField>

// Phone (with start content/icon)
<TextField>
  <TextField.Label>Phone</TextField.Label>
  <TextField.Input 
    placeholder="(555) 555-5555"
    keyboardType="phone-pad"
  />
</TextField>

// Password
<TextField>
  <TextField.Label>Password</TextField.Label>
  <TextField.Input 
    placeholder="Enter password"
    secureTextEntry 
  />
</TextField>
```

### Multiline

```tsx
<TextField>
  <TextField.Label>Bio</TextField.Label>
  <TextField.Input
    placeholder="Tell us about yourself"
    multiline
    numberOfLines={4}
    textAlignVertical="top"
    className="min-h-[100px]"
  />
</TextField>
```

## Picker (Wheel)

For selection from many options (5+ items).

```tsx
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";

const [selected, setSelected] = useState("js");

<Picker selectedValue={selected} onValueChange={setSelected}>
  <Picker.Item label="JavaScript" value="js" />
  <Picker.Item label="TypeScript" value="ts" />
  <Picker.Item label="Python" value="py" />
  <Picker.Item label="Go" value="go" />
</Picker>;
```

## Best Practices

- **Theme**: HeroUI components automatically adapt to the app's theme (light/dark).
- **Accessibility**: Components like `Switch`, `Checkbox`, and `TextField` have built-in accessibility support.
- **Validation**: Use `isInvalid` and `ErrorMessage` props/subcomponents for form validation feedback.
- **Composition**: Most HeroUI components are composable (e.g., `TextField.Label`, `Tabs.Trigger`), allowing for flexible layouts.
