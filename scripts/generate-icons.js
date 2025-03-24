const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const ICON_SIZES = [
  48, 72, 96, 128, 144, 152, 192, 384, 512
];

async function generateIcons() {
  // Create the icons directory if it doesn't exist
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  try {
    await fs.mkdir(iconsDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  // Create an SVG of the SplitSquareVertical icon
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="14" height="20" x="5" y="2" rx="2" />
      <path d="M5 12h14" />
    </svg>
  `;

  // Save the SVG for safari-pinned-tab
  await fs.writeFile(
    path.join(iconsDir, 'safari-pinned-tab.svg'),
    svgContent.replace('currentColor', '#000000')
  );

  // Create a Buffer from the SVG
  const svgBuffer = Buffer.from(svgContent);

  // Generate icons for each size
  for (const size of ICON_SIZES) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    
    console.log(`Generated ${size}x${size} icon`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);