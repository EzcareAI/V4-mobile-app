import { useGLTF } from "@react-three/drei/native";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber/native";
import { Asset } from "expo-asset";
// biome-ignore lint/performance/noNamespaceImport: Legacy FS requires namespace import
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { PanResponder, Text, View } from "react-native";
import { Color, type Group, Mesh, MeshStandardMaterial } from "three";
import { THEME } from "@/lib/theme";

// The Metro bundler now packages this asset because of our metro.config.js update.
// In native builds, @react-three/drei expects the raw require module, not the local file URL,
// because it internally wraps it in useAsset() using expo-file-system.
const MODEL_MODULE = require("@/assets/models/body.glb");

interface Body3DSelectorProps {
	value?: string[];
	onChange?: (regions: string[]) => void;
	onInteractionStart?: () => void;
	onInteractionEnd?: () => void;
}

// Global mutable state for current drag delta.
// We use an external proxy object to bypass React renders for pure 60fps rotation.
const globalRotation = { x: 0, y: 0 };

/**
 * 3D Human Body Component.
 * Parses the GLB meshes dynamically, assigns touch handlers for raycasting,
 * and maintains the multiple selection state by toggling `emissive` materials.
 */
function BodyModel({
	value = [],
	onChange,
	uri,
}: Body3DSelectorProps & { uri: unknown }) {
	const modelRef = useRef<Group>(null);

	const { scene } = useGLTF(uri as unknown as string) as unknown as {
		scene: Group;
	};

	const [selected, setSelected] = useState<string[]>(value);

	// Respond to PanResponder drags + apply slow ambient rotation
	useFrame((_, delta) => {
		if (modelRef.current) {
			// Apply ambient rotation
			modelRef.current.rotation.y += delta * 0.15;

			// Apply user drag rotation
			if (globalRotation.y !== 0 || globalRotation.x !== 0) {
				modelRef.current.rotation.y += globalRotation.y;
				modelRef.current.rotation.x += globalRotation.x;
				// Dampen the global rotation after applying (simulates inertia)
				globalRotation.y *= 0.8;
				globalRotation.x *= 0.8;

				// Clamp x rotation so it doesn't flip completely upside down
				modelRef.current.rotation.x = Math.max(
					-0.5,
					Math.min(0.5, modelRef.current.rotation.x)
				);
			}
		}
	});

	// Toggle selection state
	const toggleRegion = (e: ThreeEvent<MouseEvent> & { object: Mesh }) => {
		// Stop raycast from penetrating to meshes behind
		e.stopPropagation();
		const meshName = e.object.name;

		const next = selected.includes(meshName)
			? selected.filter((n) => n !== meshName)
			: [...selected, meshName];

		setSelected(next);
		onChange?.(next);
	};

	// Clone the scene and apply materials so we can mutate emissive without affecting cache
	const clonedScene = useMemo(() => {
		const clone = scene.clone();

		// Setup materials for each mesh
		clone.traverse((node: unknown) => {
			if (node instanceof Mesh) {
				// Neutral plastic-like material for the base body
				const mat = new MeshStandardMaterial({
					color: 0xcc_cc_cc,
					roughness: 0.6,
					metalness: 0.1,
				});
				node.material = mat;

				// Bind hit-testing metadata
				node.userData.isBodyPart = true;
			}
		});
		return clone;
	}, [scene]);

	// Update emissive glow every render based on selection
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
			// Center the geometry and scale down (assumes typical blender metrics)
			ref={modelRef}
			scale={0.05}
		/>
	);
}

function BodyModelAssetLoader(props: Body3DSelectorProps) {
	const [modelUri, setModelUri] = useState<string | null>(null);

	// In Android release builds, passing the raw numeric require() module to useGLTF
	// fails because the GLTFLoader uses fetch(), which cannot read from the asset:// scheme.
	// We MUST use expo-file-system to copy the bundle buffer onto the physical file system (file://)
	useEffect(() => {
		async function loadAsset() {
			try {
				const assets = await Asset.loadAsync(MODEL_MODULE);
				const uri = assets[0].localUri || assets[0].uri;

				// Force copy the binary data from the Android asset:// stream into a readable physical file
				// The GLTFLoader ALSO specifically needs the .glb extension in the path to parse it perfectly
				const localPath = `${FileSystem.cacheDirectory}body.glb`;
				const fileInfo = await FileSystem.getInfoAsync(localPath);

				if (!fileInfo.exists) {
					await FileSystem.copyAsync({
						from: uri,
						to: localPath,
					});
				}

				setModelUri(localPath);
			} catch (e) {
				console.error("Fallback asset resolution failed for body.glb:", e);
			}
		}
		loadAsset();
	}, []);

	if (!modelUri) {
		return null;
	}

	return <BodyModel {...props} uri={modelUri} />;
}

export function Body3DSelector(props: Body3DSelectorProps) {
	const { value = [], onInteractionStart, onInteractionEnd } = props;

	// Only intercept gesture if they move their finger (allows tapping to pass through)
	const panResponder = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => false,
				onMoveShouldSetPanResponder: (_, gestureState) => {
					// Require at least 5px of movement to become a drag,
					// otherwise it's probably a tap for R3F to handle
					return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
				},
				onPanResponderGrant: () => {
					globalRotation.x = 0;
					globalRotation.y = 0;
					onInteractionStart?.();
				},
				onPanResponderMove: (_, gestureState) => {
					// Supply raw deltas to the R3F frame loop via the global object
					// vx/vy are velocity, dx/dy are cumulative, so we can just use velocity for smooth, delta-based turning
					globalRotation.y = gestureState.vx * 0.05;
					globalRotation.x = gestureState.vy * 0.05;
				},
				onPanResponderRelease: () => {
					onInteractionEnd?.();
				},
				onPanResponderTerminate: () => {
					onInteractionEnd?.();
				},
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
			{/* Canvas wrapper */}
			<View className="flex-1 rounded-[32px] border border-blue-100/40 bg-[#F8FBFF] shadow-xl">
				{isFocused ? (
					<Canvas
						camera={{ position: [0, 0, 10], fov: 45 }}
						style={{ flex: 1 }}
					>
						{/* DEBUG BOX: Placed explicitly OUTSIDE Suspense. If this pink box renders but the body doesn't, useGLTF is broken. If no box renders, the Canvas is definitively broken natively! */}
						<mesh position={[0, 3, 0]}>
							<boxGeometry args={[1, 1, 1]} />
							<meshStandardMaterial color="hotpink" />
						</mesh>

						<Suspense fallback={null}>
							<ambientLight intensity={0.8} />
							<hemisphereLight
								color="#ffffff"
								groundColor="#000000"
								intensity={1}
							/>
							<directionalLight intensity={2} position={[10, 10, 10]} />
							<directionalLight intensity={1} position={[-10, 5, -10]} />

							<BodyModelAssetLoader {...props} />
						</Suspense>
					</Canvas>
				) : null}

				{/* Transparent overlay for touch indication (optional) */}
				<View className="pointer-events-none absolute right-0 bottom-4 left-0 items-center">
					<View className="rounded-full bg-black/20 px-3 py-1">
						<Text className="font-medium text-white text-xs">
							Drag to rotate • Tap to select
						</Text>
					</View>
				</View>
			</View>

			{/* Selected label output below the 3D viewer */}
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
