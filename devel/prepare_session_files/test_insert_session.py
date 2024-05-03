import lindi  # noqa: F401
import dj_init  # noqa: F401
from dj_init import SPYGLASS_BASE_DIR

import os
import requests
import spyglass.data_import as sdi  # noqa: E402


def test_insert_session():
    # https://neurosift.app/?p=/nwb&dandisetId=000629&dandisetVersion=draft&url=https://api.dandiarchive.org/api/assets/efe22650-8f8b-48ac-85c8-2d5a42c00744/download/
    # nwb_file_name = '000629|sub-bernard|sub-bernard_ses-bernard-02_behavior+ecephys.nwb.lindi.json'
    nwb_file_name = 'y000010.nwb.lindi.json'
    dandi_file_url = 'https://fsbucket-dendro.flatironinstitute.org/dendro-uploads/392126db/sha1/b0/ab/b9/b0abb98eb1b98f6ec3146ffef91eef934b556d8a'

    fname = f'{SPYGLASS_BASE_DIR}/raw/{nwb_file_name}'
    if not os.path.exists(fname):
        _download_file(fname, dandi_file_url)
        sdi.insert_sessions(nwb_file_name)


def _download_file(fname, url):
    print(f'Downloading {url} to {fname}')
    r = requests.get(url)
    with open(fname, 'wb') as f:
        f.write(r.content)


if __name__ == '__main__':
    test_insert_session()
