import { wordsDetect } from "words-count";
import { syllable } from "syllable";
import { smogFormula } from "smog-formula";
import { fleschKincaid as fleschKincaidFormula } from "flesch-kincaid";
import { flesch as fleschFormula } from "flesch";
import { gunningFog as gunningFogFormula } from "gunning-fog";
import { colemanLiau as colemanLiauFormula } from "coleman-liau";
import { daleChallFormula } from "dale-chall-formula";
import { extract } from "./utils/sentences";
import { daleChall as daleChallList } from "dale-chall";

function wordsWithSyllabusOrMore(words: string[], syllabus: number) {
  return words.filter((word) => syllable(word) >= syllabus);
}

interface SentenceComplexity {
  characterCount: number;
  wordCount: number;
  syllableCount: number;
  polysyllabicWordCount: number;
}

interface DocumentComplexity extends SentenceComplexity {
  /**
   * SMOG (Simple Measure of Gobbledygook) Index
   * [(Wikipedia)](https://en.wikipedia.org/wiki/SMOG)
   */
  smog: number;
  /**
   * Flesch–Kincaid Grade Level
   * [(Wikipedia)](https://en.wikipedia.org/wiki/Flesch–Kincaid_readability_tests#Flesch–Kincaid_grade_level)
   */
  fleschKincaid: number;
  /**
   * Flesch Reading Ease
   * [(Wikipedia)](https://en.wikipedia.org/wiki/Flesch–Kincaid_readability_tests#Flesch_reading_ease)
   */
  fleschReadingEase: number;
  /**
   * Gunning Fog Index
   * [(Wikipedia)](https://en.wikipedia.org/wiki/Gunning_fog_index)
   */
  gunningFog: number;
  /**
   * Coleman–Liau Index
   * [(Wikipedia)](https://en.wikipedia.org/wiki/Coleman–Liau_index)
   */
  colemanLiau: number;
  /**
   * Dale–Chall Readability Score
   * [(Wikipedia)](https://en.wikipedia.org/wiki/Dale–Chall_readability_formula)
   */
  daleChall: number;

  sentences: SentenceComplexity[];
}

export function analyzeDocumentComplexity(content: string): DocumentComplexity {
  const documentCharacterCount = content.length;
  const documentSentences = extract(content);
  const documentSentenceCount = documentSentences.length;
  const { count: documentWordCount, words: documentWords } =
    wordsDetect(content);
  const documentSyllableCount = syllable(content);
  const documentPolysyllabicWordCount = wordsWithSyllabusOrMore(
    documentWords,
    3,
  ).length;
  const smog = smogFormula({
    sentence: documentSentenceCount,
    polysillabicWord: documentPolysyllabicWordCount,
  });
  const fleschKincaid = fleschKincaidFormula({
    sentence: documentSentenceCount,
    word: documentWordCount,
    syllable: documentSyllableCount,
  });
  const fleschReadingEase = fleschFormula({
    sentence: documentSentenceCount,
    word: documentWordCount,
    syllable: documentSyllableCount,
  });
  const gunningFog = gunningFogFormula({
    sentence: documentSentenceCount,
    word: documentWordCount,
    complexPolysillabicWord: documentPolysyllabicWordCount,
  });
  const colemanLiau = colemanLiauFormula({
    sentence: documentSentenceCount,
    word: documentWordCount,
    letter: documentCharacterCount,
  });
  const difficultWords = documentWords.filter(
    (word) => !daleChallList.includes(word),
  );
  const daleChall = daleChallFormula({
    sentence: documentSentenceCount,
    word: documentWordCount,
    difficultWord: difficultWords.length,
  });

  const sentenceComplexities: SentenceComplexity[] = documentSentences.map(
    (sentence) => {
      const sentenceCharacterCount = sentence.length;
      const { count: sentenceWordCount, words: sentenceWords } =
        wordsDetect(sentence);
      const sentenceSyllableCount = syllable(sentence);
      const sentencePolysyllabicWordCount = wordsWithSyllabusOrMore(
        sentenceWords,
        3,
      ).length;
      return {
        characterCount: sentenceCharacterCount,
        wordCount: sentenceWordCount,
        syllableCount: sentenceSyllableCount,
        polysyllabicWordCount: sentencePolysyllabicWordCount,
      };
    },
  );

  return {
    characterCount: documentCharacterCount,
    wordCount: documentWordCount,
    syllableCount: documentSyllableCount,
    polysyllabicWordCount: documentPolysyllabicWordCount,
    smog,
    fleschKincaid,
    fleschReadingEase,
    gunningFog,
    colemanLiau,
    daleChall,
    sentences: sentenceComplexities,
  };
}
