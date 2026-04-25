import { Redirect } from "expo-router";

/**
 * Body scan feature removed to comply with App Store guidelines.
 * Redirects to home if this route is ever reached.
 */
export default function BodyScanScreen() {
	return <Redirect href="/(dashboard)" />;
}
