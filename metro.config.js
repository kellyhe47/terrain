// Expo Metro config. sql.js (asm build) references node core modules inside
// `typeof require` guards that never run in the browser; map them to an empty
// module so Metro can bundle it for web.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);
const empty = path.resolve(__dirname, 'src/db/shims/empty.js');
const nodeCore = new Set(['fs', 'path', 'crypto']);
const prev = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (nodeCore.has(moduleName) && /sql\.js/.test(context.originModulePath)) {
    return { type: 'sourceFile', filePath: empty };
  }
  return prev ? prev(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};
config.resolver.assetExts = [...config.resolver.assetExts, 'mp4'];
module.exports = config;
