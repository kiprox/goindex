export default function cdnpath(path) {
  let cdn = process.env.VUE_APP_CDN_PATH;
  if (process.env.NODE_ENV === "release") {
    return cdn + path;
  }
  return path;
}
