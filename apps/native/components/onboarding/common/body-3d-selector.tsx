import { useGLTF } from "@react-three/drei/native";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber/native";
import { Asset } from "expo-asset";
import { useFocusEffect } from "expo-router";
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { ActivityIndicator, PanResponder, Text, View } from "react-native";
import { Color, type Group, Mesh, MeshStandardMaterial } from "three";
import { THEME } from "@/lib/theme";

// Metro bundles this as a numeric asset module ID.
// expo-asset resolves it to a file:// path before passing to GLTFLoader.
const MODEL_MODULE = require("@/assets/models/body.glb");

interface Body3DSelectorProps {
	value?: string[];
	onChange?: (regions: string[]) => void;
	onInteractionStart?: () => void;
	onInteractionEnd?: () => void;
}

// Global mutable state for current drag delta.
// We use an external proxy to bypass React renders for pure 60fps rotation.
const globalRotation = { x: 0, y: 0 };

/**
 * Inner 3D body mesh component. Receives a resolved `file://` URI string.
 * useGLTF requires a proper string URL — numeric module IDs are resolved
 * upstream in BodyModelLoader before this component mounts.
 */
function BodyModel({
	value = [],
	onChange,
	modelUri,
}: Body3DSelectorProps & { modelUri: string }) {
	const modelRef = useRef<Group>(null);

	// useGLTF from @react-three/drei/native calls useLoader(GLTFLoader, path)
	// which requires a string path. We pass the resolved file:// URI here.
	const { scene } = useGLTF(modelUri) as unknown as { scene: Group };

	const [selected, setSelected] = useState<string[]>(value);

	useFrame((_, delta) => {
		if (modelRef.current) {
			modelRef.current.rotation.y += delta * 0.15;

			if (globalRotation.y !== 0 || globalRotation.x !== 0) {
				modelRef.current.rotation.y += globalRotation.y;
				modelRef.current.rotation.x += globalRotation.x;
				globalRotation.y *= 0.8;
				globalRotation.x *= 0.8;

				modelRef.current.rotation.x = Math.max(
					-0.5,
					Math.min(0.5, modelRef.current.rotation.x)
				);
			}
		}
	});

	const toggleRegion = (e: ThreeEvent<MouseEvent> & { object: Mesh }) => {
		e.stopPropagation();
		const meshName = e.object.name;
		const next = selected.includes(meshName)
			? selected.filter((n) => n !== meshName)
			: [...selected, meshName];
		setSelected(next);
		onChange?.(next);
	};

	// Clone the scene and apply our own materials
	const clonedScene = useMemo(() => {
		const clone = scene.clone();
		clone.traverse((node: unknown) => {
			if (node instanceof Mesh) {
				node.material = new MeshStandardMaterial({
					color: 0xcc_cc_cc,
					roughness: 0.6,
					metalness: 0.1,
				});
				node.userData.isBodyPart = true;
			}
		});
		return clone;
	}, [scene]);

	// Update emissive highlight each render pass for selected zones
	clonedScene.traverse((node: unknown) => {
		if (node instanceof Mesh && node.material instanceof MeshStandardMaterial) {
			const isSelected = selected.includes(node.name);
			node.material.emissive = new Color(
				isSelected ? THEME.accent : 0x00_00_00
			);
			node.material.emissiveIntensity = isSelected ? 0.6 : 0;
		}
	});

	return (
		<primitive
			object={clonedScene}
			onPointerDown={toggleRegion}
			position={[0, -5, 0]}
			ref={modelRef}
			scale={0.05}
		/>
	);
}

/**
 * Resolves the bundled GLB asset to a local file:// URI using expo-asset,
 * then renders BodyModel inside R3F Suspense once the URI is ready.
 * This two-step approach is required because:
 *  - useGLTF (drei/native) delegates to useLoader(GLTFLoader, path)
 *  - GLTFLoader.load() uses fetch() which CANNOT read asset:// URIs on Android
 *  - expo-asset.loadAsync() returns a localUri that IS a valid file:// path
 */
function BodyModelLoader(props: Body3DSelectorProps) {
	const [modelUri, setModelUri] = useState<string | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		Asset.loadAsync(MODEL_MODULE)
			.then((assets) => {
				if (!mounted) return;
				// localUri is the physical file:// path on device storage.
				// It may be null on first cold start before Android extracts the asset.
				const uri = assets[0].localUri ?? assets[0].uri;
				if (uri) {
					setModelUri(uri);
				} else {
					setLoadError("Asset URI unavailable");
				}
			})
			.catch((e: unknown) => {
				if (!mounted) return;
				const msg = e instanceof Error ? e.message : String(e);
				setLoadError(msg);
			});
		return () => {
			mounted = false;
		};
	}, []);

	if (loadError) {
		// Surface the error visibly in the 3D scene for debugging
		return null;
	}

	if (!modelUri) {
		// Asset still resolving — Suspense handles this; render null until ready
		return null;
	}

	return <BodyModel {...props} modelUri={modelUri} />;
}

export function Body3DSelector(props: Body3DSelectorProps) {
	const { value = [], onInteractionStart, onInteractionEnd } = props;

	const panResponder = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => false,
				onMoveShouldSetPanResponder: (_, g) =>
					Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
				onPanResponderGrant: () => {
					globalRotation.x = 0;
					globalRotation.y = 0;
					onInteractionStart?.();
				},
				onPanResponderMove: (_, g) => {
					globalRotation.y = g.vx * 0.05;
					globalRotation.x = g.vy * 0.05;
				},
				onPanResponderRelease: () => onInteractionEnd?.(),
				onPanResponderTerminate: () => onInteractionEnd?.(),
			}),
		[onInteractionStart, onInteractionEnd]
	);

	const [isFocused, setIsFocused] = useState(false);

	useFocusEffect(
		useCallback(() => {
			setIsFocused(true);
			return () => setIsFocused(false);
		}, [])
	);

	return (
		<View className="relative w-full flex-1" {...panResponder.panHandlers}>
			<View className="flex-1 rounded-[32px] border border-blue-100/40 bg-[#F8FBFF] shadow-xl">
				{isFocused ? (
					<Canvas
						camera={{ position: [0, 0, 10], fov: 45 }}
						style={{ flex: 1 }}
					>
						<ambientLight intensity={0.8} />
						<hemisphereLight
							color="#ffffff"
							groundColor="#000000"
							intensity={1}
						/>
						<directionalLight intensity={2} position={[10, 10, 10]} />
						<directionalLight intensity={1} position={[-10, 5, -10]} />

						<Suspense
							fallback={
								// Visible spinner in 3D space while the GLB loads
								<mesh>
									<planeGeometry args={[0, 0]} />
									<meshBasicMaterial opacity={0} transparent />
								</mesh>
							}
						>
							<BodyModelLoader {...props} />
						</Suspense>
					</Canvas>
				) : (
					// Show a spinner while the screen focuses (before Canvas mounts)
					<View className="flex-1 items-center justify-center">
						<ActivityIndicator color={THEME.accent} size="large" />
					</View>
				)}

				{/* Touch hint overlay */}
				<View className="pointer-events-none absolute right-0 bottom-4 left-0 items-center">
					<View className="rounded-full bg-black/20 px-3 py-1">
						<Text className="font-medium text-white text-xs">
							Drag to rotate • Tap to select
						</Text>
					</View>
				</View>
			</View>

			{/* Selection chips */}
			<View className="mt-4 min-h-[40px] flex-row flex-wrap justify-center gap-2 px-2">
				{value.length === 0 ? (
					<Text className="text-[#73808C] text-sm">
						Tap body areas to select
					</Text>
				) : (
					value.map((id) => (
						<View
							className="rounded-full px-3 py-1"
							key={id}
							style={{ backgroundColor: THEME.accentBg }}
						>
							<Text
								className="font-semibold text-xs"
								style={{ color: THEME.accent }}
							>
								{id}
							</Text>
						</View>
					))
				)}
			</View>
		</View>
	);
}
