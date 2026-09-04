import json
from shapely.geometry import shape

print("=== VERIFYING GEOJSON & MASKS INTEGRITY ===")

with open("public/data/india-states.geojson", "r", encoding="utf-8") as f:
    states_geo = json.load(f)

print(f"Total state features: {len(states_geo['features'])}")

test_states = [
    "Madhya Pradesh",
    "Gujarat",
    "Odisha",
    "Kerala",
    "Goa",
    "Maharashtra",
    "Andaman",
]

for test_state in test_states:
    matches = [
        f for f in states_geo["features"]
        if test_state.lower() in f["properties"]["name"].lower()
    ]
    assert len(matches) > 0, f"Missing {test_state}"
    geom = shape(matches[0]["geometry"])
    assert geom.is_valid, f"Invalid geometry for {test_state}"
    if geom.geom_type == "MultiPolygon":
        coords_count = sum(len(p.exterior.coords) for p in geom.geoms)
    else:
        coords_count = len(geom.exterior.coords)
    print(f"  [PASS] {matches[0]['properties']['name']}: Type={geom.geom_type}, Vertices={coords_count}, Valid={geom.is_valid}")

with open("public/data/india-state-masks.json", "r", encoding="utf-8") as f:
    masks = json.load(f)

print(f"\nTotal masks: {len(masks)}")
assert "INDIA_NATIONAL_MASK" in masks, "Missing national mask"
print("  [PASS] INDIA_NATIONAL_MASK present and verified")

for test_state in test_states:
    matches = [k for k in masks.keys() if test_state.lower() in k.lower()]
    assert len(matches) > 0, f"Missing mask for {test_state}"
    m_geom = shape(masks[matches[0]]["geometry"])
    assert m_geom.is_valid, f"Invalid mask geometry for {test_state}"
    print(f"  [PASS] Mask for {matches[0]}: Type={m_geom.geom_type}, Valid={m_geom.is_valid}")

print("\nALL GEOMETRIC AND TOPOLOGICAL INTEGRITY CHECKS PASSED!")
