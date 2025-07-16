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

// Функция для проверки установки Remotion Whisper
async function checkRemotionWhisper() {
  try {
    // Проверяем, есть ли пакет в package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.dependencies && packageJson.dependencies['@remotion/install-whisper-cpp'];
  } catch (error) {
    return false;
  }
}

// Функция для установки Remotion Whisper
async function installRemotionWhisper() {
  console.log('📦 Устанавливаем Remotion Whisper...');
  
  return new Promise((resolve, reject) => {
    const install = spawn('npm', ['install', '--save-exact', '@remotion/install-whisper-cpp@4.0.323'], {
      stdio: 'inherit'
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Remotion Whisper успешно установлен');
        resolve(true);
      } else {
        console.log('❌ Ошибка при установке Remotion Whisper');
        reject(new Error('Ошибка установки'));
      }
    });
  });
}

// Функция для обработки аудио файла с помощью Remotion Whisper
async function processAudioWithRemotionWhisper(audioFilePath) {
  console.log(`🎤 Обрабатываем файл: ${path.basename(audioFilePath)}`);
  
  return new Promise((resolve, reject) => {
    // Создаем временный скрипт для использования Remotion Whisper
    const tempScript = `
const path = require('path');
const { installWhisperCpp, downloadWhisperModel, transcribe, convertToCaptions } = require('@remotion/install-whisper-cpp');
const fs = require('fs');

async function transcribeAudio() {
  try {
    const to = path.join(process.cwd(), 'whisper.cpp');
    
    // Устанавливаем Whisper.cpp если еще не установлен
    try {
      await installWhisperCpp({
        to,
        version: '1.5.5',
      });
    } catch (e) {
      // Игнорируем ошибку если уже установлен
    }
    
    // Скачиваем модель если еще не скачана
    try {
      await downloadWhisperModel({
        model: 'base.en',
        folder: to,
      });
    } catch (e) {
      // Игнорируем ошибку если уже скачана
    }
    
    // Транскрибируем аудио
    const { transcription } = await transcribe({
      model: 'base.en',
      whisperPath: to,
      whisperCppVersion: '1.5.5',
      inputPath: '${audioFilePath.replace(/\\/g, '\\\\')}',
      tokenLevelTimestamps: true,
    });
    
    // Конвертируем в субтитры
    const { captions } = convertToCaptions({
      transcription,
      combineTokensWithinMilliseconds: 200,
    });
    
    // Создаем результат в нужном формате
    const result = {
      text: transcription.map(t => t.text).join(' '),
      segments: captions.map(c => ({
        start: c.startInSeconds,
        end: c.startInSeconds + (c.durationInSeconds || 0),
        text: c.text
      })),
      language: 'en'
    };
    
    const outputPath = '${audioFilePath.replace(/\\.\\w+$/, '.json')}';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log('SUCCESS:' + outputPath);
  } catch (error) {
    console.error('ERROR:' + error.message);
    process.exit(1);
  }
}

transcribeAudio();
`;

    const tempScriptPath = path.join(__dirname, 'temp-whisper-script.js');
    fs.writeFileSync(tempScriptPath, tempScript);
    
    const node = spawn('node', [tempScriptPath], {
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    node.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    node.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    node.on('close', (code) => {
      // Удаляем временный скрипт
      try {
        fs.unlinkSync(tempScriptPath);
      } catch (e) {
        // Игнорируем ошибки удаления
      }
      
      if (code === 0) {
        const match = output.match(/SUCCESS:(.+)/);
        if (match) {
          const resultPath = match[1].trim();
          console.log('✅ Обработка завершена успешно');
          console.log(`📄 Результат сохранен в: ${resultPath}`);
          resolve(resultPath);
        } else {
          reject(new Error('Неожиданный формат вывода'));
        }
      } else {
        reject(new Error(`Ошибка обработки: ${errorOutput}`));
      }
    });
    
    node.on('error', (error) => {
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
  console.log('🎵 Remotion Whisper Audio Processor');
  console.log('='.repeat(35));
  
  // Проверяем установку Remotion Whisper
  const isRemotionWhisperInstalled = await checkRemotionWhisper();
  if (!isRemotionWhisperInstalled) {
    try {
      await installRemotionWhisper();
    } catch (error) {
      console.error('Не удалось установить Remotion Whisper:', error.message);
      console.log('Попробуйте установить вручную: npm install --save-exact @remotion/install-whisper-cpp@4.0.323');
      process.exit(1);
    }
  } else {
    console.log('✅ Remotion Whisper уже установлен');
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
        const resultPath = await processAudioWithRemotionWhisper(selectedFile);
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
  processAudioWithRemotionWhisper,
  displayResult,
  main
}; 