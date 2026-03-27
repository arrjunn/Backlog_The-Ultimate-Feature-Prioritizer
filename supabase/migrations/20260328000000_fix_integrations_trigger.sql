-- Add updated_at trigger for workspace_integrations table
-- Without this trigger, the updated_at column never updates on row modification

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workspace_integrations_updated_at
BEFORE UPDATE ON workspace_integrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
