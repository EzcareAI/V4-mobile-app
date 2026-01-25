# Media

## Camera

- Hide navigation headers when there's a full screen camera
- Ensure to flip the camera with `mirror` to emulate social apps
- Use liquid glass buttons on cameras or HeroUI icon-only buttons
- Icons: `arrow.triangle.2.circlepath` (flip), `photo` (gallery), `bolt` (flash)
- Eagerly request camera permission
- Lazily request media library permission

```tsx
import React, { useRef, useState } from "react";
import { View, TouchableOpacity, Text, Alert } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { PlatformColor } from "react-native";
import { GlassView } from "expo-glass-effect";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "heroui-native";

function Camera({ onPicture }: { onPicture: (uri: string) => Promise<void> }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [type, setType] = useState<CameraType>("back");
  const { bottom } = useSafeAreaInsets();

  if (!permission?.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="p-4 text-foreground">Camera access is required</Text>
        <GlassView
          isInteractive
          tintColor={PlatformColor("systemBlue")}
          className="rounded-xl"
        >
          <TouchableOpacity
            onPress={requestPermission}
            className="rounded-xl p-3"
          >
            <Text className="text-white">Grant Permission</Text>
          </TouchableOpacity>
        </GlassView>
      </View>
    );
  }

  const takePhoto = async () => {
    await Haptics.selectionAsync();
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    await onPicture(photo.uri);
  };

  const selectPhoto = async () => {
    await Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      await onPicture(result.assets[0].uri);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} mirror className="flex-1" facing={type} />
      <View
        className="absolute inset-x-0 items-center gap-4"
        style={{ bottom }}
      >
        <GlassView isInteractive className="rounded-full p-2">
            <TouchableOpacity
              onPress={takePhoto}
            className="size-16 rounded-full bg-white"
            />
          </GlassView>
        <View className="flex-row justify-around px-2">
          <GlassButton onPress={selectPhoto} icon="photo" />
          <GlassButton
            onPress={() => setType((t) => (t === "back" ? "front" : "back"))}
            icon="arrow.triangle.2.circlepath"
          />
        </View>
      </View>
    </View>
  );
}
```

## Audio Playback

Use `expo-audio` not `expo-av`:

```tsx
import { useAudioPlayer } from "expo-audio";
import { Button } from "heroui-native";

const player = useAudioPlayer({
  uri: "https://stream.nightride.fm/rektory.mp3",
});

<Button onPress={() => player.play()}>Play</Button>;
```

## Audio Recording (Microphone)

```tsx
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from "expo-audio";
import { useEffect } from "react";
import { Alert } from "react-native";
import { Button } from "heroui-native";

function App() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const record = async () => {
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const stop = () => audioRecorder.stop();

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (status.granted) {
        setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      } else {
        Alert.alert("Permission to access microphone was denied");
      }
    })();
  }, []);

  return (
    <Button
      color={recorderState.isRecording ? "danger" : "primary"}
      onPress={recorderState.isRecording ? stop : record}
    >
      {recorderState.isRecording ? "Stop Recording" : "Start Recording"}
    </Button>
  );
}
```

## Video Playback

Use `expo-video` not `expo-av`:

```tsx
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";

const videoSource = "https://example.com/video.mp4";

const player = useVideoPlayer(videoSource, (player) => {
  player.loop = true;
  player.play();
});

const { isPlaying } = useEvent(player, "playingChange", {
  isPlaying: player.playing,
});

<VideoView player={player} fullscreenOptions={{}} allowsPictureInPicture />;
```

VideoView options:

- `allowsPictureInPicture`: boolean
- `contentFit`: 'contain' | 'cover' | 'fill'
- `nativeControls`: boolean
- `playsInline`: boolean
- `startsPictureInPictureAutomatically`: boolean

## Saving Media

```tsx
import * as MediaLibrary from "expo-media-library";

const { granted } = await MediaLibrary.requestPermissionsAsync();
if (granted) {
  await MediaLibrary.saveToLibraryAsync(uri);
}
```

### Saving Base64 Images

`MediaLibrary.saveToLibraryAsync` only accepts local file paths. Save base64 strings to disk first:

```tsx
import { File, Paths } from "expo-file-system/next";

function base64ToLocalUri(base64: string, filename?: string) {
  if (!filename) {
    const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,/);
    const ext = match ? match[1].split("/")[1] : "jpg";
    filename = `generated-${Date.now()}.${ext}`;
  }

  if (base64.startsWith("data:")) base64 = base64.split(",")[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(new ArrayBuffer(len));
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

  const f = new File(Paths.cache, filename);
  f.create({ overwrite: true });
  f.write(bytes);
  return f.uri;
}
```
