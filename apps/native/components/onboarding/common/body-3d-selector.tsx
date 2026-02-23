import { useGLTF } from "@react-three/drei/native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import { Suspense, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import * as THREE from "three";
import { THEME } from "@/lib/theme";

// The Metro bundler now packages this asset because of our metro.config.js update.
const MODEL_URI = require("@/assets/models/body.glb");

interface Body3DSelectorProps {
	value?: string[];
	onChange?: (regions: string[]) => void;
}

/**
 * 3D Human Body Component.
 * Parses the GLB meshes dynamically, assigns touch handlers for raycasting,
 * and maintains the multiple selection state by toggling `emissive` materials.
 */
function BodyModel({ value = [], onChange }: Body3DSelectorProps) {
	const modelRef = useRef<THREE.Group>(null);
	const { scene } = useGLTF(MODEL_URI) as any;

	const [selected, setSelected] = useState<string[]>(value);

	// Slow ambient rotation around Y axis
	useFrame((state, delta) => {
		if (modelRef.current) {
			modelRef.current.rotation.y += delta * 0.15;
		}
	});

	// Toggle selection state
	const toggleRegion = (e: any) => {
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
		clone.traverse((node: any) => {
			if (node.isMesh) {
				// Neutral plastic-like material for the base body
				const mat = new THREE.MeshStandardMaterial({
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
	clonedScene.traverse((node: any) => {
		if (node.isMesh && node.material) {
			const isSelected = selected.includes(node.name);
			node.material.emissive = new THREE.Color(
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

export function Body3DSelector(props: Body3DSelectorProps) {
	const { value = [] } = props;

	return (
		<View className="relative w-full flex-1">
			{/* Canvas wrapper */}
			<View className="flex-1 overflow-hidden rounded-[32px] border border-blue-100/40 bg-[#F8FBFF] shadow-xl">
				<Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
					<ambientLight intensity={0.4} />
					<directionalLight intensity={1.5} position={[10, 10, 10]} />
					<directionalLight intensity={0.8} position={[-10, 5, -10]} />

					<Suspense fallback={null}>
						<BodyModel {...props} />
					</Suspense>
				</Canvas>

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
