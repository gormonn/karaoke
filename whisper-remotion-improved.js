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

// Функция для получения списка текстовых файлов в папке
function getTextFiles(directory) {
  try {
    const files = fs.readdirSync(directory);
    return files.filter(file => file.toLowerCase().endsWith('.txt'));
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

// Это не работает в данной версии обертки
// Функция для выбора текстового файла пользователем
async function selectTextFile(textFiles, directory) {
  const rl = createInterface();
  return new Promise((resolve) => {
    if (textFiles.length === 0) {
      resolve(null);
      return;
    }
    console.log('\n📄 Доступные текстовые файлы:');
    textFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    rl.question('\nВыберите номер текстового файла для initialPrompt (или "n" для пропуска): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'n') {
        resolve(null);
        return;
      }
      const fileIndex = parseInt(answer) - 1;
      if (fileIndex >= 0 && fileIndex < textFiles.length) {
        const selectedFile = textFiles[fileIndex];
        const fullPath = path.join(directory, selectedFile);
        resolve(fullPath);
      } else {
        console.log('❌ Неверный номер файла. Пропускаем initialPrompt.');
        resolve(null);
      }
    });
  });
}

// Функция для проверки установки FFmpeg
async function checkFFmpeg() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version'], { stdio: 'pipe' });
    
    ffmpeg.on('error', () => {
      console.log('❌ FFmpeg не установлен. Устанавливаем...');
      resolve(false);
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('✅ FFmpeg уже установлен');
        resolve(true);
      } else {
        console.log('❌ FFmpeg не установлен. Устанавливаем...');
        resolve(false);
      }
    });
  });
}

// Функция для установки FFmpeg
async function installFFmpeg() {
  console.log('📦 Устанавливаем FFmpeg...');
  
  return new Promise((resolve, reject) => {
    const install = spawn('brew', ['install', 'ffmpeg'], {
      stdio: 'inherit'
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('✅ FFmpeg успешно установлен');
        resolve(true);
      } else {
        console.log('❌ Ошибка при установке FFmpeg');
        console.log('Попробуйте установить вручную: brew install ffmpeg');
        reject(new Error('Ошибка установки FFmpeg'));
      }
    });
  });
}

// Функция для конвертации аудио в 16kHz WAV
async function convertTo16kHzWav(inputPath) {
  const outputPath = inputPath.replace(/\.[^.]+$/, '_16khz.wav');
  
  console.log(`🔄 Конвертируем в 16kHz WAV: ${path.basename(inputPath)}`);
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-ar', '16000',
      '-ac', '1',
      '-c:a', 'pcm_s16le',
      '-y',
      outputPath
    ], {
      stdio: 'pipe'
    });
    
    let errorOutput = '';
    
    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Конвертация завершена');
        resolve(outputPath);
      } else {
        reject(new Error(`Ошибка конвертации: ${errorOutput}`));
      }
    });
    
    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

// Функция для проверки установки Remotion Whisper
async function checkRemotionWhisper() {
  try {
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
async function processAudioWithRemotionWhisper(audioFilePath, initialPrompt) {
  console.log(`🎤 Обрабатываем файл: ${path.basename(audioFilePath)}`);
  console.log('🚀 Запускаем обработку с максимальной точностью (large-v3)...');
  console.log('⏱️ Ожидаемое время: 5-15 минут в зависимости от длины файла');
  console.log('📊 Прогресс будет отображаться ниже:');
  console.log('='.repeat(60));
  
  return new Promise(async (resolve, reject) => {
    try {
      // Сначала конвертируем в 16kHz WAV
      const convertedPath = await convertTo16kHzWav(audioFilePath);
      
      // Создаем временный скрипт для использования Remotion Whisper
      const tempScript = `
const path = require('path');
const { installWhisperCpp, downloadWhisperModel, transcribe, convertToCaptions } = require('@remotion/install-whisper-cpp');
const fs = require('fs');

function timeStringToSeconds(str) {
  if (typeof str === 'number') return str;
  if (typeof str !== 'string') return 0;
  // str: '00:03:04,520' или '00:03:04.520'
  const [h, m, s] = str.split(':');
  let sec = 0;
  if (s.includes(',')) {
    const [secPart, msPart] = s.split(',');
    sec = parseInt(secPart, 10) + parseInt(msPart.padEnd(3, '0'), 10) / 1000;
  } else if (s.includes('.')) {
    const [secPart, msPart] = s.split('.');
    sec = parseInt(secPart, 10) + parseInt(msPart.padEnd(3, '0'), 10) / 1000;
  } else {
    sec = parseInt(s, 10);
  }
  return parseFloat((parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + sec).toFixed(2));
}

async function transcribeAudio() {
  try {
    console.log('🔧 Настройка Whisper.cpp...');
    const to = path.join(process.cwd(), 'whisper.cpp');
    
    // Устанавливаем Whisper.cpp если еще не установлен
    try {
      console.log('📦 Проверяем установку Whisper.cpp...');
      await installWhisperCpp({
        to,
        version: '1.5.5',
      });
      console.log('✅ Whisper.cpp готов');
    } catch (e) {
      console.log('ℹ️ Whisper.cpp уже установлен');
    }
    
    // Скачиваем самую точную модель
    try {
      console.log('📥 Скачиваем модель large-v3 (максимальная точность)...');
      console.log('⏳ Это может занять несколько минут...');
      await downloadWhisperModel({
        model: 'large-v3', // Самая точная модель
        folder: to,
      });
      console.log('✅ Модель large-v3 готова');
    } catch (e) {
      console.log('ℹ️ Модель large-v3 уже скачана');
    }
    
    // Транскрибируем аудио с максимальной точностью
    console.log('🎤 Начинаем транскрипцию с максимальной точностью...');
    console.log('⏳ Обработка может занять 5-15 минут в зависимости от длины файла...');
    
    const startTime = Date.now();
    const { transcription } = await transcribe({
      model: 'large-v3',
      whisperPath: to,
      whisperCppVersion: '1.5.5',
      inputPath: '${convertedPath.replace(/\\/g, '\\\\')}',
      tokenLevelTimestamps: true,
      // Максимальные параметры для точности
      wordTimestamps: true,
      conditionOnPreviousText: false,
      temperature: 0.0, // Детерминированный результат
      bestOf: 5, // Лучший из 5 вариантов
      beamSize: 5, // Размер луча для поиска
      initialPrompt: ${initialPrompt ? 'String.raw`' + initialPrompt.replace(/`/g, '\`') + '`' : 'undefined'}
    });
    
    const endTime = Date.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(\`✅ Транскрипция завершена за \${processingTime} секунд\`);
    console.log(\`📝 Обработано \${transcription.length} токенов\`);
    
    // Создаем результат с максимально точными временными метками
    console.log('📄 Формируем результат...');
    // const result = {
    //   text: transcription.map(t => t.text).join(' '),
    //   segments: transcription.map(token => {
    //     console.log('DEBUG token.timestamps:', JSON.stringify(token.timestamps));
    //     return {
    //       start_s: timeStringToSeconds(token.timestamps?.from),
    //       end_s: timeStringToSeconds(token.timestamps?.to),
    //       word: token.text
    //     }
    //   }).filter(segment => segment.word.length > 0),
    //   language: 'en',
    //   model: 'large-v3',
    //   processingTime: new Date().toISOString(),
    //   processingDurationSeconds: processingTime,
    //   totalTokens: transcription.length,
    //   accuracy: 'maximum',
    //   // transcription: transcription
    // };


    const result = transcription.map(token => {
        console.log('DEBUG token.timestamps:', JSON.stringify(token.timestamps));
        return {
          start_s: timeStringToSeconds(token.timestamps?.from),
          end_s: timeStringToSeconds(token.timestamps?.to),
          word: token.text
        }
      }).filter(segment => segment.word.length > 0);

    
    
    // Корректно формируем путь для .json
    const origPath = '${audioFilePath.replace(/\\/g, '\\\\')}';
    const outputPath = origPath.substring(0, origPath.lastIndexOf('.')) + '.json';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log('✅ Результат сохранен');
    console.log('SUCCESS:' + outputPath);
    
    // Удаляем временный конвертированный файл
    try {
      fs.unlinkSync('${convertedPath.replace(/\\/g, '\\\\')}');
      console.log('🧹 Временные файлы очищены');
    } catch (e) {
      // Игнорируем ошибки удаления
    }
  } catch (error) {
    console.error('❌ Ошибка при обработке:', error.message);
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
        const message = data.toString();
        output += message;
        
        // Отображаем прогресс в реальном времени
        if (message.includes('🔧') || message.includes('📦') || message.includes('📥') || 
            message.includes('🎤') || message.includes('📄') || message.includes('✅')) {
          process.stdout.write(message);
        }
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
      
    } catch (error) {
      reject(error);
    }
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
        console.log(`[${segment.start_s.toFixed(2)}s - ${segment.end_s.toFixed(2)}s]: ${segment.text}`);
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
  console.log('🎵 Remotion Whisper Audio Processor (Улучшенная версия)');
  console.log('='.repeat(50));
  
  // Проверяем установку FFmpeg
  const isFFmpegInstalled = await checkFFmpeg();
  if (!isFFmpegInstalled) {
    try {
      await installFFmpeg();
    } catch (error) {
      console.error('Не удалось установить FFmpeg:', error.message);
      console.log('Попробуйте установить вручную: brew install ffmpeg');
      process.exit(1);
    }
  }
  
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
  
  // Получаем список текстовых файлов
  const textFiles = getTextFiles(audioDirectory);
  
  // Основной цикл обработки
  while (true) {
    const selectedFile = await selectAudioFile(audioFiles, audioDirectory);
    let initialPrompt = null;
    if (selectedFile) {
      // Предлагаем выбрать txt-файл для initialPrompt
      const selectedTextFile = await selectTextFile(textFiles, audioDirectory);
      if (selectedTextFile) {
        try {
          initialPrompt = fs.readFileSync(selectedTextFile, 'utf8');
        } catch (e) {
          console.log('❌ Не удалось прочитать текстовый файл, initialPrompt не будет использован.');
        }
      }
      try {
        const resultPath = await processAudioWithRemotionWhisper(selectedFile, initialPrompt);
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