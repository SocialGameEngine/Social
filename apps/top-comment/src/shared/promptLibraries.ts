import promptLibrariesMeta from "./promptLibraries.meta.json";
import classicPrompts from "./prompts.json";
import barPrompts from "./barPrompts.json";
import basicPrompts from "./basicprompts.json";
import halloweenPrompts from "./halloweenPrompts.json";
import selfiePrompts from "./selfiePrompts.json";
import victoriaPrompts from "./victoriaPrompts.json";
import dangerfieldPrompts from "./dangerfieldPrompts.json";
import medievalPrompts from "./medievalPrompts.json";
import animePrompts from "./animePrompts.json";
import politicsPrompts from "./politicsPrompts.json";
import scifiPrompts from "./scifiPrompts.json";
import popCulturePrompts from "./popCulturePrompts.json";
import cinemaPrompts from "./cinemaPrompts.json";
import canucksPrompts from "./canucksPrompts.json";
import bcPrompts from "./bcPrompts.json";
import techPrompts from "./techPrompts.json";
import internetCulturePrompts from "./internetCulturePrompts.json";
import datingAppPrompts from "./datingAppPrompts.json";
import remoteWorkPrompts from "./remoteWorkPrompts.json";
import adultingPrompts from "./adultingPrompts.json";
import groupChatPrompts from "./groupChatPrompts.json";
import streamingPrompts from "./streamingPrompts.json";
import climateAnxietyPrompts from "./climateAnxietyPrompts.json";
import fictionalWorldsPrompts from "./fictionalWorldsPrompts.json";

const promptFileMap: Record<string, string[]> = {
  "prompts.json": classicPrompts,
  "barPrompts.json": barPrompts,
  "basicprompts.json": basicPrompts,
  "halloweenPrompts.json": halloweenPrompts,
  "selfiePrompts.json": selfiePrompts,
  "victoriaPrompts.json": victoriaPrompts,
  "dangerfieldPrompts.json": dangerfieldPrompts,
  "medievalPrompts.json": medievalPrompts,
  "animePrompts.json": animePrompts,
  "politicsPrompts.json": politicsPrompts,
  "scifiPrompts.json": scifiPrompts,
  "popCulturePrompts.json": popCulturePrompts,
  "cinemaPrompts.json": cinemaPrompts,
  "canucksPrompts.json": canucksPrompts,
  "bcPrompts.json": bcPrompts,
  "techPrompts.json": techPrompts,
  "internetCulturePrompts.json": internetCulturePrompts,
  "datingAppPrompts.json": datingAppPrompts,
  "remoteWorkPrompts.json": remoteWorkPrompts,
  "adultingPrompts.json": adultingPrompts,
  "groupChatPrompts.json": groupChatPrompts,
  "streamingPrompts.json": streamingPrompts,
  "climateAnxietyPrompts.json": climateAnxietyPrompts,
  "fictionalWorldsPrompts.json": fictionalWorldsPrompts,
};

export type PromptLibraryId = (typeof promptLibrariesMeta)[number]["id"];

export interface PromptLibrary {
  id: PromptLibraryId;
  name: string;
  emoji: string;
  description: string;
  prompts: string[];
}

export const promptLibraries: PromptLibrary[] = promptLibrariesMeta.map(
  (meta) => ({
    id: meta.id as PromptLibraryId,
    name: meta.name,
    emoji: meta.emoji,
    description: meta.description,
    prompts: promptFileMap[meta.promptFile] ?? classicPrompts,
  }),
);

export const defaultPromptLibrary = promptLibraries[0];
export const defaultPromptLibraryId = defaultPromptLibrary?.id ?? "classic";
