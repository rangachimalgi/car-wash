import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegStatic from 'ffmpeg-static';

const execFileAsync = promisify(execFile);
const ffmpegPath = ffmpegStatic || null;

const isVideoMime = (mimetype = '') => /^video\//i.test(mimetype);

async function extractPosterFile(inputPath, outputPath) {
  if (!ffmpegPath) return false;
  await execFileAsync(
    ffmpegPath,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-ss',
      '0.5',
      '-i',
      inputPath,
      '-frames:v',
      '1',
      '-q:v',
      '5',
      '-y',
      outputPath,
    ],
    { timeout: 45000 }
  );
  return fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0;
}

/**
 * Extract a JPEG poster from a video buffer (used on upload before R2).
 * Returns null if ffmpeg is unavailable or extraction fails.
 */
export async function generatePosterBufferFromVideoBuffer(videoBuffer, ext = '.mp4') {
  if (!ffmpegPath || !videoBuffer?.length) return null;

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'woosh-vid-'));
  const inputPath = path.join(tmpDir, `input${ext}`);
  const outputPath = path.join(tmpDir, 'poster.jpg');

  try {
    fs.writeFileSync(inputPath, videoBuffer);
    const ok = await extractPosterFile(inputPath, outputPath);
    if (!ok) return null;
    return fs.readFileSync(outputPath);
  } catch (err) {
    console.warn('[videoPoster] extraction failed:', err?.message || err);
    return null;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

export async function generatePosterBufferFromVideoPath(filePath) {
  if (!ffmpegPath || !filePath) return null;

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'woosh-vid-'));
  const outputPath = path.join(tmpDir, 'poster.jpg');

  try {
    const ok = await extractPosterFile(filePath, outputPath);
    if (!ok) return null;
    return fs.readFileSync(outputPath);
  } catch (err) {
    console.warn('[videoPoster] extraction failed:', err?.message || err);
    return null;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

export { isVideoMime };
