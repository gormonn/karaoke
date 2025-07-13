import React, { createContext, useContext, FC, PropsWithChildren } from 'react';
import { WhisperResponse } from '../types';
import { useSubtitles } from '../hooks/use-subs';

const SubtitlesContext = createContext<WhisperResponse | null>(null);

export const SubtitlesProvider: FC<PropsWithChildren> = ({ children }) => {
  const subtitles = useSubtitles();

  return (
    <SubtitlesContext.Provider value={subtitles}>
      {children}
    </SubtitlesContext.Provider>
  );
};

export const useSubtitlesContext = () => {
  const context = useContext(SubtitlesContext);
  if (context === undefined) {
    throw new Error('useSubtitlesContext must be used within a SubtitlesProvider');
  }
  return context;
}; 