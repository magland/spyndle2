import dj_init  # noqa: F401


def test_connection():
    import spyglass.common as sgc

    print(sgc.Nwbfile())

    # print(sgc.ElectrodeGroup())

    print(sgc.Session())


if __name__ == '__main__':
    test_connection()
