# Evaluating GPT-4's Ability in Summarizing Key Points from Terms of Service Documents

**Cheung, Ka Pui**<br />AP Research<br />Grade 12, High School<br />

> This project started in Oct 2023 and ended in May 2024.

> The code for this project is licensed under the MIT license. You are free to use this as a template for your research (with proper citation).

### Table of Contents

- [Abstract](#abstract)
- [Technical Information](#technical-information)
- [Usage](#usage)
  - [View Database](#view-database)
  - [Open Grafana Analytics Dashboard](#open-grafana-analytics-dashboard)
  - [Commands](#commands)
    - [`bun sample`](#bun-sample)
    - [`bun summarize`](#bun-summarize)
    - [`bun analyze`](#bun-analyze)
- [Possible Improvements for Edge Cases](#possible-improvements-for-edge-cases)
- [Why Open Source?](#why-open-source)
- [Credits](#credits)
  - [Datasets](#datasets)
  - [Third-Party Libraries](#third-party-libraries)
    - [Extractors](#extractors)
    - [Complexity Analysis of ToS Documents](#complexity-analysis-of-tos-documents)
    - [Accuracy Analysis of GPT Summarizations](#accuracy-analysis-of-gpt-summarizations)

## Abstract

This project aims to assess the effectiveness of GPT-4 in summarizing key points from Terms of Service (ToS) documents. By doing so, it seeks to address the challenges of accessibility and comprehension that internet service users often encounter. The project employs a diverse dataset of ToS documents drawn from various online services.

The evaluation methodology involves comparing GPT-4-generated summaries against reference summaries produced by human volunteers from the ToS:DR database. Several statistical metrics are employed to assess the model’s performance, including SMOG, Flesch Reading Ease, Flesch-Kincaid Grade Level, Gunning Fog Index, Coleman-Liau Index, Dale-Chall Readability Formula, word count, BLEU score, and F1-score. These metrics provide valuable insights into GPT-4’s potential as a tool for enhancing the accessibility of ToS documents.

## Technical Information

This codebase leverages various technologies for efficient data management and processing. Research data is stored using Prisma, an ORM for PostgreSQL, which runs on Docker for containerization. Data is downloaded and processed through integrated APIs from OpenAI and ToS;DR. Automation tools, including a command-line interface (CLI), are developed in TypeScript for streamlined operations.

## Usage

To run the project code, clone this repository and install dependencies:

```bash
git clone https://github.com/kapuic/gpt-tos.git
cd gpt-tos
bun install # or use your preferred package manager
```

Start a PostgreSQL instance. You may use the `docker-compose.yml` file included in this repository:

```bash
docker-compose up -d
```

Copy the `.env.example` file to `.env` and fill in the necessary environment variables.

### View Database

```sh
bun prisma studio
```

### Open Grafana Analytics Dashboard

Go to <127.0.0.1:3000>.

### Commands

#### `bun sample`

This script will create a sample of services.

#### `bun summarize`

This script will run the study by summarizing all documents in a sample.

#### `bun analyze`

This script will analyze documents and GPT summarizations, and find correlations between variables.

## Possible Improvements for Edge Cases

- Failure attempts are not captured in a log.
- The current document download process does not account for the possibility of multiple services using the same document URL. (Is this a problem at all?)
- Show dynamic stats when sampling and summarizing.

## Why Open Source?

Open-sourcing this project will enable others to replicate our work while promoting transparency and credibility. In addition, the project may be used as a template for researchers conducting similar studies on large language models. Therefore, after the College Board completed grading my AP Research project, I decided to open-source the code.

## Credits

### Datasets

- [Open PageRank](https://www.domcop.com/openpagerank/what-is-openpagerank/)

### Third-Party Libraries

###### Extractors

- `@extractus/article-extractor` by [Extractus `@extractus`](https://github.com/extractus) ([GitHub](https://github.com/extractus/article-extractor), [npm](https://www.npmjs.com/package/@extractus/article-extractor))

###### Complexity Analysis of ToS Documents

- `sentence-extractor` by [Gavin Song `@Gavin-Song`](https://github.com/Gavin-Song) ([GitHub](https://github.com/Gavin-Song/SentenceExtractor), [npm](https://www.npmjs.com/package/sentence-extractor))
- `words-count` by [Baozier `@byn9826`](https://github.com/byn9826) ([GitHub](https://github.com/byn9826/words-count), [npm](https://www.npmjs.com/package/words-count))
- `syllable` by [words `@words`](https://github.com/words) ([GitHub](https://github.com/words/syllable), [npm](https://www.npmjs.com/package/syllable))
- `smog-formula` by [words `@words`](https://github.com/words) ([GitHub](https://github.com/words/smog-formula), [npm](https://www.npmjs.com/package/smog-formula))
- `flesch-kincaid` by [words `@words`](https://github.com/words) ([GitHub](https://github.com/words/flesch-kincaid), [npm](https://www.npmjs.com/package/flesch-kincaid))
- `flesch` by [words `@words`](https://github.com/words) ([GitHub](https://github.com/words/flesch), [npm](https://www.npmjs.com/package/flesch))
- `gunning-fog` by [words `@words`](https://github.com/words) ([GitHub](https://github.com/words/gunning-fog), [npm](https://www.npmjs.com/package/gunning-fog))
- `coleman-liau` by [words `@words`](https://github.com/words) ([GitHub](https://github.com/words/coleman-liau), [npm](https://www.npmjs.com/package/coleman-liau))
- `dale-chall-formula` by [words `@words`](https://github.com/words) ([GitHub](https://github.com/words/dale-chall-formula), [npm](https://www.npmjs.com/package/dale-chall-formula))

###### Accuracy Analysis of GPT Summarizations

- `bleu-score` by [words `@words`](https://github.com/words) ([GitHub](https://github.com/words/bleu-score), [npm](https://www.npmjs.com/package/bleu-score))
- `rouge` by [Kenneth Lim `@kenlimmj`](https://github.com/kenlimmj) ([GitHub](https://github.com/kenlimmj/rouge), [npm](https://www.npmjs.com/package/rouge))

To use the above packages in another project:

```sh
bun install @extractus/article-extractor sentence-extractor words-count syllable smog-formula flesch-kincaid flesch gunning-fog coleman-liau dale-chall-formula bleu-score rouge
```
