import { createContext, useContext } from "react";  
import { z } from "zod";
import { KARAOKE_CONFIG } from "../_config"; 

export const configSchema = z.object({
    transparent: z.boolean(),
    splitLines: z.boolean(),
    splitLinesConfig: z.string(),
    splitWords: z.boolean(),
    splitWordsConfig: z.string(),
    coverText: z.string().optional(),
    coverTop: z.string().optional(),
    coverBottom: z.string().optional(),
    coverEmoji: z.string().optional(),
	stems: z.nullable(z.object({
		guitar: z.boolean(),
		bass: z.boolean(),
		drums: z.boolean(),
		percussion: z.boolean(),
		synth: z.boolean(),
		vocals: z.boolean(),
	})),
});

export type ConfigProps = z.infer<typeof configSchema>;

export const defaultProps = {
    transparent: KARAOKE_CONFIG.transparent,
    splitLines: KARAOKE_CONFIG.splitLines,
    splitLinesConfig: '', // загружается асинхронно из файла в Root.tsx
    splitWords: KARAOKE_CONFIG.splitWords,
    splitWordsConfig: '', // загружается асинхронно из файла в Root.tsx
    stems: {
        guitar: true,
        bass: true,
        drums: true,
        percussion: true,
        synth: true,
        vocals: true,
    },
    coverText: '',
    coverTop: '',
    coverBottom: '',
    coverEmoji: '',
}

export const ConfigContext = createContext<ConfigProps>(defaultProps);

export const useConfig = () => useContext(ConfigContext); 

export const useStems = () => useConfig().stems;

export const useSplitLines = () => useConfig().splitLines;

export const useSplitWords = () => useConfig().splitWords;

export const useSplitLinesConfig = () => useConfig().splitLinesConfig;

export const useSplitWordsConfig = () => useConfig().splitWordsConfig;
