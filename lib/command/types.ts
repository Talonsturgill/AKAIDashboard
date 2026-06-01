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
  display_radius_km: number | null;
  metadata: Record<string, unknown> | null;
};

export type EntityRow = {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  headquarters_latitude: number | null;
  headquarters_longitude: number | null;
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

/** One polyline drawn on the /command map. Sourced from the `fiber_routes`
 *  table so new cables show up without code changes. */
export type FiberRoute = {
  id: string;
  slug: string;
  name: string;
  operator_entity_id: string | null;
  waypoints: [number, number][]; // [lat, lng] pairs, ready for L.polyline
  color: string | null;
  weight: number | null;
  status: string | null;
};
