const { withProjectBuildGradle } = require("@expo/config-plugins");

/**
 * Expo Config Plugin to resolve AndroidX / Support Library duplicate class conflicts.
 * It forces the exclusion of 'com.android.support' from all Gradle configurations.
 */
const withAndroidXExclusion = (config) => {
	return withProjectBuildGradle(config, (config) => {
		if (config.modResults.language === "groovy") {
			config.modResults.contents = addExclusionRules(
				config.modResults.contents
			);
		}
		return config;
	});
};

function addExclusionRules(buildGradle) {
	const exclusionBlock = `
allprojects {
    configurations.all {
        resolutionStrategy {
            force 'androidx.core:core:1.15.0'
            force 'androidx.core:core-ktx:1.15.0'
            force 'androidx.annotation:annotation:1.9.1'
            force 'androidx.versionedparcelable:versionedparcelable:1.1.1'
        }
        // Exclude all legacy android support libraries
        exclude group: 'com.android.support'
        exclude group: 'com.android.support.test'
    }
}
`;

	if (!buildGradle.includes("exclude group: 'com.android.support'")) {
		return buildGradle + exclusionBlock;
	}
	return buildGradle;
}

module.exports = withAndroidXExclusion;
