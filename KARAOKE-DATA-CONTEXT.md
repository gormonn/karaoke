# Karaoke Data Structure Context

## Overview

This document explains the key data structures used in this karaoke application, specifically how `words` and `lines` work together to enable proper text synchronization and display.

## Key Concept: Word Segmentation

**CRITICAL**: In karaoke applications, words are often **split into parts (syllables)** for precise synchronization with music timing.

```javascript
// Instead of a single word:
{word: "Hello", start: 0, end: 1.0}

// It might be split into parts for better singing synchronization:
[
  {word: "Hel", start: 0, end: 0.4},
  {word: "lo", start: 0.4, end: 1.0}
]
```

This segmentation allows for:
- Precise karaoke highlighting during singing
- Better synchronization with vocal rhythm
- Smoother animation transitions

## Data Structures

### Segment Interface

```typescript
interface Segment {
  words: Word[];        // ALL words/parts in the segment
  lines?: Word[][];     // Optional grouping by display lines
  start: number;        // Segment start time
  end: number;          // Segment end time
  // ... other fields
}

interface Word {
  word: string;         // Text content (may include spaces/newlines)
  start: number;        // Start time in seconds
  end: number;          // End time in seconds
  probability?: number; // Recognition confidence
}
```

### Two Data Organization Methods

#### 1. `words` Array (Primary)
- Contains **ALL** word parts in the segment
- Linear array with global indexing
- Used for refs, callbacks, and state management

#### 2. `lines` Array (Optional)
- Groups words by display lines
- Each line is an array of words: `Word[][]`
- Used for proper visual layout
- Improves readability and text flow

## Word Grouping Logic

### Identifying Word Boundaries

Words are grouped using this logic:

```javascript
const isNewWord = 
  i === 0 ||                        // First word
  word.word.startsWith(' ') ||      // Starts with space
  word.word.startsWith('\n') ||     // Starts with newline
  !previousGroup;                   // No previous group
```

### Example Grouping

```javascript
// Input word parts:
["Hel", "lo", " wor", "ld", " how", " are", " you"]

// Grouped result:
[
  ["Hel", "lo"],        // Word: "Hello"
  [" wor", "ld"],       // Word: " world"  
  [" how"],             // Word: " how"
  [" are"],             // Word: " are"
  [" you"]              // Word: " you"
]
```

## Rendering Approaches

### With Lines Structure

```javascript
{segment.lines?.map((line, lineIndex) => (
  <div key={lineIndex} className="line">
    {line.map((word, wordIndex) => {
      // Find global index in main words array
      const globalIndex = segment.words.findIndex(
        (w) => w.start === word.start && w.end === word.end
      );
      
      return (
        <WordComponent
          ref={wordRefs[globalIndex]}  // Use global index!
          key={wordIndex}
          index={globalIndex}          // Use global index!
          word={word}
        />
      );
    })}
  </div>
))}
```

### Fallback Without Lines

```javascript
{segment.words.map((word, index) => {
  const hasNewLine = word.word.includes('\n');
  
  return (
    <>
      {hasNewLine && index > 0 && <br />}
      <WordComponent
        ref={wordRefs[index]}
        key={index}
        index={index}
        word={word}
      />
    </>
  );
})}
```

## Critical Implementation Details

### Global Index Mapping

When using `lines`, you must map local word indices to global indices:

**Why?** 
- `wordRefs` array is sized for ALL words: `new Array(segment.words.length)`
- Callbacks expect global indices
- State management uses global indexing

**How?**
```javascript
// DON'T use wordIndex (local to line)
ref={wordRefs[wordIndex]}  // ❌ WRONG

// DO use globalIndex (in main words array)  
ref={wordRefs[globalIndex]}  // ✅ CORRECT
```

### Backward Compatibility

The code supports both data formats:

```javascript
const hasLines = segment.lines && segment.lines.length > 0;

return hasLines ? renderWithLines() : renderFallback();
```

This ensures compatibility with:
- New format: segments with `lines` structure
- Legacy format: segments with only `words` array

## Common Pitfalls

❌ **Using local instead of global index**
```javascript
// Wrong - uses index within line
<WordComponent ref={wordRefs[wordIndex]} />

// Correct - uses index in global words array
<WordComponent ref={wordRefs[globalIndex]} />
```

❌ **Not handling word parts as groups**
```javascript
// Wrong - treats each part as separate word
{words.map(word => <span>{word.word}</span>)}

// Correct - groups parts into complete words
{groupedWords.map(group => 
  <span>{group.map(part => part.word).join('')}</span>
)}
```

❌ **Missing fallback support**
```javascript
// Wrong - only supports new format
{segment.lines.map(...)}

// Correct - supports both formats
{hasLines ? segment.lines.map(...) : segment.words.map(...)}
```

## Debugging Tips

Add logging to understand the data structure:

```javascript
useEffect(() => {
  console.log('Segment words:', segment.words);
  console.log('Segment lines:', segment.lines);
  console.log('Has lines:', hasLines);
  console.log('Grouped words:', groupedWords);
}, [segment, hasLines, groupedWords]);
```

## Performance Considerations

- `findIndex` operations for global mapping can be expensive
- Consider memoizing global index mappings for large segments
- Word grouping logic runs on every render - consider useMemo

## Summary

The `words`/`lines` structure enables:
- ✅ Precise karaoke synchronization with word parts
- ✅ Proper visual layout with lines
- ✅ Backward compatibility
- ✅ Flexible rendering approaches

Understanding this structure is crucial for maintaining and extending the karaoke functionality. 