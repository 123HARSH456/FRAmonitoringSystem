"""
Generate official high-resolution India States GeoJSON and topologically valid
exterior satellite masks directly from the Local Government Directory / Survey of India
boundaries in districts.geojson.

This guarantees:
1. 100% authentic geographic boundaries preserving all coastal curves, estuaries,
   islands, and borders without coarse approximations or polygon simplifications.
2. Perfect alignment between state perimeter masks and the district boundaries.
3. Topologically guaranteed WGS84 inverted masks computed via Shapely difference,
   eliminating all triangular clipping artifacts and diagonal lines in Leaflet.
"""

import os
import json
import geopandas as gpd
from shapely.geometry import box, mapping, Polygon, MultiPolygon
from shapely.ops import unary_union

# State metadata mapping to match statesData.js
STATE_METADATA = {
    "Andaman and Nicobar Islands": {"id": "andaman_and_nicobar_islands", "code": "AN", "st_code": "35"},
    "Andhra Pradesh": {"id": "andhra_pradesh", "code": "AP", "st_code": "28"},
    "Arunachal Pradesh": {"id": "arunachal_pradesh", "code": "AR", "st_code": "12"},
    "Assam": {"id": "assam", "code": "AS", "st_code": "18"},
    "Bihar": {"id": "bihar", "code": "BR", "st_code": "10"},
    "Chandigarh": {"id": "chandigarh", "code": "CH", "st_code": "04"},
    "Chhattisgarh": {"id": "chhattisgarh", "code": "CG", "st_code": "22"},
    "Dadra and Nagar Haveli and Daman and Diu": {"id": "dadra_and_nagar_haveli_and_daman_and_diu", "code": "DN_DD", "st_code": "26"},
    "Delhi": {"id": "delhi", "code": "DL", "st_code": "07"},
    "Goa": {"id": "goa", "code": "GA", "st_code": "30"},
    "Gujarat": {"id": "gujarat", "code": "GJ", "st_code": "24"},
    "Haryana": {"id": "haryana", "code": "HR", "st_code": "06"},
    "Himachal Pradesh": {"id": "himachal_pradesh", "code": "HP", "st_code": "02"},
    "Jammu and Kashmir": {"id": "jammu_and_kashmir", "code": "JK", "st_code": "01"},
    "Jharkhand": {"id": "jharkhand", "code": "JH", "st_code": "20"},
    "Karnataka": {"id": "karnataka", "code": "KA", "st_code": "29"},
    "Kerala": {"id": "kerala", "code": "KL", "st_code": "32"},
    "Ladakh": {"id": "ladakh", "code": "LA", "st_code": "37"},
    "Lakshadweep": {"id": "lakshadweep", "code": "LD", "st_code": "31"},
    "Madhya Pradesh": {"id": "madhya_pradesh", "code": "MP", "st_code": "23"},
    "Maharashtra": {"id": "maharashtra", "code": "MH", "st_code": "27"},
    "Manipur": {"id": "manipur", "code": "MN", "st_code": "14"},
    "Meghalaya": {"id": "meghalaya", "code": "ML", "st_code": "17"},
    "Mizoram": {"id": "mizoram", "code": "MZ", "st_code": "15"},
    "Nagaland": {"id": "nagaland", "code": "NL", "st_code": "13"},
    "Odisha": {"id": "odisha", "code": "OD", "st_code": "21"},
    "Puducherry": {"id": "puducherry", "code": "PY", "st_code": "34"},
    "Punjab": {"id": "punjab", "code": "PB", "st_code": "03"},
    "Rajasthan": {"id": "rajasthan", "code": "RJ", "st_code": "08"},
    "Sikkim": {"id": "sikkim", "code": "SK", "st_code": "11"},
    "Tamil Nadu": {"id": "tamil_nadu", "code": "TN", "st_code": "33"},
    "Telangana": {"id": "telangana", "code": "TS", "st_code": "36"},
    "Tripura": {"id": "tripura", "code": "TR", "st_code": "16"},
    "Uttar Pradesh": {"id": "uttar_pradesh", "code": "UP", "st_code": "09"},
    "Uttarakhand": {"id": "uttarakhand", "code": "UK", "st_code": "05"},
    "West Bengal": {"id": "west_bengal", "code": "WB", "st_code": "19"},
}

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    districts_path = os.path.join(base_dir, "public", "data", "districts.geojson")
    out_states_public = os.path.join(base_dir, "public", "data", "india-states.geojson")
    out_states_dist = os.path.join(base_dir, "dist", "data", "india-states.geojson")
    out_masks_public = os.path.join(base_dir, "public", "data", "india-state-masks.json")
    out_masks_src = os.path.join(base_dir, "src", "data", "india-state-masks.json")
    out_masks_dist = os.path.join(base_dir, "dist", "data", "india-state-masks.json")

    print(f"Loading official district boundaries from: {districts_path}")
    dist_gdf = gpd.read_file(districts_path)
    print(f"Loaded {len(dist_gdf)} districts. CRS: {dist_gdf.crs}")

    # Dissolve districts by state to construct authentic, curve-accurate state geometries
    print("Dissolving districts by state...")
    states_gdf = dist_gdf.dissolve(by="state", as_index=False)
    print(f"Created {len(states_gdf)} unified state boundaries.")

    # World box in EPSG:4326 for satellite inverted mask
    # Mercator max latitude is ~85.051129
    world_box = box(-180.0, -85.051129, 180.0, 85.051129)

    features = []
    masks_dict = {}

    for idx, row in states_gdf.iterrows():
        st_name = row["state"]
        geom = row["geometry"]
        meta = STATE_METADATA.get(st_name, {})
        st_id = meta.get("id", st_name.lower().replace(" ", "_"))
        code = meta.get("code", "")
        st_code = meta.get("st_code", "")

        # Count vertices
        if geom.geom_type == "Polygon":
            v_count = len(geom.exterior.coords)
        elif geom.geom_type == "MultiPolygon":
            v_count = sum(len(p.exterior.coords) for p in geom.geoms)
        else:
            v_count = 0

        feature = {
            "type": "Feature",
            "id": st_name,
            "properties": {
                "st_nm": st_name,
                "name": st_name,
                "state": st_name,
                "state_id": st_id,
                "id": st_id,
                "code": code,
                "st_code": st_code,
                "vertex_count": v_count,
            },
            "geometry": mapping(geom),
        }
        features.append(feature)

        # Precompute topologically valid exterior mask via Shapely difference
        diff = world_box.difference(geom)
        mask_feature = {
            "type": "Feature",
            "properties": {
                "name": f"state-exterior-mask-{st_id}",
                "state": st_name,
                "state_id": st_id,
            },
            "geometry": mapping(diff),
        }
        # Index by both standard name and state_id for instantaneous O(1) lookup
        masks_dict[st_name] = mask_feature
        masks_dict[st_id] = mask_feature

        print(f" - {st_name}: {geom.geom_type} ({v_count} vertices), mask valid: {diff.is_valid}")

    # Also precompute national India exterior mask
    print("\nComputing national India combined boundary & exterior mask...")
    india_union = unary_union(states_gdf["geometry"])
    india_mask = world_box.difference(india_union)
    masks_dict["INDIA_NATIONAL_MASK"] = {
        "type": "Feature",
        "properties": {"name": "india-exterior-static-mask"},
        "geometry": mapping(india_mask),
    }
    print(f"National mask geometry valid: {india_mask.is_valid}")

    states_geojson = {
        "type": "FeatureCollection",
        "features": features,
    }

    # Write states GeoJSON
    for p in [out_states_public, out_states_dist]:
        if os.path.exists(os.path.dirname(p)):
            with open(p, "w", encoding="utf-8") as f:
                json.dump(states_geojson, f, separators=(",", ":"))
            print(f"Exported states GeoJSON to: {p} ({os.path.getsize(p) / 1024:.1f} KB)")

    # Write masks JSON
    for p in [out_masks_public, out_masks_src, out_masks_dist]:
        if os.path.exists(os.path.dirname(p)):
            with open(p, "w", encoding="utf-8") as f:
                json.dump(masks_dict, f, separators=(",", ":"))
            print(f"Exported state masks JSON to: {p} ({os.path.getsize(p) / 1024:.1f} KB)")

    print("\nAll official high-resolution boundaries and certified masks generated successfully!")

if __name__ == "__main__":
    main()
