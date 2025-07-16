import React, { useState, useRef } from 'react';

interface Word {
  id: number;
  word: string;
  start: number;
  end: number;
  probability: number;
}

interface TimelineEditorProps {
  words: Word[];
  onSave?: (words: Word[]) => void;
  duration?: number; // общая длительность трека (секунды)
}

const TRACK_HEIGHT = 60;
const WORD_HEIGHT = 32;
const BASE_TIMELINE_WIDTH = 800;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

function getWordLeft(start: number, duration: number, zoom: number) {
  return (start / duration) * BASE_TIMELINE_WIDTH * zoom;
}
function getWordWidth(start: number, end: number, duration: number, zoom: number) {
  return ((end - start) / duration) * BASE_TIMELINE_WIDTH * zoom;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({ words: initialWords, onSave, duration }) => {
  const [words, setWords] = useState<Word[]>(initialWords);
  const [zoom, setZoom] = useState(1);
  const [dragInfo, setDragInfo] = useState<null | {
    wordId: number;
    edge: 'start' | 'end';
    startX: number;
    origValue: number;
  }>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Определяем длительность по последнему слову, если не задана явно
  const totalDuration = duration || (words.length > 0 ? Math.max(...words.map(w => w.end)) : 60);
  const timelineWidth = BASE_TIMELINE_WIDTH * zoom;

  // Drag start
  const handleDragStart = (e: React.MouseEvent, wordId: number, edge: 'start' | 'end') => {
    e.preventDefault();
    setDragInfo({
      wordId,
      edge,
      startX: e.clientX,
      origValue: words.find(w => w.id === wordId)![edge],
    });
  };

  // Drag move
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragInfo) return;
    const { wordId, edge, startX, origValue } = dragInfo;
    const deltaPx = e.clientX - startX;
    const pxPerSec = timelineWidth / totalDuration;
    const deltaSec = deltaPx / pxPerSec;
    setWords(prevWords => prevWords.map(w => {
      if (w.id !== wordId) return w;
      let newStart = w.start;
      let newEnd = w.end;
      if (edge === 'start') {
        newStart = Math.max(0, Math.min(w.end - 0.05, origValue + deltaSec));
      } else {
        newEnd = Math.max(w.start + 0.05, origValue + deltaSec);
      }
      return { ...w, start: newStart, end: newEnd };
    }));
  };

  // Drag end
  const handleMouseUp = () => {
    setDragInfo(null);
  };

  React.useEffect(() => {
    if (dragInfo) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  // Сохранить результат
  const handleSave = () => {
    if (onSave) onSave(words);
    else {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(words, null, 2));
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute('href', dataStr);
      dlAnchorElem.setAttribute('download', 'words-edited.json');
      dlAnchorElem.click();
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(2)));
  const handleZoomOut = () => setZoom(z => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(2)));

  return (
    <div style={{ width: timelineWidth + 40, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Timeline Editor</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleZoomOut} disabled={zoom <= MIN_ZOOM} title="Уменьшить масштаб">−</button>
          <span style={{ minWidth: 40, textAlign: 'center' }}>Zoom: {zoom.toFixed(2)}x</span>
          <button onClick={handleZoomIn} disabled={zoom >= MAX_ZOOM} title="Увеличить масштаб">+</button>
          <button onClick={handleSave}>Сохранить</button>
        </div>
      </div>
      <div
        ref={timelineRef}
        style={{
          position: 'relative',
          width: timelineWidth,
          height: TRACK_HEIGHT,
          background: '#f0f0f0',
          border: '1px solid #ccc',
          userSelect: 'none',
        }}
      >
        {/* Слова */}
        {words.map(word => {
          const left = getWordLeft(word.start, totalDuration, zoom);
          const width = getWordWidth(word.start, word.end, totalDuration, zoom);
          return (
            <div
              key={word.id}
              style={{
                position: 'absolute',
                left,
                top: (TRACK_HEIGHT - WORD_HEIGHT) / 2,
                width: Math.max(width, 8),
                height: WORD_HEIGHT,
                background: '#90caf9',
                borderRadius: 4,
                border: '1px solid #1976d2',
                display: 'flex',
                alignItems: 'center',
                fontSize: 14,
                boxSizing: 'border-box',
                zIndex: 2,
              }}
            >
              {/* Левая ручка */}
              <div
                onMouseDown={e => handleDragStart(e, word.id, 'start')}
                style={{
                  width: 8,
                  height: '100%',
                  cursor: 'ew-resize',
                  background: '#1976d2',
                  borderRadius: '4px 0 0 4px',
                  marginRight: 2,
                }}
                title="Двигать начало"
              />
              <div style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }}>{word.word}</div>
              {/* Правая ручка */}
              <div
                onMouseDown={e => handleDragStart(e, word.id, 'end')}
                style={{
                  width: 8,
                  height: '100%',
                  cursor: 'ew-resize',
                  background: '#1976d2',
                  borderRadius: '0 4px 4px 0',
                  marginLeft: 2,
                }}
                title="Двигать конец"
              />
            </div>
          );
        })}
        {/* Временная шкала */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: TRACK_HEIGHT - 18,
          width: '100%',
          height: 18,
          display: 'flex',
          fontSize: 12,
          color: '#888',
        }}>
          {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: (i / totalDuration) * timelineWidth - 8,
              width: 32,
              textAlign: 'center',
            }}>{i}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineEditor; 