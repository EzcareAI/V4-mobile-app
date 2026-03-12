import { useGLTF } from "@react-three/drei/native";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber/native";
import { Asset } from "expo-asset";
import {
	cacheDirectory,
	copyAsync,
	getInfoAsync,
} from "expo-file-system/legacy";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, PanResponder, Text, View } from "react-native";
import {
	Box3,
	Color,
	type Group,
	Mesh,
	MeshStandardMaterial,
	Vector3,
} from "three";
import { THEME } from "@/lib/theme";

// Metro bundles this as a numeric asset module ID.
// expo-asset resolves it to a file:// path before passing to GLTFLoader.
const MODEL_MODULE = require("@/assets/models/body.glb");

/** Maps raw GLB mesh node names → human-readable display labels */
const ZONE_LABELS: Record<string, string> = {
	head: "Head",
	neck: "Neck",
	Chest: "Chest",
	Abdominal: "Abdomen",
	Pelvic: "Pelvis",
	Upper_back: "Upper Back",
	Lower_back: "Lower Back",
	Right_shoulder: "Right Shoulder",
	Left_shoulder: "Left Shoulder",
	Right_brachial: "Right Upper Arm",
	Left_brachial: "Left Upper Arm",
	Right_arm: "Right Arm",
	Left_arm: "Left Arm",
	"Right_fore _arm": "Right Forearm",
	"Left_fore _arm": "Left Forearm",
	Right_wriist: "Right Wrist",
	Left_wrist: "Left Wrist",
	Right_lats: "Right Lats",
	left_lats: "Left Lats",
	Right_thigh: "Right Thigh",
	"Left _thigh": "Left Thigh",
	Right_knee: "Right Knee",
	"Left _knee": "Left Knee",
	Right_lower_leg: "Right Lower Leg",
	"Left _lower_leg": "Left Lower Leg",
	"Left _leg": "Left Leg",
	Right_foot: "Right Foot",
	"Left _foot": "Left Foot",
};

/** Returns the human-readable label for a mesh name, or a cleaned-up fallback */
function zoneLabel(meshName: string): string {
	return (
		ZONE_LABELS[meshName] ??
		meshName.replace(/_/g, " ").replace(/ {2,}/g, " ").trim()
	);
}

interface Body3DSelectorProps {
	value?: string[];
	onChange?: (regions: string[]) => void;
	onInteractionStart?: () => void;
	onInteractionEnd?: () => void;
	gender?: "male" | "female";
	onZoneSelect?: (zoneId: string) => void;
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

	// Meshes that exist in the GLB but should not be selectable or highlighted
	const HIDDEN_MESHES = new Set([
		"Cube",
		"Object.006",
		"male_Base_mesh",
		"male_Base_mesh.007",
	]);

	const toggleRegion = (e: ThreeEvent<MouseEvent> & { object: Mesh }) => {
		e.stopPropagation();
		const meshName = e.object.name;
		// Ignore non-anatomy meshes
		if (HIDDEN_MESHES.has(meshName)) {
			return;
		}
		const next = selected.includes(meshName)
			? selected.filter((n) => n !== meshName)
			: [...selected, meshName];
		setSelected(next);
		onChange?.(next);
	};

	// Calculate bounds and compute a perfect scale factor without cloning
	// (cloning often breaks SkinnedMeshes causing them to be invisible)
	const { scale, centerOffset } = useMemo(() => {
		try {
			// CRITICAL: Since `useGLTF` caches the scene, remounts will have the old
			// transforms (scale and position). We must reset them locally before
			// using `Box3.setFromObject(scene)` which evaluates world bounds.
			scene.parent = null;
			scene.position.set(0, 0, 0);
			scene.rotation.set(0, 0, 0);
			scene.scale.set(1, 1, 1);
			scene.updateMatrixWorld(true);

			const box = new Box3().setFromObject(scene);
			const size = new Vector3();
			box.getSize(size);
			const center = new Vector3();
			box.getCenter(center);

			const maxDim = Math.max(size.x, size.y, size.z);
			let calculatedScale = 1;
			// If maxDim is extremely huge or tiny, auto-scale to 8 units
			if (maxDim > 0 && maxDim !== Number.POSITIVE_INFINITY) {
				calculatedScale = 8 / maxDim;
			}

			scene.traverse((node: unknown) => {
				if (node instanceof Mesh && !node.userData.hasCustomMaterial) {
					const isHidden = HIDDEN_MESHES.has(node.name);
					if (isHidden) {
						node.visible = false;
					} else {
						node.material = new MeshStandardMaterial({
							color: 0xcc_cc_cc,
							roughness: 0.6,
							metalness: 0.1,
						});
						node.userData.isBodyPart = true;
					}
					node.userData.hasCustomMaterial = true;
				}
			});

			return {
				scale: calculatedScale,
				centerOffset: center.multiplyScalar(-1),
			};
		} catch (err) {
			console.error(`[Body3D] Scene parse error: ${err}`);
			return { scale: 1, centerOffset: new Vector3(0, 0, 0) };
		}
	}, [scene, HIDDEN_MESHES]);

	// Update emissive highlight each render pass for selected zones
	useMemo(() => {
		scene.traverse((node: unknown) => {
			if (
				node instanceof Mesh &&
				node.material instanceof MeshStandardMaterial
			) {
				const isSelected = selected.includes(node.name);
				node.material.emissive = new Color(
					isSelected ? THEME.accent : 0x00_00_00
				);
				node.material.emissiveIntensity = isSelected ? 0.6 : 0;
			}
		});
	}, [scene, selected]);

	return (
		<group ref={modelRef} scale={scale}>
			<group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
				<primitive object={scene} onPointerDown={toggleRegion} />
			</group>
		</group>
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
async function prepareAsset(): Promise<string> {
	const assets = await Asset.loadAsync(MODEL_MODULE);
	const uri = assets[0].localUri ?? assets[0].uri;

	if (!uri) {
		throw new Error("Asset missing URI after loadAsync");
	}

	// Android asset bundles strip the .glb extension resulting in silent GLTFLoader crashes
	const physicalPath = `${cacheDirectory}body-diagram.glb`;
	const fileInfo = await getInfoAsync(physicalPath);

	if (!fileInfo.exists) {
		await copyAsync({ from: uri, to: physicalPath });
	}

	return physicalPath;
}

export default function Body3DSelector(props: Body3DSelectorProps) {
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

	const [modelUri, setModelUri] = useState<string | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		prepareAsset()
			.then((uri) => {
				if (mounted) {
					setModelUri(uri);
				}
			})
			.catch((err: unknown) => {
				if (mounted) {
					const msg = err instanceof Error ? err.message : String(err);
					console.error(`[Body3D] Asset Error: ${msg}`);
					setLoadError(msg);
				}
			});

		return () => {
			mounted = false;
		};
	}, []);

	const isReady = modelUri !== null;
	const showModel = !loadError && isReady;
	const showLoading = !(loadError || isReady);

	return (
		<View className="relative w-full" {...panResponder.panHandlers}>
			<View className="h-[440px] w-full overflow-hidden rounded-[40px] border-2 border-slate-50 bg-white/60 shadow-inner">
				{loadError && (
					<View className="flex-1 items-center justify-center bg-red-50/50 p-6">
						<Text className="mb-2 text-center font-bold text-base text-red-500">
							Asset Mount Error
						</Text>
						<Text className="text-center font-mono text-gray-600 text-xs">
							{loadError}
						</Text>
					</View>
				)}

				{showModel && (
					<Canvas
						camera={{ position: [0, 0, 10], fov: 45 }}
						style={{ flex: 1 }}
					>
						<ambientLight intensity={1.8} />
						<directionalLight intensity={2.5} position={[10, 10, 10]} />
						<spotLight
							angle={0.15}
							intensity={1.5}
							penumbra={1}
							position={[5, 10, 5]}
						/>

						<Suspense fallback={null}>
							<BodyModel {...props} modelUri={modelUri as string} />
						</Suspense>
					</Canvas>
				)}

				{showLoading && (
					<View className="flex-1 items-center justify-center bg-slate-50/50">
						<ActivityIndicator color={THEME.accent} size="large" />
						{!modelUri && (
							<Text className="mt-4 font-medium text-gray-400 text-xs">
								Extracting 3D Model...
							</Text>
						)}
					</View>
				)}

				{!loadError && (
					<View className="pointer-events-none absolute right-0 bottom-4 left-0 items-center">
						<View className="rounded-full bg-[#1A2138]/5 px-4 py-1.5 ring-1 ring-[#1A2138]/10">
							<Text className="font-bold text-[#60708F] text-[10px] uppercase tracking-widest">
								Drag to rotate • Tap to select
							</Text>
						</View>
					</View>
				)}
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
								{zoneLabel(id)}
							</Text>
						</View>
					))
				)}
			</View>
		</View>
	);
}
