// Простой тест для проверки работы системы анимаций
const ANIMATION_MODE = {
  LETTERIZE: 'letterize',
  LETTERIZE2: 'letterize2',
  ZOOM: 'zoom',
  ZOOM_IN: 'zoom-in',
  ZOOM_IN_OUT: 'zoom-in-out',
  DEFAULT: 'default',
};

// Упрощенная конфигурация - только одна специальная анимация
const SONG_SETTINGS = {
  ANIMATIONS: {
    default: ANIMATION_MODE.LETTERIZE2,
    metaLines: { 
      "[Chorus]": ANIMATION_MODE.ZOOM_IN_OUT, 
    }
  },
};

// Симуляция функции useMetaByTime
function getMetaByTime(currentTimeInSeconds, segments) {
  if (!segments || segments.length === 0) {
    return null;
  }

  // Ищем сегмент, в котором находится текущее время
  const currentSegment = segments.find(segment => 
    currentTimeInSeconds >= segment.start && currentTimeInSeconds <= segment.end
  );

  if (!currentSegment || !currentSegment.metaLines || currentSegment.metaLines.length === 0) {
    return null;
  }
  
  return currentSegment.metaLines[0];
}

// Симуляция функции useAnimationMode
function useAnimationMode(currentTimeInSeconds, segments) {
  const { ANIMATIONS } = SONG_SETTINGS;
  
  // Получаем текущую мета-линию по времени
  const currentMetaLine = getMetaByTime(currentTimeInSeconds, segments);
  
  console.log(`Время: ${currentTimeInSeconds}s, Мета-линия: ${currentMetaLine}`);
  
  // Если есть текущая мета-линия и для неё есть специальная анимация, используем её
  if (currentMetaLine && currentMetaLine in ANIMATIONS.metaLines) {
    const mode = ANIMATIONS.metaLines[currentMetaLine];
    console.log(`✅ Используем специальную анимацию: ${mode}`);
    return mode;
  }
  
  // Если специальной анимации нет, используем дефолтную
  console.log(`🔄 Используем дефолтную анимацию: ${ANIMATIONS.default}`);
  return ANIMATIONS.default;
}

// Тестовые данные
const testSegments = [
  { start: 0, end: 10, metaLines: ["[Verse 1]"] },
  { start: 10, end: 20, metaLines: ["[Pre-Chorus]"] },
  { start: 20, end: 30, metaLines: ["[Chorus]"] },
  { start: 30, end: 40, metaLines: ["[Verse 2]"] },
  { start: 40, end: 50, metaLines: ["[Bridge]"] },
  { start: 50, end: 60, metaLines: ["[Final Chorus]"] },
];

// Тестируем разные временные точки
console.log("=== Тест упрощенной системы анимаций ===");
console.log("Конфигурация: только [Chorus] имеет специальную анимацию");
console.log("");

[5, 15, 25, 35, 45, 55].forEach(time => {
  console.log(`--- Тест времени ${time}s ---`);
  useAnimationMode(time, testSegments);
  console.log("");
});

console.log("=== Тест завершен ==="); 