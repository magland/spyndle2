import dj_init_franklab  # noqa: F401
import json
import time
import os
import numpy as np
import boto3
import datajoint as dj
from uuid import UUID
from decimal import Decimal


def prepare_tables():
    if not os.path.exists('output/tables'):
        os.makedirs('output/tables')
    with open('table_names.json', 'r') as f:
        table_names = json.load(f)
    for table_name in table_names:
        fname = f'output/tables/{table_name}.json'
        if os.path.exists(fname):
            continue

        # skip these because there is a problem fetching
        if table_name in [
            '`common_lab`.`nwbfile`',
            '`common_lab`.`analysis_nwbfile`',
            '`common_nwbfile`.`nwbfile`',
            '`common_nwbfile`.`analysis_nwbfile`'
        ]:
            continue

        # skip these because they are too big
        if table_name in [
            '`common_interval`.`interval_list`',
            '`common_ephys`.`_electrode`'
        ]:
            continue

        print(f'Fetching table: {table_name}')
        tt = dj.FreeTable(dj.conn(), table_name)
        heading = tt.heading
        assert heading is not None
        heading_names = list(heading.names)
        primary_key = tt.primary_key
        columns_to_fetch = [
            name for name in heading_names
            if heading.attributes[name].type != 'blob'
        ]
        try:
            aa = tt.proj(*columns_to_fetch).fetch()
        except Exception as e:
            aa = None
            print(f'Warning: could not fetch table {table_name}: {e}')
        if aa is not None:
            rows = []
            for r in aa:
                row = {}
                for ii, name in enumerate(columns_to_fetch):
                    row[name] = _make_json_serializable(r[ii])
                rows.append(row)
            x = {
                'table_name': table_name,
                'columns': [
                    {
                        'name': name,
                        'type': heading.attributes[name].type
                    }
                    for name in heading_names
                ],
                'primary_key': primary_key,
                'rows': rows
            }
            with open(fname, 'w') as f:
                json.dump(x, f, indent=4)
        # if len(output['tables']) > 10:
        #     break


def _make_json_serializable(val):
    if type(val) == np.int64:  # noqa: E721
        return int(val)
    elif isinstance(val, np.ndarray):
        return _make_json_serializable(val.tolist())
    elif isinstance(val, list):
        return [_make_json_serializable(val) for val in val]
    elif isinstance(val, dict):
        return {key: _make_json_serializable(val[key]) for key in val}
    if isinstance(val, float) and np.isnan(val):
        return 'NaN'
    elif isinstance(val, float) and np.isinf(val):
        return 'Infinity' if val > 0 else '-Infinity'
    elif hasattr(val, 'isoformat'):
        return val.isoformat()  # type: ignore
    elif isinstance(val, UUID):
        return str(val)
    elif isinstance(val, Decimal):
        return str(val)
    try:
        json.dumps(val)
    except Exception:
        raise Exception(f'Unable to serialize value: {val} of type {type(val)}')
    return val


def prepare_sessions():
    if not os.path.exists('output/sessions'):
        os.makedirs('output/sessions')
    nwb_file_names = []
    with open('output/tables/`common_session`.`_session`.json', 'r') as f:
        x = json.load(f)
    for row in x['rows']:
        nwb_file_names.append(row['nwb_file_name'])
    nwb_file_names = sorted(nwb_file_names)

    with open('nwb_file_names.json', 'w') as f:
        json.dump(nwb_file_names, f, indent=4)
    _upload_file('nwb_file_names.json', 'spyndle/franklab/nwb_file_names.json')

    # get all table file names, files in the output directory
    table_names = []
    for fname in os.listdir('output/tables'):
        if not fname.endswith('.json'):
            continue
        table_names.append(fname[:-len('.json')])
    table_names = sorted(table_names)
    all_tables = {}
    for table_name in table_names:
        with open(f'output/tables/{table_name}.json', 'r') as f:
            x = json.load(f)
        all_tables[table_name] = x
    for nwb_file_name in nwb_file_names:
        print(f'Session: {nwb_file_name}')
        tables_for_session = []
        for table_name in table_names:
            x = all_tables[table_name]
            has_nwb_file_name = False
            rows = x['rows']
            for row in rows:
                if 'nwb_file_name' in row:
                    if row['nwb_file_name'] == nwb_file_name:
                        has_nwb_file_name = True
                        break
            if has_nwb_file_name:
                tables_for_session.append({
                    'table_name': table_name,
                    'columns': x['columns'],
                    'primary_key': x['primary_key'],
                    'rows': [row for row in rows if row['nwb_file_name'] == nwb_file_name]
                })
        session = {
            'nwb_file_name': nwb_file_name,
            'tables': tables_for_session
        }
        with open(f'output/sessions/{nwb_file_name}.json', 'w') as f:
            json.dump(session, f, indent=4)


def upload_session_files():
    for fname in os.listdir('output/sessions'):
        if not fname.endswith('.json'):
            continue
        _upload_file(f'output/sessions/{fname}', f'spyndle/franklab/sessions/{fname}')


def _upload_file(local_fname, remote_fname):
    print(f'Uploading {local_fname}')
    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        endpoint_url=os.environ["S3_ENDPOINT_URL"],
        region_name="auto",  # for cloudflare
    )
    bucket = 'neurosift'
    _upload_file_to_s3(
        s3=s3,
        bucket=bucket,
        object_key=remote_fname,
        fname=local_fname
    )


def _upload_file_to_s3(s3, bucket, object_key, fname):
    if fname.endswith(".html"):
        content_type = "text/html"
    elif fname.endswith(".js"):
        content_type = "application/javascript"
    elif fname.endswith(".css"):
        content_type = "text/css"
    elif fname.endswith(".png"):
        content_type = "image/png"
    elif fname.endswith(".jpg"):
        content_type = "image/jpeg"
    elif fname.endswith(".svg"):
        content_type = "image/svg+xml"
    elif fname.endswith(".json"):
        content_type = "application/json"
    elif fname.endswith(".gz"):
        content_type = "application/gzip"
    else:
        content_type = None
    extra_args = {}
    if content_type is not None:
        extra_args["ContentType"] = content_type
    num_retries = 3
    while True:
        try:
            s3.upload_file(fname, bucket, object_key, ExtraArgs=extra_args)
            break
        except Exception as e:
            print(f"Error uploading {object_key} to S3: {e}")
            time.sleep(3)
            num_retries -= 1
            if num_retries == 0:
                raise


if __name__ == '__main__':
    prepare_tables()
    prepare_sessions()
    upload_session_files()
