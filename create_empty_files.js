const fs = require('fs');
const path = require('path');

// Функция для создания пустого файла, если он не существует
const createEmptyFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
        console.log(`Создан файл: ${filePath}`);
    }
};

// Функция для замены пробелов на дефисы в имени файла
const replaceSpacesWithHyphens = (filePath) => {
    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const newFileName = fileName.replace(/\s+/g, '-');
    
    if (fileName !== newFileName) {
        const newPath = path.join(dir, newFileName);
        if (fs.existsSync(filePath)) {
            fs.renameSync(filePath, newPath);
            console.log(`Переименован файл: ${filePath} -> ${newPath}`);
        }
        return newPath;
    }
    return filePath;
};

// Получаем список всех MP3 файлов
const publicDir = path.join(__dirname, 'public');
const mp3Files = fs.readdirSync(publicDir)
    .filter(file => file.toLowerCase().endsWith('.mp3'));

// Обрабатываем каждый MP3 файл и его производные
mp3Files.forEach(mp3File => {
    const oldMp3Path = path.join(publicDir, mp3File);
    const newMp3Path = replaceSpacesWithHyphens(oldMp3Path);
    const baseName = path.parse(newMp3Path).name;
    
    // Создаем и переименовываем JSON файл
    const jsonPath = path.join(publicDir, `${path.parse(mp3File).name}.json`);
    createEmptyFile(jsonPath);
    replaceSpacesWithHyphens(jsonPath);
    
    // Создаем и переименовываем TXT файл
    const txtPath = path.join(publicDir, `${path.parse(mp3File).name}.txt`);
    createEmptyFile(txtPath);
    replaceSpacesWithHyphens(txtPath);
}); 