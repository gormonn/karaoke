import React, {useMemo, useState, useRef, useEffect, useCallback} from 'react';
import {Segment} from './types';

// Типы для таймлайна
interface TimelineItem {
	id: string;
	word: string;
	start: number;
	end: number;
	segmentId: number;
	lineIndex?: number;
	probability: number;
}

interface TimelineTrack {
	id: string;
	name: string;
	items: TimelineItem[];
}

interface TimelineProps {
	segments: Segment[];
	currentTime?: number;
	onTimeChange?: (time: number) => void;
	onItemUpdate?: (itemId: string, newStart: number, newEnd: number) => void;
}

// Константы для UI
const TRACK_HEIGHT = 60;
const ITEM_MIN_WIDTH = 20;
const TIMELINE_PADDING = 20;

// Утилита для создания треков из segments
const createTracksFromSegments = (segments: Segment[]): TimelineTrack[] => {
	const tracks: TimelineTrack[] = [];

	segments.forEach((segment, segmentIndex) => {
		// Создаем основной трек для сегмента
		const mainTrack: TimelineTrack = {
			id: `segment-${segment.id}`,
			name: `Сегмент ${segment.id + 1}`,
			items: segment.words
				.map((word, wordIndex) => ({
					id: `${segment.id}-${wordIndex}`,
					word: word.word.trim() || '',
					start: word.start,
					end: word.end,
					segmentId: segment.id,
					probability: word.probability,
				}))
				.filter((item) => item.word.length > 0),
		};

		tracks.push(mainTrack);

		// Если есть lines, создаем отдельные треки для каждой строки
		if (segment.lines && segment.lines.length > 0) {
			segment.lines.forEach((line, lineIndex) => {
				const lineTrack: TimelineTrack = {
					id: `segment-${segment.id}-line-${lineIndex}`,
					name: `Строка ${lineIndex + 1}`,
					items: line
						.map((word, wordIndex) => ({
							id: `${segment.id}-${lineIndex}-${wordIndex}`,
							word: word.word.trim() || '',
							start: word.start,
							end: word.end,
							segmentId: segment.id,
							lineIndex,
							probability: word.probability,
						}))
						.filter((item) => item.word.length > 0),
				};

				if (lineTrack.items.length > 0) {
					tracks.push(lineTrack);
				}
			});
		}
	});

	return tracks;
};

// Компонент для отображения элемента на таймлайне
const TimelineItemComponent: React.FC<{
	item: TimelineItem;
	scale: number;
	isActive: boolean;
	onDrag?: (newStart: number, newEnd: number) => void;
}> = ({item, scale, isActive, onDrag}) => {
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState(0);
	const elementRef = useRef<HTMLDivElement>(null);

	const left = item.start * scale;
	const width = Math.max((item.end - item.start) * scale, ITEM_MIN_WIDTH);

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true);
		setDragStart(e.clientX);
		e.preventDefault();
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			const deltaX = e.clientX - dragStart;
			const deltaTime = deltaX / scale;
			const newStart = Math.max(0, item.start + deltaTime);
			const duration = item.end - item.start;
			const newEnd = newStart + duration;

			if (onDrag) {
				onDrag(newStart, newEnd);
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isDragging, dragStart, item, scale, onDrag]);

	return (
		<div
			ref={elementRef}
			style={{
				position: 'absolute',
				left: `${left}px`,
				width: `${width}px`,
				height: '40px',
				backgroundColor: isActive ? '#FFD700' : '#4A90E2',
				border: '1px solid #fff',
				borderRadius: '4px',
				cursor: isDragging ? 'grabbing' : 'grab',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: '12px',
				color: '#fff',
				fontWeight: 'bold',
				textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
				overflow: 'hidden',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap',
				padding: '0 4px',
				boxShadow: isActive ? '0 0 10px #FFD700' : '0 2px 4px rgba(0,0,0,0.3)',
				transition: isDragging ? 'none' : 'all 0.2s ease',
				transform: isDragging ? 'scale(1.05)' : 'scale(1)',
				zIndex: isDragging ? 1000 : 1,
			}}
			onMouseDown={handleMouseDown}
			title={`${item.word} (${item.start.toFixed(2)}s - ${item.end.toFixed(
				2
			)}s)`}
		>
			{item.word}
		</div>
	);
};

// Компонент для отображения трека
const TimelineTrackComponent: React.FC<{
	track: TimelineTrack;
	currentTime: number;
	scale: number;
	maxDuration: number;
	onItemUpdate?: (itemId: string, newStart: number, newEnd: number) => void;
}> = ({track, currentTime, scale, maxDuration, onItemUpdate}) => {
	const trackWidth = maxDuration * scale + TIMELINE_PADDING * 2;

	return (
		<div
			style={{
				height: `${TRACK_HEIGHT}px`,
				borderBottom: '1px solid #333',
				position: 'relative',
				backgroundColor: '#1a1a1a',
				overflow: 'hidden',
			}}
		>
			{/* Название трека */}
			<div
				style={{
					position: 'absolute',
					left: '10px',
					top: '5px',
					color: '#fff',
					fontSize: '14px',
					fontWeight: 'bold',
					zIndex: 10,
				}}
			>
				{track.name}
			</div>

			{/* Область для элементов */}
			<div
				style={{
					position: 'relative',
					height: '100%',
					paddingTop: '20px',
					paddingLeft: `${TIMELINE_PADDING}px`,
					width: `${trackWidth}px`,
				}}
			>
				{track.items.map((item) => {
					const isActive = currentTime >= item.start && currentTime <= item.end;

					return (
						<TimelineItemComponent
							key={item.id}
							item={item}
							scale={scale}
							isActive={isActive}
							onDrag={(newStart, newEnd) => {
								if (onItemUpdate) {
									onItemUpdate(item.id, newStart, newEnd);
								}
							}}
						/>
					);
				})}
			</div>
		</div>
	);
};

// Главный компонент таймлайна
export const Timeline: React.FC<TimelineProps> = ({
	segments,
	currentTime = 0,
	onTimeChange,
	onItemUpdate,
}) => {
	const [zoom, setZoom] = useState(50); // пикселей на секунду
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const timelineRef = useRef<HTMLDivElement>(null);

	const tracks = useMemo(() => createTracksFromSegments(segments), [segments]);

	// Вычисляем максимальную длительность
	const maxDuration = useMemo(() => {
		let max = 0;
		segments.forEach((segment) => {
			segment.words.forEach((word) => {
				if (word.end > max) {
					max = word.end;
				}
			});
		});
		return Math.ceil(max) + 5; // добавляем буфер
	}, [segments]);

	const timelineWidth = maxDuration * zoom + TIMELINE_PADDING * 2;

	// Обработчик клика по таймлайну для изменения времени
	const handleTimelineClick = (e: React.MouseEvent) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left - TIMELINE_PADDING;
		const time = Math.max(0, x / zoom);

		if (onTimeChange) {
			onTimeChange(time);
		}
	};

	// Обработчик зума
	const handleZoom = useCallback((delta: number) => {
		setZoom((prev) => Math.max(10, Math.min(200, prev + delta)));
	}, []);

	// Горячие клавиши
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!timelineRef.current) return;

			switch (e.key) {
				case '+':
				case '=':
					e.preventDefault();
					handleZoom(10);
					break;
				case '-':
					e.preventDefault();
					handleZoom(-10);
					break;
				case 'Home':
					e.preventDefault();
					if (onTimeChange) onTimeChange(0);
					break;
				case 'End':
					e.preventDefault();
					if (onTimeChange) onTimeChange(maxDuration);
					break;
				case 'ArrowLeft':
					e.preventDefault();
					if (onTimeChange) onTimeChange(Math.max(0, currentTime - 0.1));
					break;
				case 'ArrowRight':
					e.preventDefault();
					if (onTimeChange)
						onTimeChange(Math.min(maxDuration, currentTime + 0.1));
					break;
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [currentTime, maxDuration, onTimeChange, handleZoom]);

	// Создаем временные метки
	const timeMarkers = [];
	const markerInterval = zoom > 100 ? 1 : zoom > 50 ? 5 : 10;

	for (let i = 0; i <= maxDuration; i += markerInterval) {
		timeMarkers.push(
			<div
				key={i}
				style={{
					position: 'absolute',
					left: `${i * zoom + TIMELINE_PADDING}px`,
					top: '0',
					height: '20px',
					borderLeft: '1px solid #666',
					fontSize: '12px',
					color: '#999',
					paddingLeft: '4px',
					paddingTop: '2px',
				}}
			>
				{i}s
			</div>
		);
	}

	return (
		<div
			ref={timelineRef}
			style={{
				backgroundColor: '#0f0f0f',
				border: '1px solid #333',
				borderRadius: '8px',
				overflow: 'auto',
				maxHeight: '400px',
				position: 'relative',
			}}
			tabIndex={0}
		>
			{/* Заголовок с контролами */}
			<div
				style={{
					padding: '10px 20px',
					borderBottom: '1px solid #333',
					backgroundColor: '#1a1a1a',
					color: '#fff',
					fontWeight: 'bold',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<span>Таймлайн караоке ({tracks.length} треков)</span>
				<div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
					<button
						onClick={() => handleZoom(-10)}
						style={{
							padding: '4px 8px',
							backgroundColor: '#333',
							color: '#fff',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '12px',
						}}
					>
						-
					</button>
					<span style={{fontSize: '12px', color: '#ccc'}}>{zoom}px/s</span>
					<button
						onClick={() => handleZoom(10)}
						style={{
							padding: '4px 8px',
							backgroundColor: '#333',
							color: '#fff',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '12px',
						}}
					>
						+
					</button>
				</div>
			</div>

			{/* Временная шкала */}
			<div
				style={{
					position: 'relative',
					height: '30px',
					backgroundColor: '#2a2a2a',
					borderBottom: '1px solid #333',
					cursor: 'pointer',
					width: `${timelineWidth}px`,
				}}
				onClick={handleTimelineClick}
			>
				{timeMarkers}

				{/* Указатель текущего времени */}
				<div
					style={{
						position: 'absolute',
						left: `${currentTime * zoom + TIMELINE_PADDING}px`,
						top: '0',
						height: '100%',
						width: '2px',
						backgroundColor: '#FF4444',
						zIndex: 100,
						boxShadow: '0 0 10px #FF4444',
					}}
				/>
			</div>

			{/* Треки */}
			<div
				style={{
					width: `${timelineWidth}px`,
				}}
			>
				{tracks.map((track) => (
					<TimelineTrackComponent
						key={track.id}
						track={track}
						currentTime={currentTime}
						scale={zoom}
						maxDuration={maxDuration}
						onItemUpdate={onItemUpdate}
					/>
				))}
			</div>

			{/* Информация и горячие клавиши */}
			<div
				style={{
					padding: '10px 20px',
					borderTop: '1px solid #333',
					backgroundColor: '#1a1a1a',
					color: '#999',
					fontSize: '12px',
				}}
			>
				<div style={{marginBottom: '5px'}}>
					Треков: {tracks.length} | Общая длительность: {maxDuration.toFixed(1)}
					s | Текущее время: {currentTime.toFixed(2)}s
				</div>
				<div style={{fontSize: '11px', color: '#666'}}>
					Горячие клавиши: +/- (зум), ←/→ (время), Home/End (начало/конец)
				</div>
			</div>
		</div>
	);
};
