const worker = require("metro-react-native-babel-transformer");

module.exports.transform = async (props) => {
    const { src, filename, options } = props;

    // Replace import.meta with a safe alternative to prevent Metro crashes on some environments
    const safeSrc = src
        .replace(/import\.meta\.env/g, "process.env")
        .replace(/import\.meta/g, "({})");

    return worker.transform({ ...props, src: safeSrc });
};
