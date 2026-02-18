// Use metro-babel-transformer (Metro 0.83+) so resolution works in monorepo/EAS builds.
// Legacy name metro-react-native-babel-transformer is not always resolvable from apps/native.
const worker = require("metro-babel-transformer");

module.exports.transform = (props) => {
	const { src } = props;

	// Replace import.meta with a safe alternative to prevent Metro crashes on some environments
	const safeSrc = src
		.replace(/import\.meta\.env/g, "process.env")
		.replace(/import\.meta/g, "({})");

	return worker.transform({ ...props, src: safeSrc });
};
