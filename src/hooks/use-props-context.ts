import { myCompSchema } from "../Composition";
import { createContext, useContext } from "react";
import { z } from "zod";

export const PropsContext = createContext<z.infer<typeof myCompSchema>>({
	transparent: false,
	stems: {
      guitar: false,
      bass: false,
      drums: false,
      percussion: false,
      synth: false,
      vocals: false,
	},
});

export const usePropsContext = () => useContext(PropsContext); 
