export type InfraProject = {
  id: string;
  name: string;
  project_type: string | null;
  operator_entity_id: string | null;
  latitude: number;
  longitude: number;
  location_name: string | null;
  capacity_metric: string | null;
  capacity_value: number | null;
  status: string | null;
  announced_date: string | null;
  operational_date: string | null;
  estimated_cost: number | null;
  source_urls: string[] | null;
  metadata: Record<string, unknown> | null;
};

export type EntityRow = {
  id: string;
  name: string;
  slug: string | null;
  type: string;
};

export type ContractRow = {
  id: string;
  title: string;
  contract_value: number | null;
  status: string | null;
  awarding_entity_id: string | null;
  winning_entity_id: string | null;
};

export type ArchiveRow = {
  id: string;
  title: string;
  source_url: string;
};
