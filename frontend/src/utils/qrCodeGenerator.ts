import QRCodeLib from 'qrcode';

export interface QROptions {
  size?: number;
  fgColor?: string;
  bgColor?: string;
  logoSize?: number; // percentage of QR size
  logoBorderWidth?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Added
}

// Simple image loader
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Allow cross-origin images for canvas
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Composite QR code with profile image overlay
async function compositeQRWithImage(
  qrDataUrl: string,
  imageUrl: string,
  qrSize: number,
  logoSizePercent: number,
  borderWidth: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = qrSize;
  canvas.height = qrSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // Draw QR
  const qrImage = await loadImage(qrDataUrl);
  ctx.drawImage(qrImage, 0, 0, qrSize, qrSize);

  // Logo size & position
  const logoSize = (qrSize * logoSizePercent) / 100;
  const logoX = (qrSize - logoSize) / 2;
  const logoY = (qrSize - logoSize) / 2;

  // --- IMPORTANT: Clear background behind logo (improves scanning) ---
  ctx.save();
  ctx.beginPath();
  ctx.arc(qrSize / 2, qrSize / 2, logoSize / 2 + borderWidth, 0, Math.PI * 2);
  ctx.clip();
  ctx.clearRect(logoX - borderWidth, logoY - borderWidth, logoSize + borderWidth * 2, logoSize + borderWidth * 2);
  ctx.restore();

  // White border for contrast
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(qrSize / 2, qrSize / 2, logoSize / 2 + borderWidth, 0, Math.PI * 2);
  ctx.fill();

  // Draw circular logo
  ctx.save();
  ctx.beginPath();
  ctx.arc(qrSize / 2, qrSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.clip();

  const profileImage = await loadImage(imageUrl);
  ctx.drawImage(profileImage, logoX, logoY, logoSize, logoSize);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

// Main QR generator
export async function generateQRWithProfile(
  profileUrl: string,
  profileImageUrl?: string,
  options: QROptions = {}
): Promise<string> {
  const {
    size = 400, // larger = sharper scan
    fgColor = '#000000',
    bgColor = '#FFFFFF',
    logoSize = 25, // smaller overlay for better readability
    logoBorderWidth = 4,
    errorCorrectionLevel = 'H', // high tolerance for central logo
  } = options;

  try {
    const qrDataUrl = await QRCodeLib.toDataURL(profileUrl, {
      width: size,
      margin: 4, // white border around
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel, // crucial fix
    });

    if (!profileImageUrl) return qrDataUrl;

    // Combine QR + Profile image
    return await compositeQRWithImage(qrDataUrl, profileImageUrl, size, logoSize, logoBorderWidth);
  } catch (error) {
    console.error('Error generating QR with profile:', error);
    throw error;
  }
}
