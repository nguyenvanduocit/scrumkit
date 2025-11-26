import sharp from 'sharp'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'

const INPUT = 'docs/design/avatars.png'
const OUTPUT_DIR = 'packages/frontend/public/avatars'

async function detectGrid(imagePath: string) {
  const image = sharp(imagePath)
  const { width, height } = await image.metadata()

  if (!width || !height) throw new Error('Could not read image dimensions')

  // Get raw pixel data
  const { data } = await image.raw().toBuffer({ resolveWithObject: true })

  // Detect vertical grid lines by looking for columns where colors change uniformly
  // We look for "edges" - columns where adjacent pixels have high color variance
  const colScores: number[] = []

  for (let x = 1; x < width; x++) {
    let edgeScore = 0
    for (let y = 0; y < height; y++) {
      const idx1 = (y * width + x - 1) * 3
      const idx2 = (y * width + x) * 3

      const diff = Math.abs(data[idx1] - data[idx2]) +
                   Math.abs(data[idx1 + 1] - data[idx2 + 1]) +
                   Math.abs(data[idx1 + 2] - data[idx2 + 2])

      if (diff > 100) edgeScore++
    }
    colScores.push(edgeScore)
  }

  // Find peaks (grid lines) - positions with high edge scores
  const threshold = height * 0.3
  const peaks: number[] = [0] // Start with 0

  for (let i = 10; i < colScores.length - 10; i++) {
    // Local maximum check
    if (colScores[i] > threshold) {
      const isLocalMax = colScores.slice(i - 5, i).every(s => s <= colScores[i]) &&
                         colScores.slice(i + 1, i + 6).every(s => s <= colScores[i])
      if (isLocalMax && (peaks.length === 0 || i - peaks[peaks.length - 1] > 50)) {
        peaks.push(i)
      }
    }
  }
  peaks.push(width)

  // Similarly for rows
  const rowScores: number[] = []
  for (let y = 1; y < height; y++) {
    let edgeScore = 0
    for (let x = 0; x < width; x++) {
      const idx1 = ((y - 1) * width + x) * 3
      const idx2 = (y * width + x) * 3

      const diff = Math.abs(data[idx1] - data[idx2]) +
                   Math.abs(data[idx1 + 1] - data[idx2 + 1]) +
                   Math.abs(data[idx1 + 2] - data[idx2 + 2])

      if (diff > 100) edgeScore++
    }
    rowScores.push(edgeScore)
  }

  const rowPeaks: number[] = [0]
  for (let i = 10; i < rowScores.length - 10; i++) {
    if (rowScores[i] > width * 0.3) {
      const isLocalMax = rowScores.slice(i - 5, i).every(s => s <= rowScores[i]) &&
                         rowScores.slice(i + 1, i + 6).every(s => s <= rowScores[i])
      if (isLocalMax && (rowPeaks.length === 0 || i - rowPeaks[rowPeaks.length - 1] > 50)) {
        rowPeaks.push(i)
      }
    }
  }
  rowPeaks.push(height)

  console.log(`Detected ${peaks.length - 1} columns at: ${peaks.join(', ')}`)
  console.log(`Detected ${rowPeaks.length - 1} rows at: ${rowPeaks.join(', ')}`)

  return { width, height, colBoundaries: peaks, rowBoundaries: rowPeaks }
}

async function main() {
  // Clean output directory
  await rm(OUTPUT_DIR, { recursive: true, force: true })
  await mkdir(OUTPUT_DIR, { recursive: true })

  console.log('Analyzing image to detect grid...')
  const { colBoundaries, rowBoundaries } = await detectGrid(INPUT)

  const cols = colBoundaries.length - 1
  const rows = rowBoundaries.length - 1

  console.log(`\nSlicing ${cols} × ${rows} = ${cols * rows} avatars`)

  let index = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const left = colBoundaries[col]
      const top = rowBoundaries[row]
      const width = colBoundaries[col + 1] - left
      const height = rowBoundaries[row + 1] - top

      const outputPath = join(OUTPUT_DIR, `${index}.webp`)

      await sharp(INPUT)
        .extract({ left, top, width, height })
        .webp({ quality: 85 })
        .toFile(outputPath)

      index++
    }
  }

  console.log(`\nCreated ${index} avatars in ${OUTPUT_DIR}`)
}

main().catch(console.error)
