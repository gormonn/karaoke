import * as fs from "fs"
import * as path from "path"

// Функция для получения доступного аудиоформата (копия из _config.ts)
function getAvailableAudioFile(baseName) {
  const publicDir = path.join(process.cwd(), 'public')
  const wavPath = path.join(publicDir, `${baseName}.wav`)
  const mp3Path = path.join(publicDir, `${baseName}.mp3`)
  
  console.log(`Проверяем файлы для ${baseName}:`)
  console.log(`  WAV: ${wavPath} - ${fs.existsSync(wavPath) ? 'СУЩЕСТВУЕТ' : 'НЕ НАЙДЕН'}`)
  console.log(`  MP3: ${mp3Path} - ${fs.existsSync(mp3Path) ? 'СУЩЕСТВУЕТ' : 'НЕ НАЙДЕН'}`)
  
  // Проверяем наличие wav файла первым (обычно лучше качество)
  if (fs.existsSync(wavPath)) {
    console.log(`  → Выбран WAV формат`)
    return `${baseName}.wav`
  } else if (fs.existsSync(mp3Path)) {
    console.log(`  → Выбран MP3 формат`)
    return `${baseName}.mp3`
  } else {
    console.log(`  → Файлы не найдены, используем MP3 по умолчанию`)
    return `${baseName}.mp3`
  }
}

// Тестируем разные песни
const testSongs = ['4_DA', 'Never_Said', 'home-office']

console.log('=== ТЕСТ АВТОМАТИЧЕСКОГО ОПРЕДЕЛЕНИЯ АУДИОФОРМАТА ===\n')

testSongs.forEach(song => {
  const result = getAvailableAudioFile(song)
  console.log(`Результат для ${song}: ${result}\n`)
}) 