const { ImageKit } = require("@imagekit/nodejs")
const { toFile } = require("@imagekit/nodejs/core/uploads")

const ImageKitClient = new ImageKit({
    privateKey: process.env.IMAGE_KIT_KEY || "dummy_key_to_prevent_startup_crash",
})

/**
 * Upload a file buffer to ImageKit.
 * Uses the SDK's toFile() helper to convert the raw Buffer into a proper
 * File object — avoids base64 encoding (which adds ~33% overhead).
 */
async function uploadFile(buffer, options = {}) {
    const fileName = `${options.prefix || "music"}_${Date.now()}`;

    console.time(`[ImageKit] ${fileName}`);

    // Convert the raw buffer into a File object that the SDK accepts natively.
    const file = await toFile(buffer, fileName);

    const result = await ImageKitClient.files.upload({
        file,
        fileName,
        folder: options.folder || "/music",
    });

    console.timeEnd(`[ImageKit] ${fileName}`);

    return result;
}

module.exports = { uploadFile }
