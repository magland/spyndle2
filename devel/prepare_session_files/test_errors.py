import dj_init  # noqa: F401

import datajoint as dj


def test_connection():
    dj.conn()  # test connection
    print(dj.config)  # check config

    import spyglass.common.common_usage as sgcu

    for e in sgcu.InsertError & {}:
        print(e)


if __name__ == '__main__':
    test_connection()
