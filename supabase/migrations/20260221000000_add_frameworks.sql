-- ============================================================
-- Migration: Add Multi-Framework Prioritization Support
-- Date: 2026-02-21
-- ============================================================

-- ─── 1. Add active_framework to workspaces ──────────────────
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS active_framework text NOT NULL DEFAULT 'rice'
    CHECK (active_framework IN ('rice','ice','moscow','jtbd','kano','impact_effort','wsjf'));

-- ─── 2. Add ICE score fields to feature_requests ────────────
ALTER TABLE feature_requests
    ADD COLUMN IF NOT EXISTS ice_impact      integer CHECK (ice_impact BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS ice_confidence  integer CHECK (ice_confidence BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS ice_ease        integer CHECK (ice_ease BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS ice_score       numeric(6,2);

-- ─── 3. MoSCoW fields ───────────────────────────────────────
ALTER TABLE feature_requests
    ADD COLUMN IF NOT EXISTS moscow_category  text CHECK (moscow_category IN ('must_have','should_have','could_have','wont_have')),
    ADD COLUMN IF NOT EXISTS moscow_rationale text;

-- ─── 4. JTBD fields ─────────────────────────────────────────
ALTER TABLE feature_requests
    ADD COLUMN IF NOT EXISTS jtbd_job_statement     text,
    ADD COLUMN IF NOT EXISTS jtbd_importance        integer CHECK (jtbd_importance BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS jtbd_satisfaction      integer CHECK (jtbd_satisfaction BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS jtbd_opportunity_score numeric(6,2);

-- ─── 5. Kano fields ─────────────────────────────────────────
ALTER TABLE feature_requests
    ADD COLUMN IF NOT EXISTS kano_category              text CHECK (kano_category IN ('must_be','one_dimensional','attractive','indifferent','reverse','questionable')),
    ADD COLUMN IF NOT EXISTS kano_functional_response   text CHECK (kano_functional_response IN ('like','expect','neutral','tolerate','dislike')),
    ADD COLUMN IF NOT EXISTS kano_dysfunctional_response text CHECK (kano_dysfunctional_response IN ('like','expect','neutral','tolerate','dislike')),
    ADD COLUMN IF NOT EXISTS kano_satisfaction_score    integer;

-- ─── 6. Impact/Effort fields ────────────────────────────────
ALTER TABLE feature_requests
    ADD COLUMN IF NOT EXISTS ie_impact   integer CHECK (ie_impact BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS ie_effort   integer CHECK (ie_effort BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS ie_quadrant text CHECK (ie_quadrant IN ('quick_win','major_project','fill_in','thankless_task'));

-- ─── 7. WSJF fields ─────────────────────────────────────────
ALTER TABLE feature_requests
    ADD COLUMN IF NOT EXISTS wsjf_user_business_value integer CHECK (wsjf_user_business_value BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS wsjf_time_criticality    integer CHECK (wsjf_time_criticality BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS wsjf_risk_reduction      integer CHECK (wsjf_risk_reduction BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS wsjf_job_size            integer CHECK (wsjf_job_size BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS wsjf_score               numeric(6,2);

-- ============================================================
-- TRIGGERS — auto-compute derived scores
-- ============================================================

-- ─── ICE Score trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION compute_ice_score()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ice_impact IS NOT NULL AND NEW.ice_confidence IS NOT NULL AND NEW.ice_ease IS NOT NULL THEN
        NEW.ice_score := ROUND((NEW.ice_impact * NEW.ice_confidence * NEW.ice_ease)::numeric / 3.0, 2);
    ELSE
        NEW.ice_score := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_ice_score ON feature_requests;
CREATE TRIGGER trg_compute_ice_score
    BEFORE INSERT OR UPDATE OF ice_impact, ice_confidence, ice_ease
    ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION compute_ice_score();

-- ─── JTBD Opportunity Score trigger ─────────────────────────
CREATE OR REPLACE FUNCTION compute_jtbd_score()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.jtbd_importance IS NOT NULL AND NEW.jtbd_satisfaction IS NOT NULL THEN
        NEW.jtbd_opportunity_score := ROUND(
            (NEW.jtbd_importance + GREATEST(NEW.jtbd_importance - NEW.jtbd_satisfaction, 0))::numeric,
            2
        );
    ELSE
        NEW.jtbd_opportunity_score := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_jtbd_score ON feature_requests;
CREATE TRIGGER trg_compute_jtbd_score
    BEFORE INSERT OR UPDATE OF jtbd_importance, jtbd_satisfaction
    ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION compute_jtbd_score();

-- ─── Impact/Effort Quadrant trigger ─────────────────────────
CREATE OR REPLACE FUNCTION compute_ie_quadrant()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ie_impact IS NOT NULL AND NEW.ie_effort IS NOT NULL THEN
        IF NEW.ie_impact >= 6 AND NEW.ie_effort <= 5 THEN
            NEW.ie_quadrant := 'quick_win';
        ELSIF NEW.ie_impact >= 6 AND NEW.ie_effort > 5 THEN
            NEW.ie_quadrant := 'major_project';
        ELSIF NEW.ie_impact < 6 AND NEW.ie_effort <= 5 THEN
            NEW.ie_quadrant := 'fill_in';
        ELSE
            NEW.ie_quadrant := 'thankless_task';
        END IF;
    ELSE
        NEW.ie_quadrant := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_ie_quadrant ON feature_requests;
CREATE TRIGGER trg_compute_ie_quadrant
    BEFORE INSERT OR UPDATE OF ie_impact, ie_effort
    ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION compute_ie_quadrant();

-- ─── WSJF Score trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION compute_wsjf_score()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.wsjf_user_business_value IS NOT NULL
       AND NEW.wsjf_time_criticality IS NOT NULL
       AND NEW.wsjf_risk_reduction IS NOT NULL
       AND NEW.wsjf_job_size IS NOT NULL
       AND NEW.wsjf_job_size > 0 THEN
        NEW.wsjf_score := ROUND(
            (NEW.wsjf_user_business_value + NEW.wsjf_time_criticality + NEW.wsjf_risk_reduction)::numeric
            / NEW.wsjf_job_size,
            2
        );
    ELSE
        NEW.wsjf_score := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_wsjf_score ON feature_requests;
CREATE TRIGGER trg_compute_wsjf_score
    BEFORE INSERT OR UPDATE OF wsjf_user_business_value, wsjf_time_criticality, wsjf_risk_reduction, wsjf_job_size
    ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION compute_wsjf_score();

-- ─── Kano Category & Score trigger ──────────────────────────
CREATE OR REPLACE FUNCTION compute_kano_category()
RETURNS TRIGGER AS $$
DECLARE
    v_category text;
    v_score    integer;
BEGIN
    IF NEW.kano_functional_response IS NOT NULL AND NEW.kano_dysfunctional_response IS NOT NULL THEN
        -- Kano evaluation matrix
        v_category := CASE
            WHEN NEW.kano_functional_response = 'like'    AND NEW.kano_dysfunctional_response = 'dislike'  THEN 'one_dimensional'
            WHEN NEW.kano_functional_response = 'like'    AND NEW.kano_dysfunctional_response = 'tolerate' THEN 'attractive'
            WHEN NEW.kano_functional_response = 'like'    AND NEW.kano_dysfunctional_response = 'neutral'  THEN 'attractive'
            WHEN NEW.kano_functional_response = 'like'    AND NEW.kano_dysfunctional_response = 'expect'   THEN 'attractive'
            WHEN NEW.kano_functional_response = 'like'    AND NEW.kano_dysfunctional_response = 'like'     THEN 'questionable'
            WHEN NEW.kano_functional_response = 'expect'  AND NEW.kano_dysfunctional_response = 'dislike'  THEN 'must_be'
            WHEN NEW.kano_functional_response = 'expect'  AND NEW.kano_dysfunctional_response = 'tolerate' THEN 'indifferent'
            WHEN NEW.kano_functional_response = 'expect'  AND NEW.kano_dysfunctional_response = 'neutral'  THEN 'indifferent'
            WHEN NEW.kano_functional_response = 'expect'  AND NEW.kano_dysfunctional_response = 'expect'   THEN 'indifferent'
            WHEN NEW.kano_functional_response = 'expect'  AND NEW.kano_dysfunctional_response = 'like'     THEN 'reverse'
            WHEN NEW.kano_functional_response = 'neutral' AND NEW.kano_dysfunctional_response = 'dislike'  THEN 'must_be'
            WHEN NEW.kano_functional_response = 'neutral' AND NEW.kano_dysfunctional_response = 'tolerate' THEN 'indifferent'
            WHEN NEW.kano_functional_response = 'neutral' AND NEW.kano_dysfunctional_response = 'neutral'  THEN 'indifferent'
            WHEN NEW.kano_functional_response = 'neutral' AND NEW.kano_dysfunctional_response = 'expect'   THEN 'indifferent'
            WHEN NEW.kano_functional_response = 'neutral' AND NEW.kano_dysfunctional_response = 'like'     THEN 'reverse'
            WHEN NEW.kano_functional_response = 'tolerate' AND NEW.kano_dysfunctional_response = 'dislike' THEN 'must_be'
            WHEN NEW.kano_functional_response = 'tolerate' AND NEW.kano_dysfunctional_response = 'tolerate' THEN 'indifferent'
            WHEN NEW.kano_functional_response = 'tolerate' AND NEW.kano_dysfunctional_response = 'neutral' THEN 'indifferent'
            WHEN NEW.kano_functional_response = 'tolerate' AND NEW.kano_dysfunctional_response = 'expect'  THEN 'indifferent'
            WHEN NEW.kano_functional_response = 'tolerate' AND NEW.kano_dysfunctional_response = 'like'    THEN 'reverse'
            WHEN NEW.kano_functional_response = 'dislike' THEN 'reverse'
            ELSE 'indifferent'
        END;

        v_score := CASE v_category
            WHEN 'attractive'      THEN 10
            WHEN 'one_dimensional' THEN 7
            WHEN 'must_be'         THEN 5
            WHEN 'indifferent'     THEN 2
            WHEN 'reverse'         THEN 0
            WHEN 'questionable'    THEN 1
            ELSE 2
        END;

        NEW.kano_category         := v_category;
        NEW.kano_satisfaction_score := v_score;
    ELSE
        NEW.kano_category           := NULL;
        NEW.kano_satisfaction_score := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_kano ON feature_requests;
CREATE TRIGGER trg_compute_kano
    BEFORE INSERT OR UPDATE OF kano_functional_response, kano_dysfunctional_response
    ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION compute_kano_category();
