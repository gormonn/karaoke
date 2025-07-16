const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

// Поддерживаемые аудио форматы
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'];

// Функция для получения списка аудио файлов в папке
function getAudioFiles(directory) {
  try {
    const files = fs.readdirSync(directory);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return AUDIO_EXTENSIONS.includes(ext);
    });
  } catch (error) {
    console.error('Ошибка при чтении директории:', error.message);
    return [];
  }
}

// Функция для создания интерфейса для выбора файла
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Функция для выбора файла пользователем
async function selectAudioFile(audioFiles, directory) {
  const rl = createInterface();
  
  return new Promise((resolve) => {
    console.log('\n🎵 Доступные аудио файлы:');
    audioFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    
    rl.question('\nВыберите номер файла для обработки (или "q" для выхода): ', (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'q') {
        console.log('Выход из программы.');
        process.exit(0);
      }
      
      const fileIndex = parseInt(answer) - 1;
      if (fileIndex >= 0 && fileIndex < audioFiles.length) {
        const selectedFile = audioFiles[fileIndex];
        const fullPath = path.join(directory, selectedFile);
        resolve(fullPath);
      } else {
        console.log('❌ Неверный номер файла. Попробуйте снова.');
        resolve(null);
      }
    });
  });
}

// Функция для проверки установки Whisper
async function checkWhisperInstallation() {
  return new Promise((resolve) => {
    const whisper = spawn('whisper', ['--help'], { stdio: 'pipe' });
    
    whisper.on('error', () => {
      console.log('❌ Whisper не установлен. Устанавливаем...');
      resolve(false);
    });
    
    whisper.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Whisper уже установлен');
        resolve(true);
      } else {
        console.log('❌ Whisper не установлен. Устанавливаем...');
        resolve(false);
      }
    });
  });
}

// Функция для установки Whisper
async function installWhisper() {
  console.log('📦 Устанавливаем Whisper CLI...');
  
  return new Promise((resolve, reject) => {
    const install = spawn('npm', ['install', '-g', 'openai-whisper'], {
      stdio: 'inherit'
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Whisper CLI успешно установлен');
        resolve(true);
      } else {
        console.log('❌ Ошибка при установке Whisper CLI');
        console.log('Попробуйте установить вручную: pip install openai-whisper');
        reject(new Error('Ошибка установки'));
      }
    });
  });
}

// Функция для обработки аудио файла с помощью Whisper
async function processAudioWithWhisper(audioFilePath) {
  console.log(`🎤 Обрабатываем файл: ${path.basename(audioFilePath)}`);
  
  return new Promise((resolve, reject) => {
    // Используем whisper-cpp для обработки
    const whisper = spawn('whisper', [
      audioFilePath,
      '--model', 'base', // можно изменить на 'tiny', 'small', 'medium', 'large'
      '--language', 'auto',
      '--output_format', 'json',
      '--output_dir', path.dirname(audioFilePath)
    ], {
      stdio: 'inherit'
    });
    
    whisper.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Обработка завершена успешно');
        
        // Генерируем имя выходного файла
        const baseName = path.basename(audioFilePath, path.extname(audioFilePath));
        const outputPath = path.join(path.dirname(audioFilePath), `${baseName}.json`);
        
        if (fs.existsSync(outputPath)) {
          console.log(`📄 Результат сохранен в: ${outputPath}`);
          resolve(outputPath);
        } else {
          reject(new Error('Файл результата не найден'));
        }
      } else {
        reject(new Error(`Ошибка обработки (код: ${code})`));
      }
    });
    
    whisper.on('error', (error) => {
      reject(error);
    });
  });
}

// Функция для отображения результата
function displayResult(resultPath) {
  try {
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    
    console.log('\n📝 Результат транскрипции:');
    console.log('='.repeat(50));
    
    if (result.segments && Array.isArray(result.segments)) {
      result.segments.forEach((segment, index) => {
        console.log(`[${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s]: ${segment.text}`);
      });
    } else if (result.text) {
      console.log(result.text);
    } else {
      console.log('Неожиданный формат результата:', JSON.stringify(result, null, 2));
    }
    
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Ошибка при чтении результата:', error.message);
  }
}

// Основная функция
async function main() {
  console.log('🎵 Whisper Audio Processor');
  console.log('='.repeat(30));
  
  // Проверяем установку Whisper
  const isWhisperInstalled = await checkWhisperInstallation();
  if (!isWhisperInstalled) {
    try {
      await installWhisper();
    } catch (error) {
      console.error('Не удалось установить Whisper:', error.message);
      console.log('Попробуйте установить вручную: pip install openai-whisper');
      process.exit(1);
    }
  }
  
  // Директория с аудио файлами (по умолчанию public)
  const audioDirectory = path.join(__dirname, 'public');
  
  // Проверяем существование директории
  if (!fs.existsSync(audioDirectory)) {
    console.error(`❌ Директория ${audioDirectory} не найдена`);
    process.exit(1);
  }
  
  // Получаем список аудио файлов
  const audioFiles = getAudioFiles(audioDirectory);
  
  if (audioFiles.length === 0) {
    console.log('❌ Аудио файлы не найдены в директории');
    process.exit(1);
  }
  
  // Основной цикл обработки
  while (true) {
    const selectedFile = await selectAudioFile(audioFiles, audioDirectory);
    
    if (selectedFile) {
      try {
        const resultPath = await processAudioWithWhisper(selectedFile);
        displayResult(resultPath);
      } catch (error) {
        console.error('❌ Ошибка при обработке файла:', error.message);
      }
    }
    
    // Спрашиваем, хочет ли пользователь обработать еще один файл
    const rl = createInterface();
    const answer = await new Promise((resolve) => {
      rl.question('\nОбработать еще один файл? (y/n): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase());
      });
    });
    
    if (answer !== 'y' && answer !== 'yes') {
      console.log('👋 До свидания!');
      break;
    }
  }
}

// Запускаем программу
if (require.main === module) {
  main().catch(error => {
    console.error('Критическая ошибка:', error.message);
    process.exit(1);
  });
}

module.exports = {
  getAudioFiles,
  selectAudioFile,
  processAudioWithWhisper,
  displayResult,
  main
}; 