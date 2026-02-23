/**
 * BodyRegionSelector
 *
 * Renders a body photograph with an SVG overlay.
 * Each region is:
 *   - Outlined with a thin boundary line (always visible)
 *   - Filled with a BLUE tint when selected (~25% opacity)
 *   - Tappable for multi-select toggle
 *
 * USAGE
 * -----
 *   <BodyRegionSelector
 *     value={selectedIds}
 *     onChange={setSelectedIds}
 *   />
 *
 * REFINE COORDINATES
 * ------------------
 * Pass debug={true} to show region ids and tap coordinates.
 * Use an SVG editor (Inkscape / Figma) to trace the image and
 * copy polygon points from the exported SVG into body-regions.ts.
 */
import { useState } from "react";
import { Image, Text, useWindowDimensions, View } from "react-native";
import Svg, { Polygon, Text as SvgText } from "react-native-svg";
import { THEME } from "@/lib/theme";
import { type BodyRegion, FRONT_REGIONS, getRegionLabel } from "./body-regions";

// ── The body image ───────────────────────────────────────────────────────────
// The image should be the front-view column of the provided anatomy photograph.
// biome-ignore lint/style/useImportType: require() call cannot use type import
const BODY_IMAGE = require("@/assets/images/body-diagram.jpg");

// ── Coordinate system: must match body-regions.ts ─────────────────────────
const VIEW_BOX_W = 400;
const VIEW_BOX_H = 700;
const ASPECT = VIEW_BOX_H / VIEW_BOX_W; // ≈ 1.75

interface BodyRegionSelectorProps {
	value?: string[];
	onChange?: (regions: string[]) => void;
	accentColor?: string;
	debug?: boolean;
}

const RegionPolygon = ({
	region,
	isSelected,
	onToggle,
	accentColor,
	debug,
}: {
	region: BodyRegion;
	isSelected: boolean;
	onToggle: (id: string) => void;
	accentColor: string;
	debug?: boolean;
}) => {
	// Centre of polygon — used for debug label
	const pts = region.points.split(" ").map((p) => {
		const [x, y] = p.split(",").map(Number);
		return { x, y };
	});
	const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
	const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;

	return (
		<>
			<Polygon
				fill={isSelected ? accentColor : "transparent"}
				fillOpacity={isSelected ? 0.28 : 0}
				onPress={() => onToggle(region.id)}
				points={region.points}
				stroke={accentColor}
				strokeOpacity={isSelected ? 0.9 : 0.35}
				strokeWidth={isSelected ? 2 : 1.2}
			/>
			{debug && (
				<SvgText
					fill={THEME.accent}
					fontSize={10}
					textAnchor="middle"
					x={cx}
					y={cy}
				>
					{region.id}
				</SvgText>
			)}
		</>
	);
};

export const BodyRegionSelector = ({
	value = [],
	onChange,
	accentColor = THEME.accent,
	debug = false,
}: BodyRegionSelectorProps) => {
	const [selected, setSelected] = useState<string[]>(value);
	const { width: screenW } = useWindowDimensions();

	// Make the diagram fill screen width minus padding (px-6 = 48px)
	const diagramW = screenW - 48;
	const diagramH = diagramW * ASPECT;

	const toggle = (id: string) => {
		const next = selected.includes(id)
			? selected.filter((s) => s !== id)
			: [...selected, id];
		setSelected(next);
		onChange?.(next);
	};

	const selectedLabels = selected.map(getRegionLabel);

	return (
		<View>
			{/* ── Diagram container ────────────────────────── */}
			<View
				className="self-center overflow-hidden rounded-[32px] border border-blue-100/40 shadow-2xl shadow-blue-200/40"
				style={{
					width: diagramW,
					height: diagramH,
					backgroundColor: "#F8FBFF",
				}}
			>
				{/* Body photograph */}
				<Image
					resizeMode="cover"
					source={BODY_IMAGE}
					style={{ position: "absolute", width: "100%", height: "100%" }}
				/>

				{/* SVG touch-region overlay — same dimensions as the image */}
				<Svg
					height={diagramH}
					style={{ position: "absolute", top: 0, left: 0 }}
					viewBox={`0 0 ${VIEW_BOX_W} ${VIEW_BOX_H}`}
					width={diagramW}
				>
					{FRONT_REGIONS.map((region) => (
						<RegionPolygon
							accentColor={accentColor}
							debug={debug}
							isSelected={selected.includes(region.id)}
							key={region.id}
							onToggle={toggle}
							region={region}
						/>
					))}
				</Svg>
			</View>

			{/* ── Selection summary ────────────────────────── */}
			{selectedLabels.length > 0 && (
				<View
					className="mt-4 flex-row flex-wrap gap-2"
					style={{ paddingHorizontal: 4 }}
				>
					{selectedLabels.map((label) => (
						<View
							className="rounded-full px-3 py-1"
							key={label}
							style={{ backgroundColor: THEME.accentBg }}
						>
							<Text
								className="font-semibold text-xs"
								style={{ color: THEME.accent }}
							>
								{label}
							</Text>
						</View>
					))}
				</View>
			)}

			{selectedLabels.length === 0 && (
				<Text className="mt-4 text-center text-[#73808C] text-sm">
					Tap body areas to select them
				</Text>
			)}
		</View>
	);
};
