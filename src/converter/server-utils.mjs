import fs from 'fs';
import path from 'path';

// Функция для создания formatted JSON файла (предварительная обработка)
function createFormattedJson(filename, jsonPath) {
	const sunoData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
	const formattedFile = `${filename}-formatted.json`;
	const formattedPath = path.join(process.cwd(), 'public', formattedFile);

	// Обработка закрывающих знаков препинания
	console.log('\n🔧 Обработка закрывающих знаков препинания:');

	// Определяем закрывающие знаки препинания (включая типографические)
	const closingPunctuation = /^[)\]}"'\u201C\u201D\u2018\u2019?!.,;:]/;

	for (let i = 1; i < sunoData.length; i++) {
		const currentWord = sunoData[i];
		const previousWord = sunoData[i - 1];
		
		// Проверяем, начинается ли текущее слово с закрывающего знака препинания
		if (currentWord.word && closingPunctuation.test(currentWord.word)) {
			// Извлекаем закрывающие знаки препинания из начала слова
			const match = currentWord.word.match(/^([)\]}"'\u201C\u201D\u2018\u2019?!.,;:]+)/);
			if (match) {
				const punctuationToMove = match[1];
				const remainingWord = currentWord.word.substring(punctuationToMove.length);
				
				// Переносим знаки препинания в предыдущее слово
				previousWord.word = previousWord.word + punctuationToMove;
				currentWord.word = remainingWord;
				
				// Выводим информацию о переносе
				console.log(`  📝 Перенесено "${punctuationToMove}" из позиции ${i} в позицию ${i-1}`);
				console.log(`     Было: "${sunoData[i-1].word}" | "${punctuationToMove}${remainingWord}"`);
				console.log(`     Стало: "${previousWord.word}" | "${remainingWord}"`);
				
				// Если после переноса слово стало пустым, удаляем его
				if (remainingWord.trim() === '') {
					console.log(`  🗑️ Удаляем пустое слово на позиции ${i}`);
					sunoData.splice(i, 1);
					i--; // Корректируем индекс после удаления
				}
			}
		}
	}
	
	console.log('✅ Обработка закрывающих знаков препинания завершена\n');

	// Сохраняем данные в formatted файл
	fs.writeFileSync(
		formattedPath,
		JSON.stringify(sunoData, null, 2),
		'utf8'
	);

	console.log(`Создан файл предварительной обработки: ${formattedFile}`);
}

/**
 * Создает edits файл на основе converted данных
 */
function createEditsFile(filename, convertedData) {
	const editsFile = `${filename}-converted-edits.json`;
	const editsPath = path.join(process.cwd(), 'public', editsFile);

	// Создаем структуру для edits файла
	const editsData = {
		text: convertedData.text,
		segments: convertedData.segments.map(segment => ({
			id: segment.id,
			start: null, // Можно переопределить
			end: null,   // Можно переопределить
			text: segment.text,
			paragraph: segment.paragraph,
			words: [], // Пустой массив для редактирования
			lines: segment.lines || []
		})),
		language: convertedData.language
	};

	// Сохраняем edits файл
	fs.writeFileSync(
		editsPath,
		JSON.stringify(editsData, null, 2),
		'utf8'
	);

	console.log(`Создан файл для редактирования: ${editsFile}`);
}

/**
 * Проверяет наличие файлов стемов в каталоге stems/{song_name}/
 */
function checkStemsFiles(songName) {
	const stemsDir = path.join(process.cwd(), 'public', 'stems', songName);
	const stemsConfig = {};
	
	// Проверяем существование каталога
	if (!fs.existsSync(stemsDir)) {
		console.log(`Каталог стемов не найден: ${stemsDir}`);
		return stemsConfig;
	}
	
	// Список поддерживаемых типов стемов и их соответствие ключам
	const stemTypes = {
		'bass': ['(Bass)', '(bass)', '(BASS)'],
		'drums': ['(Drums)', '(drums)', '(DRUMS)'],
		'guitar': ['(Guitar)', '(guitar)', '(GUITAR)'],
		'percussion': ['(Percussion)', '(percussion)', '(PERCUSSION)'],
		'synth': ['(Synth)', '(synth)', '(SYNTH)'],
		'vocals': ['(Vocals)', '(vocals)', '(VOCALS)']
	};
	
	try {
		// Читаем файлы в каталоге стемов
		const files = fs.readdirSync(stemsDir);
		
		// Проверяем каждый файл на соответствие типам стемов
		files.forEach(file => {
			// Проверяем только аудиофайлы
			if (file.match(/\.(mp3|wav|flac|m4a|ogg)$/i)) {
				Object.entries(stemTypes).forEach(([key, patterns]) => {
					patterns.forEach(pattern => {
						if (file.includes(pattern)) {
							stemsConfig[key] = `stems/${songName}/${file}`;
							console.log(`✅ Найден стем ${key}: ${file}`);
						}
					});
				});
			}
		});
		
		if (Object.keys(stemsConfig).length === 0) {
			console.log(`Стемы не найдены в каталоге: ${stemsDir}`);
		} else {
			console.log(`Найдено стемов: ${Object.keys(stemsConfig).length}`);
		}
		
	} catch (error) {
		console.error(`Ошибка при чтении каталога стемов: ${error.message}`);
	}
	
	return stemsConfig;
}

/**
 * Обновляет конфигурацию стемов в _config.ts
 */
function updateStemsInConfig(stemsConfig) {
	const configPath = path.join(process.cwd(), 'src', '_config.ts');
	
	try {
		let content = fs.readFileSync(configPath, 'utf8');
		
		// Формируем новый объект stems
		let stemsObject = '';
		if (Object.keys(stemsConfig).length > 0) {
			const stemsEntries = Object.entries(stemsConfig)
				.map(([key, filePath]) => `\t${key}: staticFile('${filePath}')`)
				.join(',\n');
			stemsObject = `{\n${stemsEntries}\n\t}`;
		} else {
			stemsObject = '{}';
		}
		
		// Заменяем объект stems в SONG_TARGET, сохраняя остальную структуру
		const stemsRegex = /(\s+stems:\s*)\{[^}]*\}(\s*as\s+Record<string,\s*string>)/;
		const replacement = `$1${stemsObject}$2`;
		
		if (stemsRegex.test(content)) {
			content = content.replace(stemsRegex, replacement);
		} else {
			console.warn('Не удалось найти секцию stems в _config.ts');
			return;
		}
		
		// Записываем обновленный файл
		fs.writeFileSync(configPath, content, 'utf8');
		
		if (Object.keys(stemsConfig).length > 0) {
			console.log(`✅ Конфигурация стемов обновлена в _config.ts:`);
			Object.entries(stemsConfig).forEach(([key, filePath]) => {
				console.log(`   ${key}: ${filePath}`);
			});
		} else {
			console.log('✅ Объект stems очищен в _config.ts');
		}
		
	} catch (error) {
		console.error(`Ошибка при обновлении _config.ts: ${error.message}`);
	}
}

/**
 * Проверяет наличие split.txt файла в каталоге stems/{song_name}/
 */
function checkSplitFile(songName) {
	const splitPath = path.join(process.cwd(), 'public', 'stems', songName, 'split.txt');
	
	if (fs.existsSync(splitPath)) {
		console.log(`✅ Найден split.txt файл: stems/${songName}/split.txt`);
		return `stems/${songName}/split.txt`;
	} else {
		console.log(`❌ Split.txt файл не найден: ${splitPath}`);
		return null;
	}
}


export {
	createFormattedJson,
	createEditsFile,
	checkStemsFiles,
	updateStemsInConfig,
	checkSplitFile
}; 