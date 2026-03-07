import { useGLTF } from "@react-three/drei/native";
import { Canvas } from "@react-three/fiber/native";
import { Asset } from "expo-asset";
import { cacheDirectory, copyAsync, getInfoAsync } from "expo-file-system";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Box3, Vector3 } from "three";

// Bundled GLB asset module
const MODEL_MODULE = require("@/assets/models/body.glb");

/**
 * Basic isolated cube fallback to prove WebGL works independently of GLTFLoader
 */
function FallbackCube() {
	return (
		<mesh>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color="hotpink" />
		</mesh>
	);
}

/**
 * Minimal GLB uncompressed loader view that dynamically centers and auto-scales the model
 * to ensure it doesn't render invisibly off-screen or out-of-bounds in the camera frustum.
 */
function RawModelView({ modelUri }: { modelUri: string }) {
	const { scene } = useGLTF(modelUri);

	// Ensure model bounds fit within the camera view and center properly
	useEffect(() => {
		if (scene) {
			const box = new Box3().setFromObject(scene);
			const center = box.getCenter(new Vector3());
			scene.position.sub(center); // Center the mesh exactly at [0,0,0]

			// Validate scale and metrics for the console payload
			console.log("Model Loaded:", {
				childrenCount: scene.children.length,
				boundingBox: box.getSize(new Vector3()),
			});
		}
	}, [scene]);

	return <primitive object={scene} scale={0.05} />;
}

export default function ModelViewerDebugScreen() {
	const [modelUri, setModelUri] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [statusLogs, setStatusLogs] = useState<string[]>([
		"Initializing debug screen...",
	]);

	const log = useCallback((msg: string) => {
		setStatusLogs((prev) => [...prev, `[${new Date().toISOString()}] ${msg}`]);
	}, []);

	useEffect(() => {
		async function copyAssetToPhysicalGltf() {
			try {
				log("Loading MODEL_MODULE via expo-asset...");
				const assets = await Asset.loadAsync(MODEL_MODULE);
				const resolvedUri = assets[0].localUri || assets[0].uri;

				if (!resolvedUri) {
					throw new Error("Asset resolved with null URI");
				}
				log(`Asset resolved mapped path: ${resolvedUri}`);

				// GLTFLoader rigidly enforces that the file path must end with .glb or .gltf
				// to invoke the binary GLB parser rather than failing to JSON.parse() it.
				// Metro's static asset packager scrubs extensions (e.g. `ExponentAsset-1234x`),
				// causing GLTFLoader to crash silently within Suspense on android.

				log("Forcing physical copy of asset with .glb extension...");

				const physicalPath = `${cacheDirectory}debug-body.glb`;
				const fileInfo = await getInfoAsync(physicalPath);

				// Only copy if we haven't already extracted the asset locally
				if (fileInfo.exists) {
					log("Cache hit! Found physical .glb extraction on disk.");
				} else {
					log("Copying asset stream to cache directory...");
					await copyAsync({
						from: resolvedUri,
						to: physicalPath,
					});
				}

				const finalFileInfo = await getInfoAsync(physicalPath);
				if (finalFileInfo.exists) {
					log(`Final physical asset size: ${finalFileInfo.size} bytes`);
				}

				setModelUri(physicalPath);
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : String(err);
				log(`ERROR: ${errorMsg}`);
				setError(errorMsg);
			}
		}

		copyAssetToPhysicalGltf();
	}, [log]);

	return (
		<View className="flex-1 bg-neutral-900 pt-12">
			<View className="px-4 pb-4">
				<Text className="font-bold text-white text-xl">3D Renderer Debug</Text>
				<View className="mt-4 rounded-xl bg-black/50 p-4">
					{statusLogs.map((msg) => (
						<Text className="font-mono text-green-400 text-xs" key={msg}>
							{msg}
						</Text>
					))}
				</View>
			</View>

			<View className="m-4 flex-1 overflow-hidden rounded-2xl border border-white/20 bg-black">
				<Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
					<ambientLight intensity={1} />
					<directionalLight intensity={2} position={[5, 5, 5]} />

					<Suspense fallback={<FallbackCube />}>
						{modelUri ? <RawModelView modelUri={modelUri} /> : <FallbackCube />}
					</Suspense>
				</Canvas>
			</View>

			{!(modelUri || error) && (
				<View className="absolute inset-0 items-center justify-center bg-black/60">
					<ActivityIndicator color="white" size="large" />
					<Text className="mt-4 font-mono text-white">
						Extracting GLB binary payload...
					</Text>
				</View>
			)}
		</View>
	);
}
