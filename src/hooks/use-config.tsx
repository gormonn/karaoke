import { createContext, useContext } from "react";  
import { z } from "zod";
import { KARAOKE_CONFIG } from "../_config"; 

export const configSchema = z.object({
    transparent: z.boolean(),
    splitLines: z.boolean(),
    splitLinesConfig: z.string(),
    splitByWords: z.boolean(),
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
    splitByWords: KARAOKE_CONFIG.splitByWords,
    stems: {
        guitar: true,
        bass: true,
        drums: true,
        percussion: true,
        synth: true,
        vocals: true,
    }
}

export const ConfigContext = createContext<ConfigProps>(defaultProps);

export const useConfig = () => useContext(ConfigContext); 

export const useStems = () => useConfig().stems;

export const useSplitLines = () => useConfig().splitLines;

export const useSplitByWords = () => useConfig().splitByWords;

export const useSplitLinesConfig = () => useConfig().splitLinesConfig;
