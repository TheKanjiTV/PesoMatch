<?php

namespace App\Services;

class AiPrompts
{
    public static function adviser(): string
    {
        return 'Give relevant profile evidence, requirements NOT STATED in supplied evidence, follow-up questions and personalized development steps. Training IDs must be a subset of supplied records. Do not infer availability or eligibility. For every relevant evidence claim select an evidence_id from profile_evidence and explain its relevance. Do not reproduce or paraphrase a quote; the server will attach the original source text. Never use vacancy or training text as applicant evidence.';
    }

    public static function resume(): string
    {
        return 'Review ONLY writing relevance, clarity and completeness for the vacancy. This applies to ALL fields, not only rewrites: never decide qualified/disqualified or claim a credential is absent when merely not stated. Spreadsheet work does not establish Microsoft Excel usage. Ask which software was used. State documentary requirements as needing PESO verification, not candidate disqualification. For missing information ask questions first, never fill gaps. Constrained rewrites: use only content words already in the resume or additional_facts, plus English/Filipino grammar connectives. Preserve negations. Rewrites must use only facts in the quoted original or additional_facts. Never invent achievements, credentials or quantified results. Return original exact substring, revision, reason. Do not assess qualification. Never turn a vacancy requirement into a candidate fact. Never offer a speculative rewrite, even with a disclaimer in its reason. If facts are insufficient return questions and suggestions=[]. Example of a permitted clarity edit: original "I used spreadsheets." to "Used spreadsheets."; adding expertise or outcomes is forbidden.';
    }

    public static function interview(int $answered): string
    {
        return 'Current phase: '.($answered === 0 ? 'OPENING QUESTION.' : 'ANSWER FEEDBACK, turn '.$answered.' of 5. The applicant already answered; never return the opening question.').' Text interview PRACTICE only. Rubric 1=needs detail, 2=developing, 3=clear evidence, 4=well supported. Criteria: relevance (answers question), clarity (understandable), specific_examples (actual concrete evidence), organization (logical sequence). Do not score accent, grammar variety or writing style as employability. No invented sample answers. '.($answered === 0 ? 'Ask exactly ONE opening question related to vacancy and actual experience. Return only the question field; there is no answer to evaluate yet.' : 'Evaluate only the most recent answer with exactly four rubric entries, using exact evidence_quote substrings of that answer (empty only when no evidence). Give an improvement using only supplied facts. '.($answered >= 5 ? 'Practice ends now. question="". Give a final practice summary of the actual conversation.' : 'Use follow_up_focus as the topic for ONE new question, asking for clarification if the answer lacks that information. Do not assume the applicant has that experience. Ask exactly ONE NEW relevant follow-up based on latest_answer and a different missing detail, such as the actual process, tool, challenge or outcome if not yet covered. Inspect ALL previous questions in conversation; never repeat or merely paraphrase one. If the answer repeats, acknowledge the missing detail by asking a narrower clarification without inventing experience. summary="".'));
    }
}
