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
        }
        exclude group: 'com.android.support', module: 'support-v4'
        exclude group: 'com.android.support', module: 'support-compat'
        exclude group: 'com.android.support', module: 'support-media-compat'
        exclude group: 'com.android.support', module: 'support-core-utils'
        exclude group: 'com.android.support', module: 'support-core-ui'
        exclude group: 'com.android.support', module: 'support-fragment'
    }
}
`;

	if (!buildGradle.includes("exclude group: 'com.android.support'")) {
		return buildGradle + exclusionBlock;
	}
	return buildGradle;
}

module.exports = withAndroidXExclusion;
