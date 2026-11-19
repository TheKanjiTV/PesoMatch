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
        return 'Review ONLY writing relevance, clarity and completeness for the vacancy. For missing information ask questions first, never fill gaps. Constrained rewrites: use only content words already in the resume or additional_facts, plus English/Filipino grammar connectives. Preserve negations. Rewrites must use only facts in the quoted original or additional_facts. Never invent achievements, credentials or quantified results. Return original exact substring, revision, reason. Do not assess qualification. Never turn a vacancy requirement into a candidate fact. Never offer a speculative rewrite, even with a disclaimer in its reason. If facts are insufficient return questions and suggestions=[]. Example of a permitted clarity edit: original "I used spreadsheets." to "Used spreadsheets."; adding expertise or outcomes is forbidden.';
    }

    public static function interview(int $answered): string
    {
        return 'Text interview PRACTICE only. Rubric 1=needs detail, 2=developing, 3=clear evidence, 4=well supported. Criteria: relevance (answers question), clarity (understandable), specific_examples (actual concrete evidence), organization (logical sequence). Do not score accent, grammar variety or writing style as employability. No invented sample answers. '.($answered === 0 ? 'Ask exactly ONE opening question related to vacancy and actual experience. feedback=[], improvement="", summary="".' : 'Evaluate only the most recent answer with exactly four rubric entries, using exact evidence_quote substrings of that answer (empty only when no evidence). Give an improvement using only supplied facts. '.($answered >= 5 ? 'Practice ends now. question="". Give a final practice summary of the actual conversation.' : 'Ask exactly ONE relevant follow-up based on the most recent answer. summary="".'));
    }
}
