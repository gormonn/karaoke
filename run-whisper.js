const readline = require('readline');

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

async function selectMethod() {
  const rl = createInterface();
  
  return new Promise((resolve) => {
    console.log('🎵 Whisper Audio Processor');
    console.log('='.repeat(30));
    console.log('Выберите метод обработки:');
    console.log('1. Whisper CLI (рекомендуется)');
    console.log('2. Remotion Whisper API');
    console.log('3. Remotion Whisper API (улучшенная версия с конвертацией)');
    console.log('q. Выход');
    
    rl.question('\nВаш выбор: ', (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'q') {
        console.log('Выход из программы.');
        process.exit(0);
      }
      
      const choice = parseInt(answer);
      if (choice === 1) {
        resolve('cli');
      } else if (choice === 2) {
        resolve('remotion');
      } else if (choice === 3) {
        resolve('remotion-improved');
      } else {
        console.log('❌ Неверный выбор. Попробуйте снова.');
        resolve(null);
      }
    });
  });
}

async function main() {
  while (true) {
    const method = await selectMethod();
    
    if (method === 'cli') {
      console.log('\n🚀 Запускаем Whisper CLI...');
      const { main: cliMain } = require('./whisper-processor.js');
      await cliMain();
      break;
    } else if (method === 'remotion') {
      console.log('\n🚀 Запускаем Remotion Whisper...');
      const { main: remotionMain } = require('./whisper-remotion.js');
      await remotionMain();
      break;
    } else if (method === 'remotion-improved') {
      console.log('\n🚀 Запускаем Remotion Whisper (улучшенная версия)...');
      const { main: remotionImprovedMain } = require('./whisper-remotion-improved.js');
      await remotionImprovedMain();
      break;
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Критическая ошибка:', error.message);
    process.exit(1);
  });
} 