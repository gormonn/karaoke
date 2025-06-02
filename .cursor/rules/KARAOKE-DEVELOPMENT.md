# Правила разработки караоке приложения

> **📖 Для подробного понимания структуры данных см. [KARAOKE-DATA-CONTEXT.md](../../KARAOKE-DATA-CONTEXT.md)**

## Ключевые концепции

### Words - разбивка на слоги
**ВАЖНО**: В караоке приложениях слова часто разбиваются на части (слоги) для точной синхронизации с музыкой.

```javascript
// Пример разбивки:
// Вместо: {word: "Привет", start: 0, end: 1.0}
// Может быть: 
[
  {word: "При", start: 0, end: 0.4},
  {word: "вет", start: 0.4, end: 1.0}
]
```

### Структура данных сегмента

```typescript
interface Segment {
  words: Word[];     // ВСЕ слова/части в сегменте
  lines?: Word[][];  // Опциональная группировка по строкам
  // ... другие поля
}
```

## Правила кодирования

### 1. Группировка слов

При работе с `words` используйте логику группировки:

```javascript
const shouldStartNewGroup = 
  i === 0 ||                        // Первое слово
  word.word.startsWith(' ') ||      // Новое слово (с пробелом)
  word.word.startsWith('\n') ||     // Перенос строки
  !prevGroup;                       // Нет предыдущей группы
```

### 2. Глобальные индексы

При рендеринге с `lines` всегда ищите **глобальный индекс** в основном массиве `words`:

```javascript
const globalIndex = segment.words.findIndex(
  (w) => w.start === word.start && w.end === word.end
);
```

**Зачем**: refs, callbacks и state привязаны к глобальным индексам.

### 3. Совместимость

Всегда поддерживайте **два режима**:
- **С lines**: `hasLines ? renderWithLines() : renderFallback()`
- **Без lines**: Запасной вариант с обработкой `\n`

### 4. Обработка refs

```javascript
// Создание refs для ВСЕХ слов
const wordRefs = new Array(segment.words.length)
  .fill(0)
  .map(() => React.createRef<HTMLSpanElement>());

// Использование глобального индекса
<WordComponent 
  ref={wordRefs[globalIndex]}  // НЕ wordIndex!
  index={globalIndex}          // НЕ wordIndex!
/>
```

## Типичные ошибки

❌ **Использование локального индекса вместо глобального**
```javascript
// НЕПРАВИЛЬНО
ref={wordRefs[wordIndex]}  // wordIndex = индекс в строке

// ПРАВИЛЬНО  
ref={wordRefs[globalIndex]}  // globalIndex = индекс в words
```

❌ **Игнорирование группировки частей слов**
```javascript
// НЕПРАВИЛЬНО - каждая часть как отдельное слово
{words.map(word => <span>{word.word}</span>)}

// ПРАВИЛЬНО - группировка частей
{groupedWords.map(group => 
  <span className="word">{group.map(part => part.word)}</span>
)}
```

❌ **Отсутствие поддержки старого формата**
```javascript
// НЕПРАВИЛЬНО - только новый формат
{segment.lines.map(...)}  

// ПРАВИЛЬНО - с fallback
{hasLines ? segment.lines.map(...) : segment.words.map(...)}
```

## Отладка

Для отладки группировки добавьте:
```javascript
useEffect(() => {
  console.log('groupedWords', groupedWords);
  console.log('hasLines', hasLines);
}, [groupedWords, hasLines]);
```

## Примеры

### Пример группировки
```javascript
// Исходные words:
["При", "вет", " мир", " как", " де", "ла"]

// Результат группировки:
[
  ["При", "вет"],     // Слово "Привет"  
  [" мир"],           // Слово " мир"
  [" как"],           // Слово " как"
  [" де", "ла"]       // Слово " дела"
]
```

### Пример с lines
```javascript
// С lines структурой:
segment.lines = [
  [word1, word2, word3],  // Строка 1
  [word4, word5]          // Строка 2  
]

// Рендеринг:
{segment.lines.map((line, lineIndex) => (
  <div key={lineIndex}>
    {line.map((word, wordIndex) => {
      const globalIndex = segment.words.findIndex(/* ... */);
      return <WordComponent key={wordIndex} index={globalIndex} />;
    })}
  </div>
))}
``` 