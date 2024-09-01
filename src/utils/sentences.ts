function isAbbrev(s: string, abbrev?: string[]) {
  /*Checks if string s is an abbreviation (With periods)*/
  const single_abbrv = abbrev ?? [
    "a.m",
    "p.m",
    "etc",
    "vol",
    "inc",
    "jr",
    "dr",
    "tex",
    "co",
    "prof",
    "rev",
    "revd",
    "hon",
    "v.s",
    "ie",
    "eg",
    "et al",
    "st",
    "ph.d",
    "capt",
    "mr",
    "mrs",
    "ms",
  ];
  /*Follows the simple abbreviation patterns*/
  if (
    single_abbrv.includes(s.toLowerCase()) ??
    single_abbrv.includes(s.toLowerCase().slice(0, Math.max(0, s.length - 1)))
  ) {
    return true;
  }

  /*Possibly an abbreviation like U.S. or D.C, check if it contains periods with less than 2 letters between each period*/
  if (s.endsWith(".")) s = s.slice(0, Math.max(0, s.length - 1));
  const splittedS = s.split(".");
  return splittedS.length > 1 && splittedS.some((x) => x.length <= 2);
}

export function extract(
  body_text: string,
  abbrev?: string[],
  divider?: string[],
) {
  const sentences = [];
  let start = 0;
  divider = divider ?? [".", "?", "!"];

  for (let index = 0; index < body_text.length; index++) {
    /*Check if it's an end of a sentence*/
    const temporary = body_text
      .slice(start, Math.min(body_text.length - 1, index + 1))
      .split(" ");

    if (
      divider.includes(
        body_text[index],
      ) /*Check for end of sentence punctuation*/ &&
      /*Check for spaces/special chars that make sure it's the end of an sentence*/
      (body_text[index + 1] == " " ||
        body_text[index + 1] == '"' ||
        index >= body_text.length - 1 ||
        body_text[index + 1] == "[") &&
      /*Check that it's really the end and not an abbreviation*/
      !isAbbrev(temporary.at(-1)!, abbrev)
    ) {
      sentences.push(
        body_text.slice(start, Math.min(body_text.length, index + 1)),
      );
      start = index + 1;
    }
  }
  return sentences;
}
