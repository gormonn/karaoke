const path = require('path');
const fs = require('fs');

async function testRemotionWhisper() {
  try {
    console.log('🔍 Тестируем Remotion Whisper API...');
    
    // Проверяем, установлен ли пакет
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasRemotionWhisper = packageJson.dependencies && packageJson.dependencies['@remotion/install-whisper-cpp'];
    
    if (!hasRemotionWhisper) {
      console.log('❌ @remotion/install-whisper-cpp не установлен');
      return;
    }
    
    console.log('✅ @remotion/install-whisper-cpp установлен');
    
    // Пробуем импортировать
    const { installWhisperCpp, downloadWhisperModel, transcribe, convertToCaptions } = require('@remotion/install-whisper-cpp');
    console.log('✅ Импорт успешен');
    
    // Проверяем доступные функции
    console.log('📋 Доступные функции:');
    console.log('- installWhisperCpp:', typeof installWhisperCpp);
    console.log('- downloadWhisperModel:', typeof downloadWhisperModel);
    console.log('- transcribe:', typeof transcribe);
    console.log('- convertToCaptions:', typeof convertToCaptions);
    
    // Тестируем на коротком аудио файле
    const audioFile = path.join(__dirname, 'public', 'Never_Said.wav');
    
    if (!fs.existsSync(audioFile)) {
      console.log('❌ Тестовый аудио файл не найден:', audioFile);
      return;
    }
    
    console.log('🎵 Найден тестовый файл:', path.basename(audioFile));
    
    const to = path.join(process.cwd(), 'whisper.cpp');
    console.log('📁 Whisper.cpp будет установлен в:', to);
    
    // Устанавливаем Whisper.cpp
    console.log('📦 Устанавливаем Whisper.cpp...');
    await installWhisperCpp({
      to,
      version: '1.5.5',
    });
    console.log('✅ Whisper.cpp установлен');
    
    // Скачиваем модель
    console.log('📥 Скачиваем модель base.en...');
    await downloadWhisperModel({
      model: 'base.en',
      folder: to,
    });
    console.log('✅ Модель скачана');
    
    // Транскрибируем (только первые 10 секунд для теста)
    console.log('🎤 Начинаем транскрипцию...');
    const { transcription } = await transcribe({
      model: 'base.en',
      whisperPath: to,
      whisperCppVersion: '1.5.5',
      inputPath: audioFile,
      tokenLevelTimestamps: true,
    });
    
    console.log('✅ Транскрипция завершена');
    console.log('📝 Количество токенов:', transcription.length);
    
    if (transcription.length > 0) {
      console.log('🔤 Первые токены:');
      transcription.slice(0, 5).forEach((token, i) => {
        console.log(`  ${i + 1}. [${token.timestamps.from.toFixed(2)}s - ${token.timestamps.to.toFixed(2)}s]: "${token.text}"`);
      });
    }
    
    // Конвертируем в субтитры
    console.log('📄 Конвертируем в субтитры...');
    const { captions } = convertToCaptions({
      transcription,
      combineTokensWithinMilliseconds: 200,
    });
    
    console.log('✅ Конвертация завершена');
    console.log('📝 Количество субтитров:', captions.length);
    
    if (captions.length > 0) {
      console.log('🎬 Первые субтитры:');
      captions.slice(0, 3).forEach((caption, i) => {
        console.log(`  ${i + 1}. [${caption.startInSeconds.toFixed(2)}s]: "${caption.text}"`);
      });
    }
    
    console.log('🎉 Тест завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testRemotionWhisper(); 