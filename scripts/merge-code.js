const fs = require("fs");
const path = require("path");

/**
 * Recursively get all files in a directory
 * @param {string} dir - The directory to traverse
 * @returns {string[]} - Array of full file paths
 */
function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath));
    } else {
      results.push(filePath);
    }
  });

  return results;
}
/**
 * Merge contents of all files in folder and subfolders
 * @param {string} folderPath - The source folder
 * @param {string} outputPath - Path to save merged output
 */
function mergeFilesToOutput(folderPath, outputPath = "merged_output.txt") {
  const allFiles = getAllFiles(folderPath);
  const writeStream = fs.createWriteStream(outputPath, { flags: "w" });

  allFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");

    writeStream.write(`\n--- ${file} ---\n`);
    writeStream.write(content);
    writeStream.write("\n");
  });

  writeStream.end();
  console.log(`✅ Merged ${allFiles.length} files into: ${outputPath}`);
}

// --- Run ---
const targetFolder = process.argv[2]; // Get folder path from CLI argument
if (!targetFolder) {
  console.error(
    "❌ Please provide a folder path.\nUsage: node merge-files.js ./your-folder"
  );
  process.exit(1);
}

mergeFilesToOutput(path.resolve(targetFolder));
