"""
Script to process India District Shapefile into WGS84 GeoJSON for Leaflet.

Source: geoBoundaries IND ADM2 (ODbL 1.0 / CC BY 4.0)
Origin: Local Government Directory (LGD, Ministry of Panchayati Raj)
CRS: EPSG:4326 (WGS84)
Target Output: src/data/districts.geojson & public/data/districts.geojson
"""

import os
import shutil
import json
import geopandas as gpd

def process_shapefile():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    shp_path = os.path.join(base_dir, 'gis_data', 'geoboundaries_adm2', 'geoBoundaries-IND-ADM2_simplified.shp')
    states_geojson = os.path.join(base_dir, 'public', 'data', 'india-states.geojson')
    target_src = os.path.join(base_dir, 'src', 'data', 'districts.geojson')
    target_public = os.path.join(base_dir, 'public', 'data', 'districts.geojson')

    print(f"Loading shapefile from: {shp_path}")
    if not os.path.exists(shp_path):
        raise FileNotFoundError(f"Shapefile not found at {shp_path}")

    # 1. Read Shapefile with GeoPandas
    gdf = gpd.read_file(shp_path)
    
    print("\n--- SHAPEFILE INSPECTION ---")
    print(f"Original CRS: {gdf.crs}")
    print(f"Number of districts: {len(gdf)}")
    print(f"Raw shapefile columns: {list(gdf.columns)}")

    # 2. Ensure CRS is WGS84 (EPSG:4326)
    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
        print("Reprojecting to EPSG:4326...")
        gdf = gdf.to_crs(epsg=4326)
    else:
        print("CRS is confirmed WGS84 (EPSG:4326).")

    # 3. Read States geometry for spatial state attribution
    print(f"Loading reference states from: {states_geojson}")
    states_gdf = gpd.read_file(states_geojson)
    if states_gdf.crs is None or states_gdf.crs.to_epsg() != 4326:
        states_gdf = states_gdf.to_crs(epsg=4326)

    # Spatial join using representative interior point to accurately capture state
    pts = gdf.copy()
    pts['geometry'] = pts.geometry.representative_point()
    joined = gpd.sjoin(pts, states_gdf[['st_nm', 'st_code', 'geometry']], how='left', predicate='within')

    gdf['state'] = joined['st_nm']
    gdf['st_nm'] = joined['st_nm']
    gdf['st_code'] = joined['st_code']

    # Known island/enclave fallbacks
    manual_mapping = {
        'Diu': ('Dadra and Nagar Haveli and Daman and Diu', 'DN_DD'),
        'Mahe': ('Puducherry', 'PY'),
        'Lakshadweep': ('Lakshadweep', 'LD')
    }
    for dist_name, (st_name, st_c) in manual_mapping.items():
        mask = gdf['shapeName'] == dist_name
        gdf.loc[mask, 'state'] = st_name
        gdf.loc[mask, 'st_nm'] = st_name
        gdf.loc[mask, 'st_code'] = st_c

    # Standardize district and state attributes for Leaflet UI consumption
    gdf['district'] = gdf['shapeName']
    gdf['dt_nm'] = gdf['shapeName']
    gdf['name'] = gdf['shapeName']

    # Select and order properties
    cols_to_keep = [
        'district',
        'state',
        'st_nm',
        'dt_nm',
        'name',
        'st_code',
        'shapeID',
        'shapeName',
        'shapeGroup',
        'shapeType',
        'geometry'
    ]
    gdf = gdf[cols_to_keep]

    print("\n--- ATTRIBUTES VERIFICATION ---")
    print(f"Total features: {len(gdf)}")
    print(f"Missing state values: {gdf['state'].isna().sum()}")
    print(f"Missing district values: {gdf['district'].isna().sum()}")
    print("Sample record properties:")
    print(gdf.drop(columns='geometry').iloc[0].to_dict())

    # 4. Export to GeoJSON
    print(f"\nExporting GeoJSON to: {target_src}")
    os.makedirs(os.path.dirname(target_src), exist_ok=True)
    gdf.to_file(target_src, driver='GeoJSON')

    # Also keep public/data/districts.geojson synchronized for asset fallbacks
    print(f"Synchronizing with: {target_public}")
    os.makedirs(os.path.dirname(target_public), exist_ok=True)
    shutil.copyfile(target_src, target_public)

    # 5. Verify Output GeoJSON
    with open(target_src, 'r', encoding='utf-8') as f:
        data = json.load(f)

    file_size_mb = os.path.getsize(target_src) / (1024 * 1024)
    print("\n--- OUTPUT VALIDATION ---")
    print(f"File size: {file_size_mb:.2f} MB")
    print(f"GeoJSON type: {data.get('type')}")
    print(f"Feature count: {len(data.get('features', []))}")
    first_feat = data['features'][0]
    print("First feature properties:", first_feat['properties'])
    print(f"Geometry type: {first_feat['geometry']['type']}")
    print("Export completed successfully!")

if __name__ == '__main__':
    process_shapefile()
