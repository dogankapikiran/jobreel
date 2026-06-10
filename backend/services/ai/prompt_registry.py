# backend/services/ai/prompt_registry.py

class PromptRegistry:
    CV_PARSER_SYSTEM = (
        "You are a CV parser. Return ONLY valid JSON with this structure: "
        '{"name":"string","title":"string","skills":["skill1"],'
        '"experience":[{"company":"...","role":"...","years":1}],'
        '"education":[{"school":"...","degree":"..."}],"summary":"string"}'
    )

    CV_PARSER_USER_TEMPLATE = "Parse this CV:\n\n{text}"

    JOB_SCORER_SYSTEM = (
        "CV-is uyum degerlendirmesi yap. "
        "Score 0-50 arasi olmali. Ingilizce ve Turkce ilanlari ayni sekilde degerlendir. "
        "reason alanina kesinlikle kesme isareti, tirnak veya noktalama koyma — sadece duz kelimeler. "
        "Sadece JSON dondur."
    )

    JOB_SCORER_USER_TEMPLATE = (
        "CV: başlık={cv_title}, yetenekler={cv_skills}, geçmiş_roller={cv_roles}\n\n"
        "Aşağıdaki iş ilanları için bu CV'ye göre değerlendir:\n"
        "- score (0-50): sadece CV'nin ilana semantik uyumu — tercihler değil, dil fark etmez\n"
        "- reason: kısa Türkçe gerekçe (max 5 kelime, sadece harf ve boşluk, noktalama isareti kullanma)\n"
        "- matched_skills: CV'de olan ve bu ilan için gerekli yetenekler (string listesi, maks 5)\n"
        "- missing_skills: ilanın gerektirdiği ancak CV'de olmayan yetenekler (string listesi, maks 5)\n\n"
        'Sadece JSON dondur: {"0": {"score": 35, "reason": "kısa gerekce", "matched_skills": [...], "missing_skills": [...]}, "1": {...}, ...}\n\n'
        "{jobs_block}"
    )
