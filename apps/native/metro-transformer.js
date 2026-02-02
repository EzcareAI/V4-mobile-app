const upstreamTransformer = require("@expo/metro-runtime/build/transform-worker/transform-worker");

module.exports.transform = async (config) => {
    const result = await upstreamTransformer.transform(config);

    // Replace import.meta with a safe alternative
    if (result.output && result.output[0]) {
        result.output[0].data.code = result.output[0].data.code
            .replace(/import\.meta\.env/g, "process.env")
            .replace(/import\.meta/g, "({})");
    }

    return result;
};
