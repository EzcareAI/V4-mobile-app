/**
 * Body region definitions for the interactive body diagram.
 *
 * Coordinate system:
 *   viewBox = "0 0 400 700"  (front view, left half of the provided image)
 *   The image is 818px wide × 636px tall; we crop
 *   the left half for the front view (0..409px wide)
 *   and map into a 400×700 logical space.
 *
 * HOW TO REFINE COORDINATES
 * --------------------------
 * 1. Open the body image in Inkscape / Figma / Illustrator.
 * 2. Draw polygons over each body region.
 * 3. Export as SVG and copy the `points` string here.
 *
 * Or use the DEBUG mode in BodyRegionSelector (pass debug={true}) which:
 *   - Shows each region's id as text in the centre of the polygon
 *   - Logs touch coordinates to the console so you can see where you tapped
 */

export interface BodyRegion {
	/** Unique id — stored in onboarding state */
	id: string;
	/** Human-readable label shown below the diagram */
	label: string;
	/** SVG polygon points in "x,y x,y …" format inside viewBox 0 0 400 700 */
	points: string;
}

/** Front-view regions */
export const FRONT_REGIONS: BodyRegion[] = [
	{
		id: "head",
		label: "Head & Neck",
		// Oval covering head and tapers to neck
		points:
			"160,10 200,5 240,10 255,50 250,80 240,95 230,105 200,110 170,105 160,95 150,80 145,50",
	},
	{
		id: "chest",
		label: "Chest",
		// Upper torso from collar bones to mid-chest
		points:
			"140,110 260,110 275,130 280,160 270,185 200,195 130,185 120,160 125,130",
	},
	{
		id: "abdomen",
		label: "Abdomen",
		// Mid torso from chest to hip-level
		points:
			"130,185 270,185 275,215 270,250 260,270 200,280 140,270 130,250 125,215",
	},
	{
		id: "pelvis",
		label: "Pelvis & Hips",
		// Hip area
		points:
			"140,270 260,270 270,295 265,320 240,340 200,345 160,340 135,320 130,295",
	},
	{
		id: "left_arm",
		label: "Left Arm",
		// Patient's left arm (screen right)
		points:
			"270,110 310,115 335,130 350,160 345,200 325,225 310,235 295,225 285,195 280,160 275,130",
	},
	{
		id: "right_arm",
		label: "Right Arm",
		// Patient's right arm (screen left)
		points:
			"130,110 90,115 65,130 50,160 55,200 75,225 90,235 105,225 115,195 120,160 125,130",
	},
	{
		id: "left_forearm_hand",
		label: "Left Hand & Forearm",
		points:
			"310,235 350,240 370,265 365,300 355,320 340,325 325,315 315,295 308,265",
	},
	{
		id: "right_forearm_hand",
		label: "Right Hand & Forearm",
		points: "90,235 50,240 30,265 35,300 45,320 60,325 75,315 85,295 92,265",
	},
	{
		id: "left_thigh",
		label: "Left Thigh",
		// Patient's left
		points:
			"200,345 265,340 275,370 270,410 255,440 235,450 220,445 210,430 205,395 200,345",
	},
	{
		id: "right_thigh",
		label: "Right Thigh",
		points:
			"200,345 135,340 125,370 130,410 145,440 165,450 180,445 190,430 195,395 200,345",
	},
	{
		id: "left_lower_leg",
		label: "Left Lower Leg",
		points:
			"220,445 255,440 265,470 260,510 250,540 235,555 220,550 210,535 205,500 210,465",
	},
	{
		id: "right_lower_leg",
		label: "Right Lower Leg",
		points:
			"180,445 145,440 135,470 140,510 150,540 165,555 180,550 190,535 195,500 190,465",
	},
	{
		id: "left_foot",
		label: "Left Foot",
		points:
			"210,550 250,545 265,560 265,580 255,590 235,595 215,590 205,575 205,558",
	},
	{
		id: "right_foot",
		label: "Right Foot",
		points:
			"190,550 150,545 135,560 135,580 145,590 165,595 185,590 195,575 195,558",
	},
];

/** All regions as a flat list for lookup by id */
export const ALL_REGIONS: BodyRegion[] = FRONT_REGIONS;

/** Returns the label for a given region id */
export function getRegionLabel(id: string): string {
	return ALL_REGIONS.find((r) => r.id === id)?.label ?? id;
}
