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

// globalVelocity.y = current spin velocity (radians) applied each frame, decays after release
const globalVelocity = { y: 0 };
// Set to true while user finger is down so we know to apply drag velocity once per event
const dragState = { isDragging: false, pendingY: 0 };
// Shared camera zoom distance
const globalZoom = { z: 10 };

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

	useFrame((state) => {
		if (modelRef.current) {
			if (dragState.isDragging) {
				// Apply pending touch delta ONCE per move event — not every frame
				if (dragState.pendingY !== 0) {
					modelRef.current.rotation.y += dragState.pendingY;
					globalVelocity.y = dragState.pendingY; // capture for momentum on release
					dragState.pendingY = 0;
				}
				// Gradually restore X tilt back to upright while drag is active
				modelRef.current.rotation.x *= 0.85;
			} else if (Math.abs(globalVelocity.y) > 0.0001) {
				// After release: apply decaying momentum spin
				modelRef.current.rotation.y += globalVelocity.y;
				globalVelocity.y *= 0.88;
				if (Math.abs(globalVelocity.y) < 0.0001) globalVelocity.y = 0;
				// Restore X tilt back to upright
				modelRef.current.rotation.x *= 0.9;
			} else {
				// Auto-spin gently when no interaction
				modelRef.current.rotation.y += 0.004;
				modelRef.current.rotation.x *= 0.95;
			}

			// Smooth camera zoom
			state.camera.position.z +=
				(globalZoom.z - state.camera.position.z) * 0.1;
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
	const { scale, centerOffset } = useMemo(() => {
		try {
			// Reset transformations
			scene.parent = null;
			scene.position.set(0, 0, 0);
			scene.rotation.set(0, 0, 0);
			scene.scale.set(1, 1, 1);
			scene.updateMatrixWorld(true);

			// Hide hidden meshes FIRST so they don't affect bounding calculations
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

			// Update matrices after setting visibility
			scene.updateMatrixWorld(true);

			// Manually compute bounding box of ONLY visible meshes
			const box = new Box3();
			box.makeEmpty();
			scene.traverse((child: unknown) => {
				if (child instanceof Mesh && child.visible) {
					if (!child.geometry.boundingBox) {
						child.geometry.computeBoundingBox();
					}
					// Only include if geometry actually has bounds
					if (child.geometry.boundingBox) {
						const childBox = child.geometry.boundingBox.clone();
						childBox.applyMatrix4(child.matrixWorld);
						box.union(childBox);
					}
				}
			});

			const size = new Vector3();
			box.getSize(size);
			const center = new Vector3();
			box.getCenter(center);

			// Shift Y slightly down to counteract top-heavy meshes and allow headroom
			center.y += size.y * 0.05;

			const maxDim = Math.max(size.x, size.y, size.z);
			let calculatedScale = 1;
			// 7.5 units fits comfortably nicely inside the standard FOV of 45 at distance 10
			if (maxDim > 0 && maxDim !== Number.POSITIVE_INFINITY) {
				calculatedScale = 7.5 / maxDim;
			}

			return {
				scale: calculatedScale,
				centerOffset: new Vector3(-center.x, -center.y, -center.z),
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

	// Track precise gestures manually
	const lastPan = useRef({ x: 0, y: 0 });
	const lastPinchDist = useRef<number | null>(null);

	// Reset camera tracking on component mount
	useEffect(() => {
		dragState.isDragging = false;
		dragState.pendingY = 0;
		globalVelocity.y = 0;
		globalZoom.z = 10;
	}, []);

	const panResponder = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => false,
				onMoveShouldSetPanResponder: (_, g) =>
					Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
				onPanResponderGrant: () => {
					dragState.isDragging = true;
					dragState.pendingY = 0;
					globalVelocity.y = 0;
					lastPan.current = { x: 0, y: 0 };
					lastPinchDist.current = null;
					onInteractionStart?.();
				},
				onPanResponderMove: (e, g) => {
					const touches = e.nativeEvent.touches;
					if (touches && touches.length === 2) {
						// ── Pinch-to-zoom ──────────────────────────────
						const dx = touches[0].pageX - touches[1].pageX;
						const dy = touches[0].pageY - touches[1].pageY;
						const dist = Math.sqrt(dx * dx + dy * dy);
						if (lastPinchDist.current !== null) {
							const delta = lastPinchDist.current - dist;
							globalZoom.z = Math.max(
								5,
								Math.min(18, globalZoom.z + delta * 0.08)
							);
						}
						lastPinchDist.current = dist;
					} else {
						// ── Single-finger Y-axis rotation only ──────────────
						lastPinchDist.current = null;
						const dx = g.dx - lastPan.current.x;
						// Set pendingY — applied exactly ONCE in the next useFrame call
						dragState.pendingY = dx * 0.012;
						lastPan.current = { x: g.dx, y: g.dy };
					}
				},
				onPanResponderRelease: () => {
					dragState.isDragging = false;
					lastPinchDist.current = null;
					onInteractionEnd?.();
				},
				onPanResponderTerminate: () => {
					dragState.isDragging = false;
					lastPinchDist.current = null;
					onInteractionEnd?.();
				},
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
